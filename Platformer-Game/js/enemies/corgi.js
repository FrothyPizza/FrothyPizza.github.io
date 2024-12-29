///////////////////////////////
// CorgiEnemy.js
///////////////////////////////

class CorgiEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        super(x, y, 48, 32, 8000); // Adjust health as needed
        this.speed = 0.5; // Speed for walking back to spawn position

        this.hurtboxes = [{ x: 2, y: 2, w: this.width - 4, h: this.height - 4 }];

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
        this.pounceTimer.add(300);
        this.isWalkingBack = false;
        this.canJumpWhileWalkingBack = false;

        // Stage thresholds
        this.stageThresholds = [
            { health: this.maxHealth * 4 / 5, stage: 2 },
            { health: this.maxHealth * 2 / 5, stage: 3 }
        ];

        // Initialize behaviors based on initial stage
        this.setupStage(false); // Stage 1 starts without strength modification

        // By default, the Corgi collides with the map and has some gravity
        this.collidesWithMap = true;
        this.gravity = this.defaultGravity / 2; // Enable gravity for jumping

        // Save the initial spawn position for returning
        this.spawnPosition = { x: x, y: y };

        // For Stage 3 circle-around
        this.orbitAngle = 0;     // We'll increment this each frame
        this.orbitRadius = 60;   // Distance from center of the map
        this.orbitSpeedFactor = 0.05; // How quickly we move to the orbit position
    }

    setupStage(isStronger) {
        switch (this.currentStage) {
            case 1:
                this.sheepSummonInterval = isStronger ? 30000 : 40000;
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
                // In stage 3, the Corgi circles the center of the map and herds the sheep
                this.sheepSummonInterval = isStronger ? 100 : 200;
                this.pounceCooldown = isStronger ? 60 : 150;
                this.canJumpWhileWalkingBack = true;
                this.jumpHeight = 35;   
                // Stop colliding with the map so it can move freely in the air
                this.collidesWithMap = false;
                this.randomSheepFlyInterval = 0.006;
                // Switch to a “Fly” (or any suitable) animation if available
                this.sprite.setAnimation("Fly");

                this.sheepSummonInterval = 10;
                setFrameTimeout(() => {
                    this.sheepSummonInterval = 100;
                }, 60);
                break;
            default:
                break;
        }
    }

    update(map, entities) {
        super.update(map, entities);

        // Shared behaviors (e.g. sheep summoning, etc.) 
        // ... You can re-enable your riddle logic if you need it ...

        // If you haven't commented them out, call them:
        // this.sharedStageBehavior(map, entities);

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
        //         // Stage 0 or something else, no special behavior
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
        this.handlePouncingBehavior(map, entities);
    }

    stage2Behavior(map, entities) {
        this.handlePouncingBehavior(map, entities);
    }

    //
    // Stage 3 behavior: Circle around the center of the map, herd sheep
    //
    stage3Behavior(map, entities) {
        this.updateCircleAroundMapCenter();
        this.herdSheep(entities);
    }

    /**
     * Replaces the wander/flying behavior with a circle-around-center approach.
     * We treat the map center as (120, 88) for a 240x176 screen.
     */
    updateCircleAroundMapCenter() {
        // Increase orbitAngle a bit each frame
        this.orbitAngle += 0.02; 

        // The center for a 240×176 map
        const centerX = 240 / 2;
        const centerY = 176 / 2 - 30;

        // Desired orbit position
        const desiredX = centerX + Math.cos(this.orbitAngle) * this.orbitRadius;
        const desiredY = centerY + Math.sin(this.orbitAngle) * this.orbitRadius;

        // Smoothly move (steer) toward that desired position
        const steerX = (desiredX - this.x) * this.orbitSpeedFactor;
        const steerY = (desiredY - this.y) * this.orbitSpeedFactor;
        
        // Update velocity
        this.velocity.x = steerX;
        this.velocity.y = steerY;

        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Adjust sprite direction for left/right facing
        this.sprite.direction = (this.velocity.x > 0) ? 1 : -1;

        // Optionally clamp position so we don't go out of bounds
        this.x = Math.max(0, Math.min(this.x, 240 - this.width));
        this.y = Math.max(0, Math.min(this.y, 176 - this.height));
    }

    /**
     * Called each frame in Stage 3 to “herd” sheep with a simple flocking influence.
     */
    herdSheep(entities) {
        // If you want the corgi to spawn extra sheep occasionally:
        // only 20 sheep allowed at a time
        if (Math.random() < this.randomSheepFlyInterval && entities.filter(e => e instanceof SheepEnemy).length < 20) {
            this.spawnSheep(entities);
        }
        for (let sheep of this.sheepEntities) {
            if (!sheep.dead) {
                sheep.applyFlockingBehavior(this.sheepEntities, this);
                sheep.multiplyInterval = 400;
            }
        }
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

            if (this.canJumpWhileWalkingBack) {
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
            let targetX = currentScene.player.x - 20;
            let targetY = currentScene.player.y;

            // Quadratic calculation
            const gravity = this.gravity;
            const jumpHeight = 50; // Adjust as needed

            // Time to reach the peak
            const timeToPeak = Math.sqrt((2 * jumpHeight) / gravity);
            // Total time of flight (up and down)
            const totalTime = timeToPeak * 2;

            // Horizontal velocity
            const distanceX = targetX - this.x - this.width / 2;
            const velocityX = distanceX / totalTime;

            // Vertical velocity
            const velocityY = -Math.sqrt(2 * gravity * jumpHeight);

            // Set velocities
            this.velocity.x = velocityX;
            this.velocity.y = velocityY;

            this.y -= 2; // Adjust y position slightly to avoid immediate collision

            // Update sprite direction
            this.sprite.direction = this.velocity.x > 0 ? 1 : -1;

            // Play pounce animation
            this.sprite.setAnimation("Run");
            this.sprite.onAnimationComplete = null;
        }
    }

    spawnSheep(entities) {
        // Create a new SheepEnemy
        // Position the sheep in front of the Corgi, adjust x and y accordingly
        const x = this.x + this.width/2; // Adjust as needed
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


///////////////////////////////
// SheepEnemy.js
///////////////////////////////

class SheepEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 8, 8, 300); // Adjust health as needed
        this.speed = 0.5;
        this.direction = 1;

        // this.collidesWithMap = true;

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
        this.chargeSpeed = 4; 
        this.chargeDuration = 60;
        this.chargeCooldown = 120;
        this.chargeTimer = new Clock();
        this.chargePhase = 'cooldown';
        this.isCharging = false;

        // Tinting properties
        this.isTinted = false;
        this.tintDuration = this.chargeDuration; 

        // Target (player)
        this.player = null; // Found later

        // Flocking behavior
        this.maxForce = 0.1;       
        this.maxSpeed = 1.0;       
        this.separationDist = 60;  
        this.cohesionWeight = 0.005;
        this.alignmentWeight = 0.01;
        this.separationWeight = 0.3;
        this.corgiFollowWeight = 0.02;
    }

    update(map, entities) {
        super.update(map, entities);
        if (this.dead) return;

        // Find the player once
        if (!this.player) {
            this.player = findPlayer(entities);
        }

        if(map.pointIsCollidingWithWall(this.x + this.width / 2, this.y + this.height / 2)) {
            this.collidesWithMap = false;
        }

        // Handle multiplying
        if (this.canMultiply && this.multiplyTimer.getTime() > this.multiplyInterval) {
            this.multiply();
            this.multiplyTimer.restart();
        }

        if(this.y > 176) {
            this.removeFromScene = true;
        }

        // Handle charging behavior
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
                    this.velocity.x = this.chargeSpeed * (this.x < (this.player?.x || 0) ? 1 : -1);
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
                this.chargePhase = 'cooldown';
                this.chargeTimer.restart();
                this.isTinted = false;
                this.isCharging = false;
                this.velocity.x = 0;
                this.velocity.y = 0;
                break;
        }

        if (!this.canMove) {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.chargeTimer.restart();
        }

        // If not charging, handle normal walking
        if (this.chargePhase !== 'charging' && this.canMove) {
            this.updateWalkingBehavior(map);
        }

        // Update sprite direction
        if (this.velocity.x > 0) {
            this.sprite.direction = 1;
        } else if (this.velocity.x < 0) {
            this.sprite.direction = -1;
        }

        // If tinted, show red particles
        if (this.isTinted) {
            this.spawnRedParticle(entities);
        }
    }

    updateWalkingBehavior(map) {
        // Basic logic: if we are on the ground and collide or there's a gap, turn around
        if (this.collidesWithMap) {
            if (
                this.rightHit || 
                this.leftHit ||
                !map.pointIsCollidingWithWall(this.x + this.width - 2, this.y + this.height + 1) ||
                !map.pointIsCollidingWithWall(this.x + 2, this.y + this.height + 1)
            ) {
                this.direction *= -1;
                this.x += this.direction;
            }
        }
        this.velocity.x = this.speed * this.direction;
    }

    applyFlockingBehavior(flock, corgi) {
        this.gravity = 0; // No gravity for sheep
        this.defaultGravity = 0; // No gravity for sheep
        this.collidesWithMap = false; // No collision with map for sheep
            
        // We’ll apply 4 main “forces”: separation, alignment, cohesion, and corgi-follow.
        const neighbors = flock.filter(s => s !== this && !s.dead);
        if (neighbors.length === 0) return;

        const sep = this.separationForce(neighbors);
        const ali = this.alignmentForce(neighbors);
        const coh = this.cohesionForce(neighbors);
        const cf = this.corgiFollowForce(corgi);

        const totalX = sep.x * this.separationWeight 
                     + ali.x * this.alignmentWeight
                     + coh.x * this.cohesionWeight
                     + cf.x  * this.corgiFollowWeight;

        const totalY = sep.y * this.separationWeight
                     + ali.y * this.alignmentWeight
                     + coh.y * this.cohesionWeight
                     + cf.y  * this.corgiFollowWeight;

        this.velocity.x += totalX;
        this.velocity.y += totalY;

        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > this.maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
            this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
        }
    }

    separationForce(neighbors) {
        let steerX = 0, steerY = 0, count = 0;
        for (let other of neighbors) {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distSq = dx*dx + dy*dy;
            if (distSq < this.separationDist*this.separationDist) {
                steerX += dx / distSq;
                steerY += dy / distSq;
                count++;
            }
        }
        if (count > 0) {
            steerX /= count;
            steerY /= count;
        }
        return { x: steerX, y: steerY };
    }

    alignmentForce(neighbors) {
        let avgVX = 0, avgVY = 0, count = 0;
        for (let other of neighbors) {
            if (!other.dead) {
                avgVX += other.velocity.x;
                avgVY += other.velocity.y;
                count++;
            }
        }
        if (count > 0) {
            avgVX /= count;
            avgVY /= count;
        }
        return { x: avgVX, y: avgVY };
    }

    cohesionForce(neighbors) {
        let centerX = 0, centerY = 0, count = 0;
        for (let other of neighbors) {
            if (!other.dead) {
                centerX += other.x;
                centerY += other.y;
                count++;
            }
        }
        if (count > 0) {
            centerX /= count;
            centerY /= count;
            centerX -= this.x;
            centerY -= this.y;
        }
        return { x: centerX, y: centerY };
    }

    corgiFollowForce(corgi) {
        // Simple steering toward corgi’s position
        const dx = corgi.x - this.x;
        const dy = corgi.y - this.y;
        return { x: dx, y: dy };
    }

    multiply() {
        const x = this.x + (Math.random() * 10 - 5);
        const y = this.y;

        const newSheep = new SheepEnemy(x, y);
        newSheep.direction = -this.direction;

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

// Finds a Player in the entities array
function findPlayer(entities) {
    return entities.find(e => e instanceof Player) || null;
}
