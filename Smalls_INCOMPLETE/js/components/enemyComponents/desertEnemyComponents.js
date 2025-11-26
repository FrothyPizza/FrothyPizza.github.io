ECS.Components.DesertKnifeOutlaw = class DesertKnifeOutlaw {
    constructor() {
        this.runSpeed = 0.5;
        this.jumpDelayFrames = 0; // 20 + Math.floor(Math.random() * 15); // 15 to 30 frames
        this.framesPlayerAbove = 0;
    }
}

ECS.Components.DesertGunOutlaw = class DesertGunOutlaw {
    constructor() {
        this.state = 'entering'; // entering, strafing_back, strafing_forward
        this.timer = 100; // 2 seconds entering (2 strafe durations of 60)
        this.strafeTime = 60; // 1 second strafing
        
        this.shootTimer = 0;
        this.shootInterval = 120; // Shoot every 2 seconds

        this.jumpTimer = 0;
        this.jumpInterval = 180; // Try to jump every 3 seconds

        this.currentLevel = 'Middle'; // Top, Middle, Bottom
    }
}

ECS.Components.SpawnSide = class SpawnSide {
    constructor(side = 'left') {
        this.side = side;
    }
}
