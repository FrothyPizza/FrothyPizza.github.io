ECS.Systems.bossSystem = function (entities) {
  Object.values(entities).forEach((entity) => {
    if (entity.has("BossState", "BossHealth")) {
      // Generic boss logic or delegation
      if (entity.has("CrazedCowboy")) {
        handleCrazedCowboy(entity);
      }
    }
  });
};

function handleCrazedCowboy(entity) {
  let state = entity.BossState;
  let cowboy = entity.CrazedCowboy;
  let position = entity.Position;
  let velocity = entity.Velocity;
  let sprite = entity.AnimatedSprite;

  if (entity.BossHealth.value <= 3) {
    cowboy.phase = 2;
  } else {
    cowboy.phase = 1;
  }

  if (entity.has("Stunned")) {
    // When stunned, skip behavior
    sprite.setAnimation("Death");
    return;
  }

  if (cowboy.state === "INACTIVE") {
    return;
  }

  if (cowboy.state === "IDLE") {
    velocity.x = 0;
    state.timer++;
    sprite.setAnimation("BottleFlip");

    if (state.timer > 60) {
      cowboy.state = "STRAFE";
      state.timer = 0;
      // Pick a random direction or flip current
      if (position.x >= cowboy.startPos.x) {
        cowboy.strafeDirection = -1;
      } else {
        cowboy.strafeDirection = 1;
      }
      cowboy.strafeTimer = 0;
    }
  } else if (cowboy.state === "STRAFE") {
    velocity.x = cowboy.strafeDirection * 0.25; // Speed
    cowboy.strafeTimer++;

    sprite.setAnimation("Run");

    // Simple bounds check (adjust as needed for the map)
    // Assuming map width is roughly known or we check collisions
    // For now, just reverse if hitting a "wall" logic could be added here
    // But let's just rely on timer for direction change or map collision system to stop him

    if (
      entity.MapCollisionState &&
      (entity.MapCollisionState.left || entity.MapCollisionState.right)
    ) {
      cowboy.strafeDirection *= -1;
    }

    if (cowboy.strafeTimer > cowboy.strafeDuration) {
      cowboy.state = "ATTACK";
      cowboy.strafeTimer = 0;
      cowboy.bottlesThrown = 0;
      cowboy.bottlesToThrow = cowboy.phase; // 1, 2, or 3 bottles
      cowboy.attackTimer = 0;
      velocity.x = 0;
    }
  } else if (cowboy.state === "ATTACK") {
    velocity.x = 0;
    cowboy.attackTimer++;

    if (cowboy.attackTimer > cowboy.throwCooldown) {
      if (cowboy.bottlesThrown < cowboy.bottlesToThrow) {
        let backfire = false;
        if (
          cowboy.totalBottlesThrown > 0 &&
          cowboy.totalBottlesThrown % cowboy.bottlesToThrowBeforeBackfire === 0
        ) {
          backfire = true;
        }
        setFrameTimeout(() => {
          spawnBottle(entity, backfire);
        }, 5);
        cowboy.bottlesThrown++;
        cowboy.attackTimer = 0;
        cowboy.totalBottlesThrown++;

        sprite.setAnimation("Throw");
      } else {
        cowboy.state = "IDLE";
        state.timer = 0;
      }
    }
  }
}

function spawnBottle(bossEntity, backfire = false) {
  // Create a bottle projectile
  // We need a blueprint for this, or just create it here
  let bottle = new ECS.Entity();
  let startX = bossEntity.Position.x + (bossEntity.Dimensions.width - 4);
  let startY = bossEntity.Position.y + 4;

  // "Mostly up and some to the right"

  let speed = 2.2 + Math.random() * 0.2;
  let angle = (-25 - Math.random() * 20) * (Math.PI / 180); // -75 degrees (Up is -90, Right is 0)

  //Play Boss Throwing Sound
  Loader.playSound("gruntthrow.wav", 0.2);

  // console.log("Boss throwing bottle", bossEntity.CrazedCowboy.bottlesThrown);
  if (
    bossEntity.CrazedCowboy.bottlesThrown % 3 === 0 ||
    bossEntity.CrazedCowboy.bottlesThrown % 3 === 2 ||
    bossEntity.CrazedCowboy.bottlesThrown % 3 === 3
  ) {
    angle = (-60 - Math.random() * 10) * (Math.PI / 180); // 75 degrees
    speed = 1.5 + Math.random() * 0.3;
  }

  if (backfire) {
    speed = 2.2 + Math.random() * 0.2;
    angle = (-75 - Math.random() * 5) * (Math.PI / 180); // -75 degrees (Up is -90, Right is 0)
    bottle.addComponent(new ECS.Components.DamagesEnemy(true));
    startX = bossEntity.Position.x + bossEntity.Dimensions.width;
  } else {
    bottle.addComponent(new ECS.Components.DamagesPlayer(true));
  }

  bottle.addComponent(new ECS.Components.Position(startX, startY));
  bottle.addComponent(
    new ECS.Components.Velocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    )
  );
  bottle.addComponent(new ECS.Components.Gravity(0.05));
  bottle.addComponent(new ECS.Components.Dimensions(8, 8));
  bottle.addComponent(new ECS.Components.Hitbox([{ x: 0, y: 0, w: 8, h: 8 }]));
  bottle.addComponent(new ECS.Components.Hurtbox([{ x: 1, y: 1, w: 6, h: 6 }]));

  bottle.addComponent(new ECS.Components.MapCollisionState());
  bottle.addComponent(new ECS.Components.CollidesWithMap(true));
  bottle.addComponent(new ECS.Components.BouncesOffWalls());
  bottle.addComponent(new ECS.Components.SaloonBottle());
  bottle.addComponent(
    new ECS.Components.AnimatedSprite(Loader.spriteSheets.Bottle, "Thrown", 8)
  );

  // Add to scene
  if (GlobalState.sceneManager && GlobalState.sceneManager.currentScene) {
    GlobalState.sceneManager.currentScene.addEntity(bottle);
  }
}
