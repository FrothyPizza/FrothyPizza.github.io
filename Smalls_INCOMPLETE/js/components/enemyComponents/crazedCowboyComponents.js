ECS.Components.CrazedCowboy = class CrazedCowboy {
    constructor(params = {}) {
        this.phase = params.phase || 1; // 1, 2, 3
        this.state = params.state || "IDLE"; // IDLE, STRAFE, ATTACK, STUNNED, INACTIVE
        this.strafeDirection = params.strafeDirection || 1; // 1 for right, -1 for left
        this.startPos = params.startPos || {x: 0, y: 0};
        this.strafeTimer = 0;
        this.strafeDuration = 60; // How long to strafe before attacking
        
        this.attackTimer = 0;
        this.bottlesThrown = 0;
        this.bottlesToThrow = 0; // Set based on phase
        this.throwCooldown = 30; // Frames between throws in a volley

        this.bottlesToThrowBeforeBackfire = 3; // Number of bottles to throw before one backfires
        this.totalBottlesThrown = 0; // Total bottles thrown across all attacks
        
        // this.health = params.health || 15;
        // this.maxHealth = params.maxHealth || 15;
    }

}
