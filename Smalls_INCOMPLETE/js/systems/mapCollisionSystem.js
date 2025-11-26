// Map collision system - handles collision detection and resolution with the tilemap

ECS.Systems.mapCollisionSystem = function (entities, map) {
  Object.values(entities).forEach((entity) => {
    // remove offscreen bullets
    if (entity.has("Bullet")) {
      const position = entity.Position;
      if (
        position.x < 0 ||
        position.x > map.width * map.tilewidth ||
        position.y < 0 ||
        position.y > map.height * map.tileheight
      ) {
        // Remove bullet from scene
        if (
          GlobalState.currentScene &&
          typeof GlobalState.currentScene.removeEntity === "function"
        ) {
          GlobalState.currentScene.removeEntity(entity.id);
        }
        return;
      }
    }

    // Only process entities with necessary components
    if (!entity.has("Position", "Velocity", "Dimensions", "CollidesWithMap"))
      return;
    if (!entity.CollidesWithMap.collides) return;

    const position = entity.Position;
    const velocity = entity.Velocity;
    const dimensions = entity.Dimensions;

    // Update collision state if entity has MapCollisionState component
    if (entity.has("MapCollisionState")) {
      const state = entity.MapCollisionState;
      state.topHit =
        map.pointIsCollidingWithWall(position.x, position.y - 1) ||
        map.pointIsCollidingWithWall(
          position.x + dimensions.width - 1,
          position.y - 1
        );
      state.bottomHit =
        map.pointIsCollidingWithWall(
          position.x,
          position.y + dimensions.height
        ) ||
        map.pointIsCollidingWithWall(
          position.x + dimensions.width - 1,
          position.y + dimensions.height
        ) ||
        map.pointIsCollidingWithOneWayWall(
          position.x,
          position.y + dimensions.height
        ) ||
        map.pointIsCollidingWithOneWayWall(
          position.x + dimensions.width - 1,
          position.y + dimensions.height
        );

      state.bottomTouchingOneWay =
        map.pointIsCollidingWithOneWayWall(
          position.x,
          position.y + dimensions.height
        ) ||
        map.pointIsCollidingWithOneWayWall(
          position.x + dimensions.width - 1,
          position.y + dimensions.height
        );

      // // log one way bottom touching st
      // console.log("Entity", entity.id, "bottomTouchingOneWay:", state.bottomTouchingOneWay);

      //  || (map.pointIsCollidingWithOneWayWall(position.x, position.y + dimensions.height) && !map.pointIsCollidingWithOneWayWall(position.x, position.y + dimensions.height - 1)) ||
      //       (map.pointIsCollidingWithOneWayWall(position.x + dimensions.width - 1, position.y + dimensions.height) && !map.pointIsCollidingWithOneWayWall(position.x + dimensions.width - 1, position.y + dimensions.height - 1));

      state.leftHit =
        map.pointIsCollidingWithWall(position.x - 1, position.y) ||
        map.pointIsCollidingWithWall(
          position.x - 1,
          position.y + dimensions.height - 1
        );
      state.rightHit =
        map.pointIsCollidingWithWall(
          position.x + dimensions.width,
          position.y
        ) ||
        map.pointIsCollidingWithWall(
          position.x + dimensions.width,
          position.y + dimensions.height - 1
        );

      // state.bottomHit =
    }

    // Revert to last position and apply movement with collision detection
    position.x = position.lastPos.x;
    position.y = position.lastPos.y;

    // Apply horizontal movement with collision detection
    moveH(entity, map, velocity.x);

    // Apply vertical movement with collision detection
    moveV(entity, map, velocity.y);
  });
};

// Helper function for horizontal movement with collision detection
function moveH(entity, map, value) {
  const position = entity.Position;
  const velocity = entity.Velocity;
  const dimensions = entity.Dimensions;

  let saveX = position.x;
  let desiredX = round(position.x + value, value);
  let sign = Math.sign(value);
  let modifier = sign == 1 ? dimensions.width - 1 : 0;

  if (round(position.x, value) === desiredX) {
    position.x += value;
    return;
  }

  let iterations = 0;
  while (round(position.x, value) != desiredX) {
    if (
      !map.pointIsCollidingWithWall(position.x + sign + modifier, position.y) &&
      !map.pointIsCollidingWithWall(
        position.x + sign + modifier,
        position.y + dimensions.height - 1
      )
    ) {
      position.x += sign;
    } else {
      // velocity.x = 0;

      if (entity.has("BouncesOffWalls")) {
        // Play sound here (bottle bounces)
        // Sound effect on bounce

        // This causes multiple sounds to play if stuck!
        Loader.playSound("bottlebounce.wav", 0.1);

        const bounceComp = entity.BouncesOffWalls;
        // bounceComp.numberOfBounces += 1;
        velocity.x = -velocity.x * 0.9; // Reverse and reduce vertical velocity
        position.x += sign > 0 ? -1 : 1;
        return;
      } else {
        velocity.x = 0;
      }
      return;
    }
    if (++iterations > 200) {
      console.log("Infinite loop detected in moveH");
      break;
    }
  }
  position.x = saveX + value;
}

// Helper function for vertical movement with collision detection
function moveV(entity, map, value) {
  const position = entity.Position;
  const velocity = entity.Velocity;
  const dimensions = entity.Dimensions;

  let saveY = position.y;
  let desiredY = round(position.y + value, value);
  let sign = Math.sign(value);
  let modifier = sign == 1 ? dimensions.height - 1 : 0;

  if (round(position.y, value) === desiredY) {
    position.y += value;
    return;
  }

  let iterations = 0;
  while (round(position.y, value) != desiredY) {
    if (
      !map.pointIsCollidingWithWall(position.x, position.y + sign + modifier) &&
      !map.pointIsCollidingWithWall(
        position.x + dimensions.width - 1,
        position.y + sign + modifier
      ) &&
      !(
        sign > 0 &&
        map.pointIsCollidingWithOneWayWall(
          position.x,
          position.y + sign + modifier
        ) &&
        !map.pointIsCollidingWithOneWayWall(position.x, position.y + modifier)
      ) &&
      !(
        sign > 0 &&
        map.pointIsCollidingWithOneWayWall(
          position.x + dimensions.width - 1,
          position.y + sign + modifier
        ) &&
        !map.pointIsCollidingWithOneWayWall(
          position.x + dimensions.width - 1,
          position.y + modifier
        )
      )
    ) {
      position.y += sign;
    } else {
      if (entity.has("BouncesOffWalls")) {
        // Play sound here (bottle bounces)
        const bounceComp = entity.BouncesOffWalls;
        bounceComp.numberOfBounces += 1;
        // velocity.y = -Math.abs(velocity.y) * 0.7; // Reverse and reduce vertical velocity
        velocity.y = -velocity.y * 0.7; // Reverse and reduce vertical velocity
        // Slightly adjust position to avoid sticking
        position.y += sign > 0 ? -1 : 1;
        return;
      } else {
        velocity.y = 0;
      }
      return;
    }
    if (++iterations > 200) {
      console.log("Infinite loop detected in moveV");
      break;
    }
  }
  position.y = saveY + value;
}

// Helper function for rounding with direction
function round(x, dir) {
  if (x - Math.floor(x) === 0.5) {
    return dir > 0 ? Math.ceil(x) : Math.floor(x);
  }
  return Math.round(x);
}

// Helper functions for additional collision checks
ECS.Helpers.collidingWithMap = function (entity, map) {
  if (!entity.has("Position", "Dimensions")) return false;

  const position = entity.Position;
  const dimensions = entity.Dimensions;
  let x = Math.round(position.x);
  let y = Math.round(position.y);

  return (
    map.pointIsCollidingWithWall(x, y) ||
    map.pointIsCollidingWithWall(x + dimensions.width - 1, y) ||
    map.pointIsCollidingWithWall(x, y + dimensions.height - 1) ||
    map.pointIsCollidingWithWall(
      x + dimensions.width - 1,
      y + dimensions.height - 1
    )
  );
};

ECS.Helpers.collidingWithBlockType = function (entity, map, type) {
  if (!entity.has("Position", "Dimensions")) return false;

  const position = entity.Position;
  const dimensions = entity.Dimensions;
  let x = Math.round(position.x);
  let y = Math.round(position.y);

  return (
    map.pointIsCollidingWithType(x, y, type) ||
    map.pointIsCollidingWithType(x + dimensions.width - 1, y, type) ||
    map.pointIsCollidingWithType(x, y + dimensions.height - 1, type) ||
    map.pointIsCollidingWithType(
      x + dimensions.width - 1,
      y + dimensions.height - 1,
      type
    )
  );
};

ECS.Helpers.constrainPosition = function (entity, map) {
  if (!entity.has("Position", "Dimensions")) return;

  const position = entity.Position;
  const dimensions = entity.Dimensions;

  if (position.x < 0 - dimensions.width + 1) {
    position.x = 0 - dimensions.width + 1;
  }
  if (position.x > map.width * map.tilewidth - 1) {
    position.x = map.width * map.tilewidth - 1;
  }
  if (position.y < 0 - dimensions.height + 1) {
    position.y = 0 - dimensions.height + 1;
  }
  if (position.y > map.height * map.tileheight - 1) {
    position.y = map.height * map.tileheight - 1;
  }
};

ECS.Helpers.isOffMap = function (entity, map) {
  if (!entity.has("Position", "Dimensions")) return false;

  const position = entity.Position;
  const dimensions = entity.Dimensions;

  return (
    position.x < 0 - dimensions.width ||
    position.x > map.width * map.tilewidth ||
    position.y < 0 - dimensions.height ||
    position.y > map.height * map.tileheight
  );
};
