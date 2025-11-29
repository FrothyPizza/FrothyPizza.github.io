
// General boss component definitions

ECS.Components.BossState = class BossState {
    constructor() {
        this.state = "IDLE"; // IDLE, ATTACK, VULNERABLE, DEAD
        this.phase = 1;
        this.timer = 0;
    }
}

ECS.Components.BossHealth = class BossHealth {
    constructor(maxHealth = 100) {
        this.maxHealth = maxHealth;
        this.value = maxHealth;
    }
}


