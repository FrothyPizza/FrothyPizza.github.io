class HoopoeEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        super(x, y, 36, 37, 6000); // Adjust health as needed

        this.hurtboxes = [{ x: 4, y: 5, w: this.width - 8, h: this.height - 10 }];

        // Animation setup
        this.animationSpeed = 8;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.hoopoe, "Fly", this.animationSpeed);
        this.sprite.isBackwards = true; // Facing left by default
        this.sprite.direction = -1; // Facing left

        // Target that it's flying towards
        this.target = null;
        this.previousTarget = null;
        this.flySpeed = 0.5;
        this.flying = true;

        this.startFlyingTimer = new Clock();
        this.startFlyingDelay = 200;

        this.spawnTimer = new Clock();
        this.spawnDelay = 50;



        // Stage thresholds
        this.stageThresholds = [
            { health: this.maxHealth * 2 / 3, stage: 2 },
            { health: this.maxHealth / 3, stage: 3 }
        ];

        // Initialize behaviors based on initial stage
        this.setupStage(false); // Stage 1 starts without strength modification


        this.collidesWithMap = false;
        this.gravity = this.defaultGravity / 4; // Enable gravity for jumping

        // Save the initial spawn position for returning
        this.spawnPosition = { x: x, y: y };
        
    }

    setupStage(isStronger) {
        switch (this.currentStage) {
            case 1:
                this.spawnDelay = 80;
                break;
            case 2:
                this.spawnDelay = 70;
                break;
            case 3:
                this.spawnDelay = 50;
                break;
            default:
                break;
        }
    }

    

    sharedStageBehavior(map, entities) {

        if(this.spawnTimer.getTime() > this.spawnDelay) {
            // spawn a hoopoe hatchling
            let hatchling = new HoopoeHatchlingEnemy(this.x + this.width / 2, this.y + this.height / 2);
            entities.push(hatchling);
            this.spawnTimer.restart();
        }

        if(!this.target) {

            let iterations = 0;
            do {
                this.target = map.bossCues[Math.floor(Math.random() * map.bossCues.length)];
            } while(distance(this.x, this.y, this.target.x, this.target.y) < 100 - iterations++);

        } else if(this.flying) {
            // "pathfind" to the target

            if(Math.abs(this.target.x - this.x) > 8) {
                this.velocity.x = this.target.x - this.x > 0 ? this.flySpeed : -this.flySpeed;
            }

            this.sprite.setAnimation("Fly");

            this.sprite.onAnimationComplete = () => {
                if(this.flying) {
                    if(this.y > this.target.y - 16)
                        this.velocity.y = -1.8;
                    else
                        this.velocity.y = -0.2;
                }
            };

            // Stop flying if we hit the ground
            if(!this.collidingWithMap(map) && this.y < this.target.y) {
                this.collidesWithMap = true;
                this.flying = false;
                this.sprite.onAnimationComplete = null;
                this.sprite.setAnimation("Idle")

                this.startFlyingTimer.restart();
            }
            

        } else if(this.target.name == "runningSpot" || this.target.name == "perch") {

            if(this.target.name == "runningSpot") {
                // we have landed on a running spot and we should run back and forth to the edges of the platform
                if(this.x < this.target.x - 48) {
                    this.velocity.x = this.flySpeed;
                } else if(this.x + this.width > this.target.x + 48) {
                    this.velocity.x = -this.flySpeed;
                } else if(this.velocity.x == 0) {
                    this.velocity.x = Math.random() > 0.5 ? this.flySpeed : -this.flySpeed;
                }
                this.sprite.setAnimation("Run");
            }

            if(this.target.name == "perch") {
                this.velocity.x = 0;
                this.sprite.setAnimation("Idle");
            }


            if(this.startFlyingTimer.getTime() > this.startFlyingDelay) {
                this.flying = true;
                this.collidesWithMap = false;
                this.target = null;
            }

        }
        this.sprite.direction = this.velocity.x > 0 ? 1 : -1;

        if(this.velocity.y > 8) {
            this.velocity.y = 8;
        }
        if(this.y > map.height * map.tileheight) {
            this.velocity.y = -1.6;
            console.log("respawn");
        }
        
    }

    stage1Behavior(map, entities) {
        
    }

    stage2Behavior(map, entities) {

    }

    stage3Behavior(map, entities) {

    }

    

    update(map, entities) {
        super.update(map, entities);


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




// the hoopoe hatchling acts as a static egg in its Idle animation, then after some time it hatches into an EggEnemy
// the EggEnemy flies around and attacks the player
class HoopoeHatchlingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 8, 8, 100); // Adjust health as needed
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;

        this.sprite = new AnimatedSprite(Loader.spriteSheets.hoopoe_hatchling, "Idle", 6);
        this.sprite.direction = 1;

        this.sprite.setAnimation("Idle");

        this.hatchTimer = new Clock();
        this.hatchDelay = 120; // 2 seconds

    }

    update(map, entities) {
        super.update(map, entities);

        if(this.dead) return;

        if(this.hatchTimer.getTime() > this.hatchDelay) {
            this.sprite.setAnimation("Hatch");
            this.sprite.onAnimationComplete = () => {
                let egg = new EggEnemy(this.x, this.y);
                currentScene.addEntity(egg);
                this.removeFromScene = true;
            }   
        }

    }

    draw(context) {
        this.sprite.draw(context, this.x, this.y);
    }
}

class EggEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 8, 8, 100); // Adjust health as needed
        this.speed = 0.5;
        this.direction = 1;
        this.collidesWithMap = false;
        this.gravity = 0;

        // Animation setup
        this.animationSpeed = 6;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.egg, "Rotate", this.animationSpeed);

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

    interactWith(other) {
        // Define interactions, e.g., damage player on collision
    }

}
