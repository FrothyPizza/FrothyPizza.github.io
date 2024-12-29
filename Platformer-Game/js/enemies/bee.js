class BeeEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        super(x, y, 42, 58, 6000); // Adjust health as needed
        this.speed = 1; // Base speed for circling (slowed down)

        this.hurtboxes = [{ x: 4, y: 10, w: this.width - 8, h: this.height - 20 }];

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
        this.groundPatCooldown = 2600; // Time between ground pats


        // Tinting properties
        this.isTinted = false;
        this.tintDuration = 500; // Time the bee stays tinted before charging
        this.tintTimer = new Clock();


        // Honeycomb spawning properties
        this.honeycombSpawnCooldown = 300;
        this.honeycombSpawnTimer = new Clock();

        // Hatchling spawning properties
        this.hatchlingSpawnCooldown = 300;
        this.hatchlingSpawnTimer = new Clock();
        this.spawnsHatchlings = true;



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
        isStronger = true;
        switch (this.currentStage) {
            case 1:
                // this.circleSpeed = 0.01; // Slower circling
                // this.chargeProbability = 0; // Does not charge

                this.circleSpeed = isStronger ? 0.015 : 0.010; // Faster circling but still slower than before
                this.chargeProbability = isStronger ? 0 : 0; // Some probability to charge
                this.chargeSpeed = isStronger ? 3.5 : 3.5; // Moderate charge speed
                this.chargeCooldown = isStronger ? 500 : 500; // Shorter cooldown if stronger
                this.tintDuration = isStronger ? 300 : 500; // Shorter tint duration if stronger
                this.spawnsHatchlings = false; // Does not spawn hatchlings

                this.honeycombSpawnCooldown = isStronger ? 400 : 400;
                break;
            case 2:
                this.circleSpeed = isStronger ? 0.02 : 0.015; // Faster circling but still slower than before
                this.chargeProbability = isStronger ? 0.01 : 0.01; // Some probability to charge
                this.chargeSpeed = isStronger ? 3.5 : 3.5; // Moderate charge speed
                this.chargeCooldown = isStronger ? 500 : 500; // Shorter cooldown if stronger
                this.tintDuration = isStronger ? 300 : 500; // Shorter tint duration if stronger
                this.spawnsHatchlings = true; // Spawns hatchlings
                this.hatchlingSpawnCooldown = isStronger ? 400 : 400;

                this.honeycombSpawnCooldown = isStronger ? 350 : 350;
                break;
            case 3:
                this.circleSpeed = isStronger ? 0.03 : 0.025; // Even faster circling
                this.chargeProbability = isStronger ? 0.015 : 0.01; // Higher probability to charge
                this.chargeSpeed = isStronger ? 4.5 : 4.5; // Faster charge
                this.chargeCooldown = isStronger ? 300 : 300; // Even shorter cooldown
                this.tintDuration = isStronger ? 200 : 400; // Even shorter tint duration
                this.spawnsHatchlings = true; // Spawns hatchlings
                this.hatchlingSpawnCooldown = isStronger ? 250 : 250;

                this.honeycombSpawnCooldown = isStronger ? 250 : 250;
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


        // Spawn honeycomb enemies
        this.spawnHoneycombBehavior(map, entities);

        // Spawn hatchling enemies
        if (this.spawnsHatchlings) {
            this.spawnHatchlingBehavior(map, entities);
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

    spawnHoneycombBehavior(map, entities) {
        // Spawn honeycomb around the bee
        if (this.honeycombSpawnTimer.getTime() > this.honeycombSpawnCooldown) {
            let edge = Math.floor(Math.random() * 3);
            let x, y;
            switch (edge) {
                case 0: // Top
                    x = Math.floor(Math.random() * map.width * map.tilewidth);
                    y = 0;
                    break;
                case 1: // Right
                    x = map.width * map.tilewidth;
                    y = Math.floor(Math.random() * map.height * map.tileheight);
                    break;
                // case 2: // Bottom
                //     x = Math.floor(Math.random() * map.width * map.tilewidth);
                //     y = map.height * map.tileheight - 8;
                //     break;
                case 2: // Left
                    x = 0;
                    y = Math.floor(Math.random() * map.height * map.tileheight);
                    break;
                default:
                    break;
            }

            let honeycomb = new HoneyCombEnemy(x, y, entities);
            entities.push(honeycomb);

            this.honeycombSpawnTimer.restart();
        }
    }

    spawnHatchlingBehavior(map, entities) {
        // Spawn hatchlings around the bee
        if (this.hatchlingSpawnTimer.getTime() > this.hatchlingSpawnCooldown) {
            let x = this.x + this.width / 2;
            let y = this.y + this.height / 2;

            let hatchling = new BeeHatchlingEnemy(x, y, entities);
            entities.push(hatchling);

            this.hatchlingSpawnTimer.restart();
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
                this.health += 6;
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



// honeycomb enemy spawns on random edge of map with direction towards the center of the map.
// As it moves towards the center, it moves in a sine wave pattern.
class HoneyCombEnemy extends Enemy {
    constructor(x, y, entities, options = {}) {
        super(x, y, 12, 12, 300); // Adjust health as needed
        this.speed = 0.25; // Base speed for circling (slowed down)

        
        this.hitboxes = [{ x: 0, y: 0, w: this.width, h: this.height }];
        this.hurtboxes = [{ x: 2, y: 2, w: this.width - 4, h: this.height - 4 }];

        this.collidesWithMap = false;
        this.gravity = 0;
        this.defaultGravity = 0;

        // Animation setup
        this.animationSpeed = 20;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.bee_honeycomb, "Idle", this.animationSpeed);

        // Circling behavior properties
        this.circleRadius = 50; // Initial radius of circle around player
        this.circleSpeed = 0.01; // Angular speed (radians per frame, slowed down)
        this.angle = 0; // Current angle around the player

        // this.target = findPlayer(entities);

        // the target is the center of the map
        let map = currentScene.map;
        let targetX = map.width * map.tilewidth / 2;
        let targetY = map.height * map.tileheight / 2;
        this.velocity.x = targetX - this.x;
        this.velocity.y = targetY - this.y;
        let distance = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y) || 1;
        this.velocity.x /= distance;
        this.velocity.y /= distance;
        this.velocity.x *= this.speed;
        this.velocity.y *= this.speed;


    }

    update(map, entities) {
        super.update(map, entities);

        if(this.dead) return;

        // // Find the player
        // if (!this.target) {
        //     this.target = findPlayer(entities);
        //     if (!this.player) {
        //         return; // No player found, cannot proceed
        //     }
        // }

        // // move towards player
        // const dx = (this.target.x + this.target.width / 2) - (this.x + this.width / 2);
        // const dy = (this.target.y + this.target.height / 2) - (this.y + this.height / 2);
        // const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        // const dirX = dx / distance;
        // const dirY = dy / distance;


        // // Set velocity for charging
        // this.velocity.x = dirX * this.speed;
        // this.velocity.y = dirY * this.speed;



    }

    draw(context) {
        super.draw(context);

        this.sprite.draw(context, this.x, this.y);
    }

}



// bee hatchling flies towards the player
class BeeHatchlingEnemy extends Enemy {
    constructor(x, y, entities, options = {}) {
        super(x, y, 8, 8, 100); // Adjust health as needed
        this.speed = 0.5; // Base speed for circling (slowed down)
        
        this.hitboxes = [{ x: 0, y: 0, w: this.width, h: this.height }];
        this.hurtboxes = [{ x: 1, y: 1, w: this.width - 2, h: this.height - 2 }];


        // Animation setup
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.bee_hatchling, "Fly", this.animationSpeed);

        this.collidesWithMap = false;

        this.gravity = 0;
        this.defaultGravity = 0;

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

        // Handle movement
        this.updateFlyingBehavior(map);


        if(this.velocity.x > 0) {
            this.sprite.direction = 1;
        } else if(this.velocity.x < 0) {
            this.sprite.direction = -1;
        }

    }

    updateFlyingBehavior(map) {
        // go towards player
        const dx = (this.player.x + this.player.width / 2) - (this.x + this.width / 2);
        const dy = (this.player.y + this.player.height / 2) - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Set velocity for charging
        this.velocity.x = dirX * this.speed;
        this.velocity.y = dirY * this.speed;
    }

    draw(context) {
        super.draw(context);

        this.sprite.draw(context, this.x, this.y);
    }
}