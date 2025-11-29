ECS.Systems.saloonOutlawSystem = function (entities, map, scene) {
  // Find the player
  let player = null;
  Object.values(entities).forEach((e) => {
    if (e.has("PlayerState")) {
      player = e;
    }
  });

  Object.values(entities).forEach((entity) => {
    if (!entity.has("SaloonKnifeOutlaw")) return;

    const outlaw = entity.SaloonKnifeOutlaw;
    const position = entity.Position;
    const velocity = entity.Velocity;
    const sprite = entity.AnimatedSprite;
    const collision = entity.MapCollisionState;

    // 1. Waiting to pop out
    if (!outlaw.hasPoppedOut) {
      if (outlaw.timeTillPopOut > 0) {
        outlaw.timeTillPopOut--;

        // Add exclamation 30 frames before popping out
        if (outlaw.timeTillPopOut === 60) {
          if (ECS.Helpers.addExclamationToEntity) {
            outlaw.exclamationEntity = ECS.Helpers.addExclamationToEntity(
              entity,
              scene
            );
          }
        }

        // Maybe hide sprite or show "hiding" animation
        // sprite.setAnimation("Hidden");
        return;
      } else {
        // Pop out!
        outlaw.hasPoppedOut = true;
        entity.Velocity.y = outlaw.jumpVelocity;
        // sprite.setAnimation("PopOut"); // If exists
        sprite.paused = false;
        // Reset dash timer
        outlaw.currentDashWait = outlaw.timeToWaitToStartDashing;

        // Remove exclamation if it exists
        if (outlaw.exclamationEntity) {
          if (scene && typeof scene.removeEntity === "function") {
            scene.removeEntity(outlaw.exclamationEntity.id);
          } else {
            ECS.removeEntity(outlaw.exclamationEntity.id);
          }

          // Also remove from BoundEntities to be clean
          if (entity.has("BoundEntities")) {
            const bound = entity.BoundEntities;
            bound.entitiesWithOffsets = bound.entitiesWithOffsets.filter(
              (b) => b.entity.id !== outlaw.exclamationEntity.id
            );
          }

          outlaw.exclamationEntity = null;
        }
      }
    }

    // 2. Popped out behavior
    if (outlaw.hasPoppedOut) {
      if (entity.has("Stunned")) {
        return;
      }

      let leftHit = false;
      // query the map for wall collisions using map.pointIsCollidingWithWall(x, y)
      if (map) {
        // Check left side
        // leftHit = map.pointIsCollidingWithWall(position.x - 1, position.y + 4);
        // // Check right side
        // const rightHit = map.pointIsCollidingWithWall(
        //   position.x + entity.Dimensions.width,
        //   position.y + 4
        // );
        // collision.leftHit = leftHit;
        // collision.rightHit = rightHit;
      }

      // Check for wall collision to stop dashing
      if ((collision.leftHit && velocity.x <= 0) || (collision.rightHit && velocity.x >= 0)) {
        velocity.x = 0;
        // Reset dash wait if we hit a wall and were moving
        if (outlaw.state === "DASHING") {
          outlaw.state = "IDLE";
          outlaw.currentDashWait = outlaw.timeToWaitToStartDashing;
          outlaw.hasPoppedOut = false; // Go back to hiding

          entity.Position.x += collision.leftHit ? 1 : -1; // Nudge out of wall
        }
      }

      // State machine: IDLE vs DASHING
      if (!outlaw.state) outlaw.state = "IDLE";
      if (outlaw.currentDashWait === undefined)
        outlaw.currentDashWait = outlaw.timeToWaitToStartDashing;

      if (outlaw.state === "IDLE") {
        velocity.x = 0;
        sprite.setAnimation("Idle");

        if (outlaw.currentDashWait > 0) {
          outlaw.currentDashWait--;
        } else {
          // Ready to dash? Check player distance
          if (player && player.Position) {
            const dx = player.Position.x - position.x;
            const dy = player.Position.y - position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Check if player is within range (and maybe roughly same Y level?)
            if (dist < outlaw.dashDetectionRange) {
              outlaw.state = "DASHING";
              // Play sound here (start dashing)

              // Determine direction
              outlaw.dashDirection = dx > 0 ? 1 : -1;
            }
          }
        }
      } else if (outlaw.state === "DASHING") {
        sprite.setAnimation("Run"); // Or Dash
        velocity.x = outlaw.dashDirection * outlaw.dashSpeed;
        sprite.direction = outlaw.dashDirection;
      }
    }
  });
};

ECS.Systems.saloonBottleSystem = function (entities, map, scene) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("SaloonBottle")) return;

    if (entity.has("BouncesOffWalls")) {
      if (entity.BouncesOffWalls.numberOfBounces >= 2) {
        // Remove bottle from scene
        if (scene && typeof scene.removeEntity === "function") {
          scene.removeEntity(entity.id);
          Loader.playSound("explosion.wav", 0.08);
        }
      }
    }
  });
};

ECS.Systems.saloonItemCollectibleSystem = function (entities, map, scene) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("SaloonItemCollectible")) return;

    if (entity.SaloonItemCollectible.framesAlive > 45) {
      entity.Velocity.y = 0;
      entity.Velocity.x = 0;
    }

    entity.SaloonItemCollectible.framesAlive++;
  });
};
