// CorgiEnemy.js

class CorgiEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        super(x, y, 48, 32, 6000); // Adjust health as needed
        this.speed = 0.5; // Speed for walking back to spawn position


        // Animation setup
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.corgi, "Idle", this.animationSpeed);
        this.sprite.isBackwards = true; // Facing left by default
        this.sprite.direction = -1; // Facing left

        // Summoning sheep properties
        this.sheepSummonTimer = new Clock();
        this.sheepSummonInterval = 2000; // Adjust as needed
        this.sheepEntities = [];

        // Pouncing properties
        this.isPouncing = false;
        this.pounceTimer = new Clock();
        this.pounceCooldown = 400; // Time between pounces
        this.isWalkingBack = false;
        this.canJumpWhileWalkingBack = false;

        // Stage thresholds
        this.stageThresholds = [
            { health: this.maxHealth * 2 / 3, stage: 2 },
            { health: this.maxHealth / 3, stage: 3 }
        ];

        // Initialize behaviors based on initial stage
        this.setupStage(false); // Stage 1 starts without strength modification

        // The Corgi does not collide with the map and does not have gravity
        this.collidesWithMap = true;
        this.gravity = this.defaultGravity / 2; // Enable gravity for jumping

        // Save the initial spawn position for returning
        this.spawnPosition = { x: x, y: y };
    }

    setupStage(isStronger) {
        switch (this.currentStage) {
            case 1:
                this.sheepSummonInterval = isStronger ? 30000 : 40000; // Adjust as needed
                this.sheepSummonTimer.add(1000);

                this.pounceCooldown = isStronger ? 200 : 250;

                this.jumpHeight = 50;
                break;
            case 2:
                this.sheepSummonInterval = isStronger ? 200 : 300;
                this.pounceCooldown = isStronger ? 200 : 250;
                this.canJumpWhileWalkingBack = isStronger;

                this.jumpHeight = 40;
                break;
            case 3:
                this.sheepSummonInterval = isStronger ? 100 : 200;
                this.pounceCooldown = isStronger ? 60 : 150;
                this.canJumpWhileWalkingBack = true;

                this.jumpHeight = 35;   
                break;
            default:
                break;
        }
    }

    update(map, entities) {
        super.update(map, entities);

        // if (this.isAskingRiddle || this.isSpeaking) {
        //     // Skip updating behaviors if asking a riddle
        //     return;
        // }

        // // Handle initial riddle
        // if (!this.initialRiddleAsked && this.currentStage === 0) {
        //     this.spawnInitialRiddle();
        //     return;
        // }

        // // Check for stage transitions based on health
        // for (let threshold of this.stageThresholds) {
        //     if (this.health <= threshold.health && this.currentStage < threshold.stage && !this.riddleAskedForStage[threshold.stage]) {
        //         this.spawnStageRiddle(threshold.stage);
        //         this.riddleAskedForStage[threshold.stage] = true;
        //         break;
        //     }
        // }

        // // Proceed with shared behaviors
        // this.sharedStageBehavior(map, entities);

        // // Update based on the current stage
        // switch (this.currentStage) {
        //     case 1:
        //         this.stage1Behavior(map, entities);
        //         break;
        //     case 2:
        //         this.stage2Behavior(map, entities);
        //         break;
        //     case 3:
        //         this.stage3Behavior(map, entities);
        //         break;
        //     default:
        //         // No stage-specific behavior for stage 0 (initial)
        //         break;
        // }
    }

    sharedStageBehavior(map, entities) {
        if (this.isPouncing || this.isWalkingBack) {
            // Disable sheep summoning while pouncing or walking back
            return;
        }

        // Handle sheep summoning
        if (this.sheepSummonTimer.getTime() > this.sheepSummonInterval
            && !this.isPouncing && !this.isWalkingBack) {
            this.spawnSheep(entities);
            this.sheepSummonTimer.restart();
        }
    }

    stage1Behavior(map, entities) {
        // Stage 1: Idle, only summons sheep
        // this.sprite.setAnimation("Idle");
        
        this.handlePouncingBehavior(map, entities);
    }

    stage2Behavior(map, entities) {
        this.handlePouncingBehavior(map, entities);
    }

    stage3Behavior(map, entities) {
        this.handlePouncingBehavior(map, entities);
    }

    handlePouncingBehavior(map, entities) {
        if (this.isPouncing) {

            // Check if Corgi has landed
            if (map.pointIsCollidingWithWall(this.x + this.width / 2, this.y + this.height + 1)) {
                console.log("Landed!");
                this.isPouncing = false;
                this.isWalkingBack = true;
                this.velocity.x = 0;
                this.velocity.y = 0;
                this.pounceTimer.restart();
                this.sprite.setAnimation("Run");
            }
        } else if (this.isWalkingBack) {
            // Walk back to spawn position
            let direction = this.x < this.spawnPosition.x ? 1 : -1;
            this.velocity.x = this.speed * direction;

            // Update sprite direction
            this.sprite.direction = direction;

            // Check if Corgi has reached spawn position
            if (Math.abs(this.x - this.spawnPosition.x) < 2) {
                this.x = this.spawnPosition.x;
                this.isWalkingBack = false;
                this.velocity.x = 0;
                this.sprite.direction = -1; // Face left
                this.sprite.setAnimation("Idle");
            }

            if(this.canJumpWhileWalkingBack) {
                // Check if Corgi can jump while walking back
                if (this.pounceTimer.getTime() > this.pounceCooldown && Math.random() < 0.01) {
                    this.spawnSheep(entities);
                    this.startPounce();
                }
            }

        } else {
            // Ready to pounce
            if (this.pounceTimer.getTime() > this.pounceCooldown) {
                this.startPounce();
            } else {
                // Idle animation while waiting to pounce
                // this.sprite.setAnimation("Idle");
            }
        }
    }

    startPounce() {
        if (!currentScene.player) return;

        this.pounceTimer.restart();

        this.sprite.setAnimation("LayDown");
        this.sprite.onAnimationComplete = () => {
            this.isPouncing = true;


            // Calculate velocities to reach the player
            let targetX = currentScene.player.x;
            let targetY = currentScene.player.y;

            // Quadratic calculation
            const gravity = this.gravity;
            const jumpHeight = 50; // Adjust as needed for arc height

            // Calculate time to reach the peak
            const timeToPeak = Math.sqrt((2 * jumpHeight) / gravity);

            // Total time of flight (up and down)
            const totalTime = timeToPeak * 2;

            // Calculate horizontal velocity
            const distanceX = targetX - this.x - this.width / 2;
            const velocityX = distanceX / totalTime;

            // Calculate initial vertical velocity
            const velocityY = -Math.sqrt(2 * gravity * jumpHeight);

            // Set velocities
            this.velocity.x = velocityX;
            this.velocity.y = velocityY;

            this.y -= 2; // Adjust y position slightly to avoid immediate collision



            // Update sprite direction based on velocity
            this.sprite.direction = this.velocity.x > 0 ? 1 : -1;

            // Play pounce animation
            this.sprite.setAnimation("Run");
            this.sprite.onAnimationComplete = null;
        }
    }

    spawnSheep(entities) {
        // Only spawn sheep if not pouncing or walking back
        // if (this.isPouncing || this.isWalkingBack) return;

        // Create a new SheepEnemy
        // Position the sheep in front of the Corgi, adjust x and y accordingly
        const x = this.x - 10; // Adjust as needed
        const y = this.y + this.height - 8; // Adjust as needed

        const sheep = new SheepEnemy(x, y);
        sheep.direction = -1; // Sheep moves left by default
        this.sheepEntities.push(sheep);
        currentScene.addEntity(sheep);
    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }

    interactWith(other) {
        // Define interactions, e.g., damage player on collision
    }

    onDeath() {
        // Any cleanup if necessary
    }
}




// SheepEnemy.js

class SheepEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 8, 8, 150); // Adjust health as needed
        this.speed = 0.5;
        this.direction = 1;

        // Animation setup
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.sheep, "Run", this.animationSpeed);

        // Multiplying properties
        this.canMultiply = true;
        this.multiplyTimer = new Clock();
        this.multiplyInterval = 600; // Sheep can multiply every 5 seconds
        this.isMultiplying = false;

        this.canMove = true;

        // Charging properties
        this.chargeSpeed = 4; // Adjust as needed
        this.chargeDuration = 60; // Charge duration in milliseconds
        this.chargeCooldown = 120; // Time between charges
        this.chargeTimer = new Clock(); // Single timer for charge phases
        this.chargePhase = 'cooldown'; // Possible phases: 'cooldown', 'tinting', 'charging'

        // Tinting properties for indicating charging
        this.isTinted = false;
        this.tintDuration = this.chargeDuration; // Time the sheep stays tinted before charging

        // Target (player)
        this.player = null; // To be set in update
    }

    update(map, entities) {
        super.update(map, entities);

        if (this.dead) return;

        // Find the player
        if (!this.player) {
            this.player = findPlayer(entities);
            if (!this.player) {
                return; // No player found, cannot proceed
            }
        }

        // Handle multiplying
        if (this.canMultiply && this.multiplyTimer.getTime() > this.multiplyInterval) {
            this.multiply();
            this.multiplyTimer.restart();
        }

        // Handle charging behavior using a single timer and state machine
        switch (this.chargePhase) {
            case 'cooldown':
                if (this.chargeTimer.getTime() > this.chargeCooldown) {
                    this.chargePhase = 'tinting';
                    this.chargeTimer.restart();
                    this.isTinted = true;
                }
                break;

            case 'tinting':
                if (this.chargeTimer.getTime() > this.tintDuration) {
                    this.chargePhase = 'charging';
                    this.chargeTimer.restart();
                    this.isTinted = false;
                    this.isCharging = true;

                    // Calculate direction towards player
                    // const dx = (this.player.x + this.player.width / 2) - (this.x + this.width / 2);
                    // const dy = (this.player.y + this.player.height / 2) - (this.y + this.height / 2);
                    // const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    // const dirX = dx / distance;
                    // const dirY = dy / distance;

                    // // Set velocity for charging
                    // this.velocity.x = dirX * this.chargeSpeed;
                    // this.velocity.y = dirY * this.chargeSpeed;

                    this.velocity.x = this.chargeSpeed * (this.x < this.player.x ? 1 : -1);
                }
                break;

            case 'charging':
                if (this.chargeTimer.getTime() > this.chargeDuration) {
                    this.chargePhase = 'cooldown';
                    this.chargeTimer.restart();
                    this.isCharging = false;
                    this.velocity.x = 0;
                    this.velocity.y = 0;
                }
                break;

            default:
                // Reset to 'cooldown' if an unknown phase is encountered
                this.chargePhase = 'cooldown';
                this.chargeTimer.restart();
                this.isTinted = false;
                this.isCharging = false;
                this.velocity.x = 0;
                this.velocity.y = 0;
                break;
        }

        if(!this.canMove) {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.chargeTimer.restart();
        }

        // If not currently in 'charging' phase, handle movement
        if (this.chargePhase !== 'charging' && this.canMove) {
            this.updateWalkingBehavior(map);
        }

        // Update sprite direction based on velocity
        if (this.velocity.x > 0) {
            this.sprite.direction = 1;
        } else if (this.velocity.x < 0) {
            this.sprite.direction = -1;
        }

        // Update sprite animation
        // this.sprite.setAnimation("Run");

        if (this.isTinted) {
            // Summon red particles to indicate charging
            this.spawnRedParticle(entities);
        }
    }

    updateWalkingBehavior(map) {
        // Handle direction change upon hitting walls or edges
        if (this.collidesWithMap &&
            (this.rightHit || this.leftHit
            || !map.pointIsCollidingWithWall(this.x + this.width - 2, this.y + this.height + 1)
            || !map.pointIsCollidingWithWall(this.x + 2, this.y + this.height + 1))) {
            this.direction *= -1;
            this.x += this.direction;
        }

        // Set horizontal velocity based on direction
        this.velocity.x = this.speed * this.direction;
    }

    multiply() {
        // Create a new SheepEnemy
        const x = this.x + (Math.random() * 10 - 5); // Adjust position slightly
        const y = this.y; // Same y position

        const newSheep = new SheepEnemy(x, y);
        newSheep.direction = -this.direction; // Opposite direction

        this.canMove = false;
        newSheep.canMove = false;

        this.sprite.setAnimation("Contract");
        this.sprite.onAnimationComplete = () => {
            this.sprite.setAnimation("Pop");
            this.sprite.onAnimationComplete = () => {
                this.sprite.setAnimation("Run");
                this.sprite.onAnimationComplete = null;
                this.canMove = true;
            };
        }

        newSheep.sprite.setAnimation("Contract");
        newSheep.sprite.onAnimationComplete = () => {
            newSheep.sprite.setAnimation("Pop");
            newSheep.sprite.onAnimationComplete = () => {
                newSheep.sprite.setAnimation("Run");
                newSheep.sprite.onAnimationComplete = null;
                newSheep.canMove = true;
            };
        }

        currentScene.addEntity(newSheep);
    }

    spawnRedParticle(entities) {
        // Create a red particle at the sheep's position
        const x = this.x + Math.random() * this.width;
        const y = this.y + Math.random() * this.height;
        const particle = new Particle(x, y, 2, 2, "rgba(255, 0, 0, 0.5)", 60);
        entities.push(particle);
    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }

    interactWith(other) {
        // Define interactions, e.g., damage player on collision
    }
}

// Helper function to find the player in entities
function findPlayer(entities) {
    return entities.find(entity => entity instanceof Player) || null;
}




