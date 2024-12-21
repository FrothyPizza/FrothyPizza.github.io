class BeeEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        super(x, y, 42, 58, 6000); // Adjust health as needed
        this.speed = 1; // Base speed for circling (slowed down)

        // Animation setup
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.bee, "Run", this.animationSpeed);

        // Circling behavior properties
        this.circleRadius = 150; // Initial radius of circle around player
        this.circleSpeed = 0.01; // Angular speed (radians per frame, slowed down)
        this.angle = 0; // Current angle around the player

        // Target (player)
        this.player = null; // To be set in update

        // Charging behavior properties
        this.isCharging = false;
        this.chargeSpeed = 5; // Speed when charging
        this.chargeDuration = 1000; // Duration of charge in milliseconds
        this.chargeTimer = new Clock();
        this.chargeCooldown = 2000; // Time between charges
        this.chargeCooldownTimer = new Clock();

        // Ground Patting
        this.isGroundPatting = false;
        this.movingTowardsLandingLocation = false;
        this.landingLocation = { x: 0, y: 0 };
        this.groundPatDuration = 400; // Duration of ground pat in milliseconds
        this.groundPatTimer = new Clock();
        this.groundPatCooldown = 2000; // Time between ground pats


        // Tinting properties
        this.isTinted = false;
        this.tintDuration = 500; // Time the bee stays tinted before charging
        this.tintTimer = new Clock();

        // Deceleration properties
        this.decelerationStarted = false;

        // Stage thresholds
        this.stageThresholds = [
            { health: this.maxHealth * 2 / 3, stage: 2 },
            { health: this.maxHealth / 3, stage: 3 }
        ];

        // Initialize behaviors based on initial stage
        this.setupStage(false); // Stage 1 starts without strength modification

        // Bee doesn't collide with map and doesn't have gravity
        this.collidesWithMap = false;
        this.gravity = 0;
    }

    setupStage(isStronger) {
        switch (this.currentStage) {
            case 1:
                // this.circleSpeed = 0.01; // Slower circling
                // this.chargeProbability = 0; // Does not charge

                this.circleSpeed = isStronger ? 0.015 : 0.010; // Faster circling but still slower than before
                this.chargeProbability = isStronger ? 0 : 0; // Some probability to charge
                this.chargeSpeed = isStronger ? 5 : 4; // Moderate charge speed
                this.chargeCooldown = isStronger ? 500 : 500; // Shorter cooldown if stronger
                this.tintDuration = isStronger ? 300 : 500; // Shorter tint duration if stronger
                break;
            case 2:
                this.circleSpeed = isStronger ? 0.02 : 0.015; // Faster circling but still slower than before
                this.chargeProbability = isStronger ? 0.005 : 0.003; // Some probability to charge
                this.chargeSpeed = isStronger ? 5 : 4; // Moderate charge speed
                this.chargeCooldown = isStronger ? 500 : 500; // Shorter cooldown if stronger
                this.tintDuration = isStronger ? 300 : 500; // Shorter tint duration if stronger
                break;
            case 3:
                this.circleSpeed = isStronger ? 0.03 : 0.025; // Even faster circling
                this.chargeProbability = isStronger ? 0.015 : 0.01; // Higher probability to charge
                this.chargeSpeed = isStronger ? 6 : 5; // Faster charge
                this.chargeCooldown = isStronger ? 1000 : 1500; // Even shorter cooldown
                this.tintDuration = isStronger ? 200 : 400; // Even shorter tint duration
                break;
            default:
                break;
        }
    }

    update(map, entities) {
        super.update(map, entities);

    }

    sharedStageBehavior(map, entities) {
        // Find the player
        if (!this.player) {
            this.player = findPlayer(entities);
            if (!this.player) {
                return; // No player found, cannot proceed
            }
        }


        if(this.isGroundPatting) {
            // Run the "PatGround" animation
            this.sprite.animationSpeed = 5;
            this.sprite.setAnimation("PatGround");
        }
        else {
            this.sprite.animationSpeed = this.animationSpeed;
            this.sprite.setAnimation("Run");
        }
            


        // Handle charging behavior
        if (this.isCharging) {
            // Continue charging towards the player
            if (this.chargeTimer.getTime() > this.chargeDuration) {
                // Stop charging
                this.isCharging = false;
                this.decelerationStarted = false;
                this.chargeCooldownTimer.restart();
            } else {
                // Decelerate after 30 frames (~500ms assuming 60fps)
                if (this.chargeTimer.getTime() > 10 && !this.decelerationStarted) {
                    this.decelerationStarted = true;
                    this.decelerationRate = 0.95; // Deceleration factor per frame
                }
                if (this.decelerationStarted) {
                    this.velocity.x *= this.decelerationRate;
                    this.velocity.y *= this.decelerationRate;
                    // Stop completely if velocity is very small
                    if (Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.y) < 0.1) {
                        this.velocity.x = 0;
                        this.velocity.y = 0;
                        this.decelerationStarted = false;
                        this.isCharging = false;
                    }
                }
            }
        } else {
            // Not charging

            // Check if it's time to start a charge
            if (this.chargeCooldownTimer.getTime() > this.chargeCooldown) {
                // Randomly decide whether to start charging
                if (Math.random() < this.chargeProbability) {
                    // Start tinting
                    this.isTinted = true;
                    this.tintTimer.restart();
                    this.chargeCooldownTimer.restart();
                }
            }

            // If tinted and tint duration passed, start charging
            if (this.isTinted && this.tintTimer.getTime() > this.tintDuration) {
                this.isTinted = false;
                // Start charging
                this.isCharging = true;
                this.decelerationStarted = false;
                this.chargeTimer.restart();

                // Calculate direction towards player
                const dx = (this.player.x + this.player.width / 2) - (this.x + this.width / 2);
                const dy = (this.player.y + this.player.height / 2) - (this.y + this.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const dirX = dx / distance;
                const dirY = dy / distance;

                // Set velocity for charging
                this.velocity.x = dirX * this.chargeSpeed;
                this.velocity.y = dirY * this.chargeSpeed;

            } else if (this.isTinted) {
                // Continue circling while tinted
                this.updateCirclingBehavior();
            } else {
                // Normal circling behavior
                this.updateCirclingBehavior();
            }
        }

        // Update sprite direction based on velocity
        if (this.velocity.x > 0) {
            this.sprite.direction = 1;
        } else if (this.velocity.x < 0) {
            this.sprite.direction = -1;
        }



        if(this.isTinted) {
            // log timere
            // console.log(this.chargeCooldownTimer.getTime());
            // let numParticles = Math.ceil(Math.pow(this.chargeCooldownTimer.getTime() / 50, 2) / 10);
            // if(numParticles > 25) numParticles = 25;
            // find how close to the end of the tint we are

            let numParticles = 2;
            let timeLeft = this.tintDuration - this.tintTimer.getTime();
            if(timeLeft < 60) numParticles = 10;
            if(timeLeft < 30) numParticles = 20;
            
            console.log(numParticles);
            // create a bunch of Particle objects randomly within the bee's bounding box
            for (let i = 0; i < numParticles; i++) {
                this.spawnRedParticle(entities);
            }    
        }
    }

    spawnRedParticle(entities) {
        // Create a red particle at the bee's position
        // const x = this.x + Math.random() * this.width * 2 / 3 + this.width / 6;
        // const y = this.y + Math.random() * this.height * 2 / 3 + this.height / 6;
        // spawn them within the bounds of a circle around the bee
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.width / 2;
        const x = this.x + this.width / 2 + radius * Math.cos(angle);
        const y = this.y + this.height / 2 + radius * Math.sin(angle);
        const particle = new Particle(x, y, 2, 2, "rgba(255, 0, 0, 0.2)", 60);
        entities.push(particle);
    }

    updateCirclingBehavior() {
        if(this.isGroundPatting || this.movingTowardsLandingLocation) {
            // Skip circling behavior when ground patting
            return;
        }

        this.angle += this.circleSpeed;
        if (this.angle > Math.PI * 2) {
            this.angle -= Math.PI * 2;
        }

        const offsetX = this.circleRadius * Math.cos(this.angle);
        const offsetY = this.circleRadius * Math.sin(this.angle);

        const targetX = this.player.x + this.player.width / 2 + offsetX - this.width / 2;
        const targetY = this.player.y + this.player.height / 2 + offsetY - this.height / 2;

        const dx = targetX - this.x;
        const dy = targetY - this.y;

        const speed = this.speed;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy) || 1;
        this.velocity.x = dx / distanceToTarget * speed;
        this.velocity.y = dy / distanceToTarget * speed;

        
        if(this.isTinted) {
            this.velocity.x *= 0.5;
            this.velocity.y *= 0.5;
        }

    }

    stage1Behavior(map, entities) {
        // Circles the player
        // Behavior handled in sharedStageBehavior

        // this.stage2Behavior(map, entities);
    }

    stage2Behavior(map, entities) {
        // Occasionally lands and runs sprite animation "PatGround" while healing itself slowly
        if ((!this.isGroundPatting || !this.movingTowardsLandingLocation)  && this.groundPatTimer.getTime() > this.groundPatCooldown) {
            this.movingTowardsLandingLocation = true;
            this.isTinted = false;
            this.isCharging = false;

            this.groundPatTimer.restart();

            let cue = map.bossCues[Math.floor(Math.random() * map.bossCues.length)];
            this.landingLocation = { x: cue.x, y: cue.y };
            console.log(this.landingLocation);
        }
        if(this.movingTowardsLandingLocation || this.isGroundPatting) {
            // stop charging
            this.isCharging = false;
            this.decelerationStarted = false;
            this.chargeCooldownTimer.restart();
            this.isTinted = false;   
        }

        if (this.movingTowardsLandingLocation) {
            // Move towards the landing location
            const dx = this.landingLocation.x - this.x;
            const dy = this.landingLocation.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const dirX = dx / distance;
            const dirY = dy / distance;

            this.velocity.x = dirX * this.speed;
            this.velocity.y = dirY * this.speed;

            console.log(distance);

            if (distance < this.speed) {
                this.movingTowardsLandingLocation = false;
                this.isGroundPatting = true;
                this.groundPatTimer.restart();
                this.velocity.x = 0;
                this.velocity.y = 0;
            }
        } else if (this.isGroundPatting) {


            // Heal slowly
            if (this.health < this.maxHealth) {
                this.health += 1;
            }

            // Stop ground patting after duration
            if (this.groundPatTimer.getTime() > this.groundPatDuration) {
                this.isGroundPatting = false;
                this.groundPatTimer.restart();
            }
        }


    }

    stage3Behavior(map, entities) {
        // Circles even faster and more frequently launches itself
        // Behavior handled in sharedStageBehavior

        this.stage2Behavior(map, entities);
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

// Helper function to find the player in entities
function findPlayer(entities) {
    return entities.find(entity => entity instanceof Player) || null;
}
