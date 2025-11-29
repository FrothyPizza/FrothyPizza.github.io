// Player systems - handles player-specific behavior

// Player physics system - applies friction and thresholds
ECS.Systems.playerPhysicsSystem = function (entities) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("PlayerMovement", "Velocity", "MapCollisionState")) return;

    const movement = entity.PlayerMovement;
    const velocity = entity.Velocity;
    const collision = entity.MapCollisionState;

    // Apply friction
    velocity.x *= movement.friction;

    // Stop on ground if slow enough and apply threshold
    if (collision.bottomHit && Math.abs(velocity.x) < 0.5) {
      velocity.x = 0;
    }
    if (Math.abs(velocity.x) < movement.xVelLowerThreshold) {
      velocity.x = 0;
    }
  });
};

// Player jump system
ECS.Systems.playerJumpSystem = function (entities, map) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("PlayerJump", "Velocity", "MapCollisionState")) return;

    const jump = entity.PlayerJump;
    const velocity = entity.Velocity;
    const collision = entity.MapCollisionState;
    const spawn = entity.PlayerSpawn;

    // Track grounded positions
    if (collision.bottomHit && spawn) {
      jump.jumpGracePeriodTimer.restart();
      spawn.lastGroundedPositions.push({
        x: entity.Position.x,
        y: entity.Position.y,
      });
      if (spawn.lastGroundedPositions.length > 8) {
        spawn.lastGroundedPositions.shift();
      }
    }

    // Reset jump ability when not pressing jump
    if (!Inputs.jump) {
      jump.canJump = true;
    }

    // Initiate jump
    if (
      (collision.bottomHit ||
        jump.jumpGracePeriodTimer.getTime() < jump.jumpGracePeriodFrames) &&
      Inputs.jump &&
      jump.canJump &&
      velocity.y >= -0.1
    ) {
      velocity.y = -jump.jumpSpeed;
      jump.hasCutJumpVelocity = false;
      jump.jumpHoldTimer.restart();
      jump.canJump = false;
      Loader.playSound("jump.wav", 0.1);
    }

    // Hold jump for variable height
    if (jump.jumpHoldTimer.getTime() < jump.maxJumpHoldTime && Inputs.jump) {
      velocity.y = -jump.jumpSpeed;
      if (collision.topHit) {
        jump.hasCutJumpVelocity = true;
        jump.jumpHoldTimer.add(10000);
      }
    } else if (
      !jump.hasCutJumpVelocity &&
      jump.jumpHoldTimer.getTime() < jump.maxJumpHoldTime
    ) {
      jump.jumpHoldTimer.add(10000);
      velocity.y *= jump.jumpReleaseMultiplier;
      jump.hasCutJumpVelocity = true;
    }
  });
};

// Player movement system
ECS.Systems.playerMovementSystem = function (entities) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("PlayerMovement", "Velocity", "AnimatedSprite", "Position"))
      return;

    const movement = entity.PlayerMovement;
    const velocity = entity.Velocity;
    const sprite = entity.AnimatedSprite;
    const position = entity.Position;

    let moved = false;
    // Move left
    if (
      Inputs.left &&
      Math.abs(velocity.x) < movement.speed &&
      velocity.x <= 0.5
    ) {
      velocity.x = -movement.speed;
      sprite.direction = -1;
      moved = true;
    }

    // Move right
    if (
      Inputs.right &&
      Math.abs(velocity.x) < movement.speed &&
      velocity.x >= -0.5
    ) {
      velocity.x = movement.speed;
      sprite.direction = 1;
      moved = true;
    }

    if (!moved && Math.abs(velocity.x) <= movement.speed) {
      velocity.x = 0;
    }

    if (entity.has("MapCollisionState")) {
      const collision = entity.MapCollisionState;
      // If touching one-way platform from above, allow fall through
      if (collision.bottomTouchingOneWay && Inputs.down && !(GlobalState.currentScene instanceof SaloonScene)) {
        entity.Position.y += 1;
        entity.Position.lastPos.y += 1;
        // console.log("Falling through one-way platform");
      }
    }
  });
};

// Player dash system
ECS.Systems.playerDashSystem = function (entities, map) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("PlayerDash", "Velocity", "AnimatedSprite", "Gravity"))
      return;

    const dash = entity.PlayerDash;
    const velocity = entity.Velocity;
    const sprite = entity.AnimatedSprite;
    const gravity = entity.Gravity;

    if (!dash.canDash) return;

    // let isOnGroundOrWithin6pxOfGroundWithDownVelocity = false;
    // if (entity.has('MapCollisionState') && map) {
    //     const collision = entity.MapCollisionState;
    //     isOnGroundOrWithin6pxOfGroundWithDownVelocity = collision.bottomHit ||
    //         (collision.nextBottomHit && velocity.y >= 0 && collision.nextBottomHitDistance <= 6);
    // }

    // Initiate dash
    if (
      !dash.isDashing &&
      Inputs.dash &&
      dash.dashClock.getTime() > dash.dashCooldown
    ) {
      dash.isDashing = true;
      dash.dashTimer.restart();
      velocity.x = sprite.direction * dash.dashSpeed;
      Loader.playSound("dash01.wav", 0.1);
    }

    // While dashing
    if (dash.isDashing) {
      // velocity.y = 0;
      velocity.x = sprite.direction * dash.dashSpeed;
      // gravity.gravity.y = entity.Gravity.constructor.defaultGravity / 2;

      // set is jumping to false to prevent contiuation of upward jump
      if (entity.has("PlayerJump") && velocity.y < 0) {
        entity.PlayerJump.jumpHoldTimer.add(10000);
        velocity.y = 0;
      }

      // End dash after duration
      if (dash.dashTimer.getTime() > dash.dashDuration) {
        dash.isDashing = false;
        dash.dashClock.restart();
        velocity.x = 0;
        gravity.gravity.y = entity.Gravity.constructor.defaultGravity || 0.12;
      }

      // Cancel dash on opposite input or if trying to jump and on ground
      if (
        (velocity.x > 0 && Inputs.left) ||
        (velocity.x < 0 && Inputs.right) ||
        (Inputs.jump &&
          entity.has("MapCollisionState") &&
          entity.MapCollisionState.bottomHit)
      ) {
        dash.isDashing = false;
        dash.dashClock.restart();
        velocity.x = 0;
        gravity.gravity.y = entity.Gravity.constructor.defaultGravity || 0.12;
      }
    }
  });
};

// Player flying system
ECS.Systems.playerFlyingSystem = function (entities) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("PlayerFlying", "Velocity", "Gravity", "PlayerMovement"))
      return;

    const flying = entity.PlayerFlying;
    const velocity = entity.Velocity;
    const gravity = entity.Gravity;
    const movement = entity.PlayerMovement;

    if (!flying.flyingMode) return;

    gravity.gravity.y = 0;
    velocity.x = 0;
    velocity.y = 0;

    if (Inputs.up) {
      velocity.y = -movement.speed - 0.125;
    }
    if (Inputs.down) {
      velocity.y = movement.speed + 0.25;
    }
  });
};

// Player spike damage system
ECS.Systems.playerSpikeDamageSystem = function (entities, map) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("PlayerSpikeDamage", "Position", "Dimensions")) return;

    const spike = entity.PlayerSpikeDamage;
    const position = entity.Position;
    const dimensions = entity.Dimensions;

    // Check spike collision
    if (
      map.pointIsCollidingWithSpikes(position.x, position.y) ||
      map.pointIsCollidingWithSpikes(
        position.x + dimensions.width - 1,
        position.y
      ) ||
      map.pointIsCollidingWithSpikes(
        position.x,
        position.y + dimensions.height - 1
      ) ||
      map.pointIsCollidingWithSpikes(
        position.x + dimensions.width - 1,
        position.y + dimensions.height - 1
      )
    ) {
      spike.framesTouchingSpike++;
    } else {
      spike.framesTouchingSpike = 0;
    }

    // Take damage if touching spikes too long
    if (spike.framesTouchingSpike >= spike.framesAllowedTouchSpike) {
      if (entity.has("PlayerLives", "PlayerInvincibility")) {
        ECS.Helpers.playerTakeDamage(entity);
      }
    }
  });
};

// Player off-map system
ECS.Systems.playerOffMapSystem = function (entities, map) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("Position", "PlayerSpawn", "PlayerLives", "Velocity"))
      return;

    const position = entity.Position;
    const spawn = entity.PlayerSpawn;
    const velocity = entity.Velocity;

    if (position.y > map.height * map.tileheight - 6) {
      if (
        entity.PlayerLives.lives > 0 &&
        spawn.lastGroundedPositions.length > 0
      ) {
        position.x = spawn.lastGroundedPositions[0].x;
        position.y = spawn.lastGroundedPositions[0].y;
      }
      ECS.Helpers.playerTakeDamage(entity, 10);
      velocity.x = 0;
      velocity.y = 0;
    }
  });
};

// Player invincibility system
ECS.Systems.playerInvincibilitySystem = function (entities) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("PlayerInvincibility")) return;

    const invincibility = entity.PlayerInvincibility;

    if (
      invincibility.isInvincible &&
      invincibility.invincibilityTimer.getTime() >
        invincibility.invincibilityDuration
    ) {
      invincibility.isInvincible = false;
    }
  });
};

// Player state machine system
ECS.Systems.playerStateMachineSystem = function (entities) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("PlayerState", "Velocity", "MapCollisionState")) return;

    const state = entity.PlayerState;
    const velocity = entity.Velocity;
    const collision = entity.MapCollisionState;
    const dead = entity.has("Dead") ? entity.Dead.dead : false;

    // Determine state
    if (dead) {
      state.state = PLAYER_STATES.DEAD;
    } else if (entity.has("PlayerDash") && entity.PlayerDash.isDashing) {
      state.state = PLAYER_STATES.DASHING;
    } else if (entity.has("PlayerFlying") && entity.PlayerFlying.flyingMode) {
      state.state = PLAYER_STATES.FLYING;
    } else if (
      !collision.bottomHit &&
      ((collision.rightHit && Inputs.right) ||
        (collision.leftHit && Inputs.left))
    ) {
      state.state = PLAYER_STATES.WALL_SLIDING;
    } else if (
      entity.has("PlayerGlide") &&
      !collision.bottomHit &&
      Inputs.jump &&
      velocity.y > 0 &&
      velocity.y === entity.PlayerGlide.glideFallSpeed
    ) {
      state.state = PLAYER_STATES.GLIDING;
    } else if (!collision.bottomHit && velocity.y < 0) {
      state.state = PLAYER_STATES.JUMPING;
    } else if (!collision.bottomHit && velocity.y > 0) {
      state.state = PLAYER_STATES.FALLING;
    } else if (Inputs.left || Inputs.right) {
      state.state = PLAYER_STATES.RUNNING;
    } else {
      state.state = PLAYER_STATES.IDLE;
    }
  });
};

// Player animation system
ECS.Systems.playerAnimationSystem = function (entities) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("PlayerState", "AnimatedSprite")) return;

    const state = entity.PlayerState;
    const sprite = entity.AnimatedSprite;

    switch (state.state) {
      case PLAYER_STATES.IDLE:
        sprite.setAnimation("Idle");
        break;
      case PLAYER_STATES.RUNNING:
        sprite.setAnimation("Run");
        break;
      case PLAYER_STATES.JUMPING:
        sprite.setAnimation("Jump");
        break;
      case PLAYER_STATES.FALLING:
        sprite.setAnimation("Fall");
        break;
      case PLAYER_STATES.DASHING:
        sprite.setAnimation("Roll");
        break;
      case PLAYER_STATES.WALL_SLIDING:
        sprite.setAnimation("Wall Grab");
        break;
      case PLAYER_STATES.GLIDING:
        sprite.setAnimation("Feather Fall");
        break;
      case PLAYER_STATES.FLYING:
        sprite.setAnimation("Feather Fall");
        break;
      case PLAYER_STATES.DEAD:
        sprite.setAnimation("Idle");
        break;
    }
  });
};

// Helper function for player taking damage
ECS.Helpers.playerTakeDamage = function (entity, shake) {
  if (!entity.has("PlayerLives", "PlayerInvincibility")) return;

  const lives = entity.PlayerLives;
  const invincibility = entity.PlayerInvincibility;
  const dead = entity.has("Dead") ? entity.Dead : null;

  if (invincibility.isInvincible || (dead && dead.dead)) return;

  //Not playing
  Loader.playSound("deathSound.wav", 0.3);

  if (lives.lives > 0) {
    // shakeScreen(shake || 10); // Implement if you have this function
    lives.lives--;
    invincibility.isInvincible = true;
    invincibility.invincibilityTimer.restart();
  } else if (lives.lives <= 0) {
    // Handle death
    if (dead) dead.dead = true;
    if (entity.has("CollidesWithMap")) {
      entity.CollidesWithMap.collides = false;
    }
    if (entity.has("Velocity", "AnimatedSprite")) {
      entity.Velocity.x = -entity.AnimatedSprite.direction * 3;
      entity.Velocity.y = -3;
      entity.AnimatedSprite.paused = true;
    }
  }
};

ECS.Systems.playerAttackSystem = function (entities, map) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("PlayerState", "BoundEntities")) return;

    const bound = entity.BoundEntities;
    let gunEntity = null;
    let lassoEntity = null;

    // Find weapon entities
    bound.entitiesWithOffsets.forEach((b) => {
      if (b.entity && b.entity.has("Weapon")) {
        if (b.entity.Weapon.type === "Gun") gunEntity = b.entity;
        if (b.entity.Weapon.type === "Lasso") lassoEntity = b.entity;
      }
    });

    // Handle Gun Input
    if (Inputs.shoot && entity.PlayerState.hasCollectedGun && gunEntity) {
      const weapon = gunEntity.Weapon;
      if (weapon.cooldownTimer.getTime() > weapon.cooldown) {
        // Attack!
        weapon.cooldownTimer.restart();
        gunEntity.AnimatedSprite.hidden = false;
        gunEntity.AnimatedSprite.setAnimation("Shoot"); // Assuming 'Shoot' animation exists
        gunEntity.AnimatedSprite.restartAnimation();

        gunEntity.AnimatedSprite.onAnimationComplete = () => {
          gunEntity.AnimatedSprite.setAnimation("Idle");
          gunEntity.onAnimationComplete = null;
          gunEntity.AnimatedSprite.hidden = true;
        };

        // Hide lasso if switching
        if (lassoEntity) lassoEntity.AnimatedSprite.hidden = true;

        // Spawn Bullet Logic Here (Placeholder)
        // ECS.Blueprints.createBullet(...)
        // Play sound here
        Loader.playSound("gunshot.wav", 0.2);
        // console.log("Bang!");

        let bullet = ECS.Blueprints.createBullet(
          entity.Position.x +
            (gunEntity.AnimatedSprite.direction === 1 ? 14 : -6),
          entity.Position.y + 4,
          gunEntity.AnimatedSprite.direction,
          2
        );
        GlobalState.currentScene.addEntity(bullet);
      }
    }

    // Handle Lasso Input
    if (Inputs.whip && entity.PlayerState.hasCollectedLasso && lassoEntity) {
      const weapon = lassoEntity.Weapon;
      if (weapon.cooldownTimer.getTime() > weapon.cooldown) {
        // Attack!
        weapon.cooldownTimer.restart();
        lassoEntity.AnimatedSprite.hidden = false;
        lassoEntity.AnimatedSprite.setAnimation("Attack2"); // Assuming 'Whip' animation exists
        lassoEntity.AnimatedSprite.restartAnimation();
        // lassoEntity.Hurtbox.boxes = [{ x: 0, y: 0, w: 16, h: 8 }]; // Enable hurtbox during attack
        lassoEntity.addComponent(new ECS.Components.Hurtbox([{x: 0, y: 0, w: 16, h: 8}]));

        lassoEntity.AnimatedSprite.onAnimationComplete = () => {
          lassoEntity.AnimatedSprite.setAnimation("Idle");
          lassoEntity.onAnimationComplete = null;
          lassoEntity.AnimatedSprite.hidden = true;
          // lassoEntity.Hurtbox.boxes = []; // Disable hurtbox after attack
          if(lassoEntity.has('Hurtbox'))
            lassoEntity.removeComponent('Hurtbox');
        };

        // Hide gun if switching
        if (gunEntity) gunEntity.AnimatedSprite.hidden = true;

        // Play sound here
        // console.log("Whip!");
        Loader.playSound("whip.wav", 0.2);
      }
    }

    // Hide weapons after animation finishes (optional, or keep last used visible)
    // For now, let's keep the last used weapon visible but idle?
    // Or if the user wants them hidden when not attacking:

    //     if (gunEntity && !gunEntity.AnimatedSprite.hidden) {
    //          if (gunEntity.AnimatedSprite.currentAnimation === "Shoot" &&
    //              gunEntity.AnimatedSprite.currentFrame === gunEntity.AnimatedSprite.currentAnimationTo) {
    //              // Animation finished
    //              gunEntity.AnimatedSprite.setAnimation("Idle");
    //              gunEntity.AnimatedSprite.hidden = true; // Uncomment to hide after shooting
    //          }
    //     }

    //     if (lassoEntity && !lassoEntity.AnimatedSprite.hidden) {
    //         if (lassoEntity.AnimatedSprite.currentAnimation === "Whip" &&
    //             lassoEntity.AnimatedSprite.currentFrame === lassoEntity.AnimatedSprite.currentAnimationTo) {
    //             // Animation finished
    //             lassoEntity.AnimatedSprite.setAnimation("Idle");
    //             lassoEntity.AnimatedSprite.hidden = true; // Uncomment to hide after whipping
    //         }
    //    }
  });
};

ECS.Systems.bulletSystem = function (entities) {
  Object.values(entities).forEach((entity) => {
    if (!entity.has("Bullet")) return;

    const bullet = entity.Bullet;
    bullet.framesLeft--;

    if (bullet.framesLeft <= 0) {
      entity.addComponent(new ECS.Components.RemoveFromScene(true));
    }
  });
};

/**
 * To be run before any physics or movement systems
 * @param {*} entities
 * @param {*} map
 */
ECS.Systems.ComposedPlayerPhysicsSystem = function (entities, map) {
  ECS.Systems.playerPhysicsSystem(entities);
  ECS.Systems.playerDashSystem(entities, map);
  ECS.Systems.playerJumpSystem(entities, map);
  ECS.Systems.playerMovementSystem(entities);
  // ECS.Systems.playerGlideSystem(entities, map);
  ECS.Systems.playerFlyingSystem(entities);
};
