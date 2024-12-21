
// TurtleEnemy.js

class TurtleEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        super(x, y, 54, 39, 8000); // Adjusted health for TurtleBoss
        this.speed = 0.15;
        this.direction = -1;

        // Animation setup
        this.animationSpeed = 8;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.turtle, "Run", this.animationSpeed);
        this.sprite.isBackwards = true;
        this.sprite.direction = this.direction;

        // Protection aura properties
        this.protectionAuraRadius = 30;

        // Movement properties
        this.jumpSpeed = 4;
        this.gravity = 0.17;
        this.canJump = true;

        // Contracting behavior properties
        this.isContracted = false;
        this.contractTimer = new Clock();
        this.contractTime = 400;
        this.contractTimeRange = { min: 400, max: 600 };

        // Shooting properties
        this.tadpoles = [];
        this.tadpoleSpawnTimer = new Clock();
        this.tadpoleSpawnInterval = 1000; // Milliseconds between tadpole spawns
        this.tadpolesToSpawn = 5; // Number of tadpoles spwaned per interval
        this.spawnsHorizontalTadpoles = false;
        this.rainTadpolesAmount = 0;

        // Stage thresholds
        this.stageThresholds = [
            { health: this.maxHealth * 2 / 3, stage: 2 },
            { health: this.maxHealth / 3, stage: 3 }
        ];

        // Initialize behaviors based on initial stage
        this.setupStage(false); // Stage 1 starts without strength modification
    }

    setupStage(isStronger) {
        switch (this.currentStage) {
            case 1:
                // Stage 1: Basic movement, no tadpoles
                this.tadpolesToSpawn = 2;
                this.tadpoleSpawnInterval = isStronger ? 200 : 300;
                // this.contractTimeRange = isStronger ? { min: 10000000, max: 100000000 } : { min: 100000000, max: 100000000 };
                break;
            case 2:
                // Stage 2: Start shooting tadpoles
                this.tadpolesToSpawn = isStronger ? 2 : 1; // More tadpoles if stronger
                this.tadpoleSpawnInterval = isStronger ? 150 : 200;
                this.contractTimeRange = isStronger ? { min: 400, max: 600 } : { min: 500, max: 700 };
                this.speed = 0.333333;
                this.rainTadpolesAmount = 5;
                // this.spawnsHorizontalTadpoles = true;

                break;
            case 3:
                // Stage 3: Advanced behavior with increased tadpole rate and protection aura
                this.tadpolesToSpawn = isStronger ? 2 : 2; // Even more tadpoles if stronger
                this.tadpoleSpawnInterval = isStronger ? 100 : 150;
                this.contractTimeRange = isStronger ? { min: 200, max: 400 } : { min: 300, max: 500 };
                this.speed = 0.5;
                this.rainTadpolesAmount = 6;
                this.spawnsHorizontalTadpoles = false;
                break;
            default:
                break;
        }
    }

    update(map, entities) {
        super.update(map, entities);
        this.handleShooting(map, entities);
    }

    sharedStageBehavior(map, entities) {
        // Handle direction change upon hitting walls or obstacles
        if (this.collidesWithMap &&
            (this.rightHit || this.leftHit
                || !map.pointIsCollidingWithWall(this.x + this.width - 2, this.y + this.height + 1)
                || !map.pointIsCollidingWithWall(this.x + 2, this.y + this.height + 1))) {
            this.direction *= -1;
            this.x += this.direction;
        }

        // Contract and expand behavior
        if (this.contractTimer.getTime() > this.contractTime && this.currentStage > 1) {
            if (!this.isContracted) {
                this.sprite.setAnimation("Contract");
                this.sprite.nextAnimation = "Idle-Contracted";

                this.sprite.onAnimationComplete = () => {
                    this.hasProtectionAura = true;
                    this.sprite.onAnimationComplete = null;
                };

                this.isContracted = true;
                this.velocity.x = 0;

            }
            else {
                this.sprite.setAnimation("Run");
                this.isContracted = false;

                this.hasProtectionAura = false;
            }

            this.contractTimer.restart();
            this.contractTime = Math.random() * (this.contractTimeRange.max - this.contractTimeRange.min) + this.contractTimeRange.min;
        }

        // If not contracted, move
        if (!this.isContracted) {
            this.velocity.x = this.speed * this.direction;
            this.sprite.direction = this.direction;
            this.sprite.setAnimation("Run");
        }
    }

    stage1Behavior(map, entities) {
        // No additional behavior in stage 1
    }

    stage2Behavior(map, entities) {
        // No additional behavior; shooting handled in sharedStageBehavior
    }

    stage3Behavior(map, entities) {
        // No additional behavior; protection aura handled in sharedStageBehavior
    }

    handleShooting(map, entities) {
        // if (this.currentStage < 2) return; // Only shoot in stage 2 and above

        let shootTimeModifier = this.isContracted ? 0.5 : 1;
        if (this.tadpoleSpawnTimer.getTime() > this.tadpoleSpawnInterval * shootTimeModifier) {
            for(let i = 0; i < this.tadpolesToSpawn; i++) {
                this.spawnTadpole(entities);
            }
            this.tadpoleSpawnTimer.restart();

            if(this.currentStage === 3 || this.currentStage === 2) {
                this.rainTadpoles(map, entities);
            }

        }
    }

    spawnTadpole(entities) {
        // const tadpole = new TurtleTadpoleEnemy(this.x + this.width/2, this.y + this.height/2, this.direction);
        // spawn the tadpole from its butt, i.e. the outer edge of the sprite away from where it's facing
        const tadpole = new TurtleTadpoleEnemy(this.x + this.width/2 + this.width/3 * -this.direction, this.y + this.height/2, this.direction);
        this.tadpoles.push(tadpole);
        currentScene.addEntity(tadpole); // Assuming currentScene manages entities
    }

    removeAllTadpoles() {
        this.tadpoles.forEach(tadpole => {
            tadpole.dead = true;
        });
        this.tadpoles = [];
    }

    rainTadpoles(map, entities) {
        // spawn tadpoles evenly spaced at the top of the screen with downward and either slight left or right velocity
        let xVel = Math.random() > 0.5 ? 0.25 : -0.25;
        // let tadpoles = this.tadpolesToSpawn * 4;
        let tadpoles = this.rainTadpolesAmount;
        console.log(tadpoles);
        let xSpacing = 240/tadpoles;
        console.log(xSpacing);
        for (let i = 0; i < tadpoles; i++) {
            const tadpole = new TurtleTadpoleEnemy(i * xSpacing + xSpacing/2, 0, 1);
            tadpole.velocity.y = 1.5;
            tadpole.velocity.x = xVel;
            tadpole.targetsPlayer = false;
            tadpole.gravity = 0;
            tadpole.maxHealth = 50; tadpole.health = 50;
            tadpole.collidesWithMap = false;
            this.tadpoles.push(tadpole);
            currentScene.addEntity(tadpole);
            
        }

        if(this.spawnsHorizontalTadpoles) {
            // spawn tadpoles evenly spaced at the top of the screen with downward and either slight left or right velocity
            let yVel = 0;
            let ySpacing = 196/tadpoles;
            for (let i = 0; i < tadpoles; i++) {
                const tadpole = new TurtleTadpoleEnemy(0, i * ySpacing + ySpacing/2 + 8, 1);
                tadpole.velocity.x = 1.5;
                tadpole.velocity.y = yVel;
                tadpole.targetsPlayer = false;
                tadpole.gravity = 0;
                tadpole.collidesWithMap = false;
                this.tadpoles.push(tadpole);
                currentScene.addEntity(tadpole);
            }
        }
    }


    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);

        // Draw protection aura if active
        if (this.hasProtectionAura) {
            context.strokeStyle = "rgba(0, 255, 255, 0.5)";
            context.beginPath();
            context.arc(this.x + this.width / 2, this.y + this.height / 2, this.protectionAuraRadius, 0, 2 * Math.PI);
            context.stroke();
        }
    }

    onDeath() {
        // Remove all tadpoles upon death
        this.removeAllTadpoles();
    }

    interactWith(other) {

    }
}



// TurtleTadpoleEnemy.js

class TurtleTadpoleEnemy extends Enemy {
    constructor(x, y, direction) {
        super(x, y, 6, 6, 150); // Adjusted size and health
        this.speed = 0.5;
        this.direction = direction; // 1 for right, -1 for left

        // Animation setup
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.tadpole, "Run", this.animationSpeed);

        // Zig-Zag movement properties
        this.zigZagAmplitude = 40 + Math.random() * 40; // Amplitude of the zig-zag
        this.zigZagFrequency = 0.05 + Math.random() * 0.1; // Frequency of the zig-zag
        this.zigZagTimer = 0;

        // Target reference (player)
        this.target = null;
        this.targetsPlayer = true;
    }

    update(map, entities) {
        super.update(map, entities);

        if(this.dead) return;

        // Acquire target (player)
        if (!this.target) {
            // this.target = findPlayer(entities); // Assuming a function to find the player
        }

        // if offscreen, remove
        if (this.isOffMap(map)) {
            // this.dead = true;
            this.removeFromScene = true;
        }

        // Zig-Zag movement towards the target
        this.zigZagTimer += this.zigZagFrequency;
        const zigZagOffset = Math.sin(this.zigZagTimer) * this.zigZagAmplitude;

        // Calculate velocity towards the player with zig-zag
        if (this.target && this.targetsPlayer) {
            this.direction = this.target.x > this.x ? 1 : -1;
            this.sprite.direction = this.direction;

            const deltaX = this.target.x - this.x;
            const deltaY = this.target.y - this.y;

            // Normalize direction
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
            const normX = deltaX / distance;
            const normY = deltaY / distance;

            // Apply zig-zag offset perpendicular to the direction
            const perpendicularX = -normY;
            const perpendicularY = normX;

            this.velocity.x = (normX * this.speed) + (perpendicularX * (zigZagOffset / 100));
            this.velocity.y = normY * this.speed + (perpendicularY * (zigZagOffset / 100));
        }

        // Update sprite animation
        // this.sprite.setAnimation("Run");
    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }

    interactWith(other) {
        // Define interactions, e.g., damage player on collision
        if (other instanceof Player) {
            this.target = other;
        }
    }
}

// Helper function to find the player in entities
function findPlayer(entities) {
    return entities.find(entity => entity instanceof Player) || null;
}
