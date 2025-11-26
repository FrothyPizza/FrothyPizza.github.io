
// Player-specific components

// Player state machine
const PLAYER_STATES = {
    IDLE: "IDLE",
    RUNNING: "RUNNING",
    JUMPING: "JUMPING",
    FALLING: "FALLING",
    DASHING: "DASHING",
    WALL_SLIDING: "WALL_SLIDING",
    GLIDING: "GLIDING",
    FLYING: "FLYING",
    DEAD: "DEAD"
};

ECS.Components.PlayerState = class PlayerState {
    constructor() {
        this.state = PLAYER_STATES.IDLE;
        this.hasCollectedLasso = false;
        this.hasCollectedGun = false;
        this.score = 0;
    }
}

ECS.Components.PlayerMovement = class PlayerMovement {
    constructor() {
        this.defaultSpeed = 0.666;
        this.speed = 0.66666666666;
        this.friction = 0.94;
        this.xVelLowerThreshold = 0.3;
    }
}

ECS.Components.PlayerJump = class PlayerJump {
    constructor() {
        this.jumpSpeed = 1.9;
        this.maxJumpHoldTime = 11;
        this.jumpHoldTimer = new Clock();
        this.jumpHoldTimer.add(this.maxJumpHoldTime + 6);
        this.hasCutJumpVelocity = false;
        this.canJump = true;
        this.jumpReleaseMultiplier = 0.7;
        this.jumpGracePeriodFrames = 5;
        this.jumpGracePeriodTimer = new Clock();
    }
}


ECS.Components.PlayerDash = class PlayerDash {
    constructor() {
        this.canDash = false;
        this.dashSpeed = 2;
        this.dashDuration = 15;
        this.dashCooldown = 20;
        this.isDashing = false;
        this.dashTimer = new Clock();
        this.dashClock = new Clock();
    }
}



ECS.Components.PlayerLives = class PlayerLives {
    constructor(maxLives = 3) {
        this.maxLives = maxLives;
        this.lives = maxLives;
    }
}

ECS.Components.PlayerInvincibility = class PlayerInvincibility {
    constructor() {
        this.isInvincible = false;
        this.invincibilityDuration = 60;
        this.invincibilityTimer = new Clock();
    }
}

ECS.Components.PlayerSpawn = class PlayerSpawn {
    constructor(x, y) {
        this.spawnX = x;
        this.spawnY = y;
        this.lastGroundedPositions = [{ x, y }, { x, y }];
    }
}

ECS.Components.PlayerFlying = class PlayerFlying {
    constructor() {
        this.flyingMode = false;
    }
}

ECS.Components.PlayerSpikeDamage = class PlayerSpikeDamage {
    constructor() {
        this.framesAllowedTouchSpike = 2;
        this.framesTouchingSpike = 0;
    }
}

ECS.Components.PlayerEnemyCollision = class PlayerEnemyCollision {
    constructor() {
        this.framesCollidingWithEnemy = 0;
        this.allowedFramesCollidingWithEnemy = 4;
    }
}



/**
 * @param {string} type - 'Gun' or 'Lasso'
 * @param {number} cooldown - frames between uses
 */
ECS.Components.Weapon = class Weapon {
    constructor(type, cooldown = 30) {
        this.type = type; // 'Gun' or 'Lasso'
        this.cooldown = cooldown; // frames between uses
        this.cooldownTimer = new Clock();
        this.isAttacking = false;
    }
}