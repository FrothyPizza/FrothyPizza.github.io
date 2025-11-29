// Components for game-specific state and flags

ECS.Components.Dead = class Dead {
    constructor(dead = false) {
        this.dead = dead;
    }
}

ECS.Components.InvincibilityFrames = class InvincibilityFrames {
    constructor(duration = 0) {
        this.duration = duration;
    }
}

ECS.Components.RemoveFromScene = class RemoveFromScene {
    constructor(remove = false) {
        this.remove = remove;
    }
}

ECS.Components.IsEnemy = class IsEnemy {
    constructor(isEnemy = false) {
        this.isEnemy = isEnemy;
    }
}


ECS.Components.CollidesWithMap = class CollidesWithMap {
    constructor(collides = true) {
        this.collides = collides;
    }
}

ECS.Components.MapCollisionState = class MapCollisionState {
    constructor() {
        this.bottomHit = false; // touching the ground
        this.topHit = false;    // hitting ceiling
        this.leftHit = false;   // touching left wall
        this.rightHit = false;  // touching right wall
        this.bottomTouchingOneWay = false; // touching one-way platform
    }
}

ECS.Components.BouncesOffWalls = class BouncesOffWalls {
    constructor() {
        this.numberOfBounces = 0;
    }
}


/**
 * Bound Entities Component; entities stored in this component will have their positions
 * bound to the parent entity's position.
 * 
 * Pass in entitiesWithOffsets as an array of objects with the following structure:
 * [
 *   { entity: <ECS.Entity>, offsetX: <number>, offsetY: <number> },
 *   ...
 * ]
 */
ECS.Components.BoundEntities = class BoundEntities {
    constructor(entitiesWithOffsets = []) {
        this.entitiesWithOffsets = entitiesWithOffsets;
    }
}

/**
 * Stunned Component; handles knockback and daze states for stunned entities.
 * @param {Object} knockbackVelocity - The velocity to apply during knockback phase.
 * @param {number} knockbackDuration - Duration of the knockback phase in frames.
 * @param {number} dazeDuration - Duration of the daze phase in frames.
 * @param {boolean} removeOnComplete - Whether to remove the entity after stunned sequence.
 */
ECS.Components.Stunned = class Stunned {
    constructor(knockbackVelocity = {x: 0, y: 0}, knockbackDuration = 20, dazeDuration = 90, removeOnComplete = false) {
        this.knockbackVelocity = knockbackVelocity;
        this.knockbackDuration = knockbackDuration;
        this.dazeDuration = dazeDuration;
        this.removeOnComplete = removeOnComplete;
        
        this.state = 'INIT'; // INIT, KNOCKBACK, DAZED, FINISHED
        this.timer = 0;
    }
}

ECS.Components.CausesStun = class CausesStun {
    constructor(duration = 90) {
        this.duration = duration;
    }
}

ECS.Components.Checkpoint = class Checkpoint {
    constructor(id = "") {
        this.id = id;
    }
}

ECS.Components.Bullet = class Bullet {
    constructor(lifetime = 200) {
        this.framesLeft = lifetime;
    }
}

ECS.Components.ScoreText = class ScoreText {
    constructor(text, color = 'yellow', duration = 60, floatSpeed = 0.5) {
        this.text = text;
        this.color = color;
        this.duration = duration;
        this.floatSpeed = floatSpeed;
        this.timer = 0;
    }
}

ECS.Components.DoNotSave = class DoNotSave {
    constructor() {
        this.flag = true;
    }
}