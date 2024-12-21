// UnicyclistEnemy.js

class UnicyclistEnemy extends Boss {
    constructor(x, y) {
        super(x, y, 18, 25, 4000);
        this.speed = 0.25;
        this.direction = 1;

        // Frames per animation frame
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.unicyclist, "Run", this.animationSpeed);
        this.sprite.isBackwards = true;

        this.jumpingHorizontalSpeed = 1;
        this.gravity = 0.12;
        this.canJump = true;
        this.isJumping = false;
        this.jumpClock = new Clock();
        this.jumpingGravity = 0.05;
        this.nonJumpingGravity = 0.12;
        this.timeBetweenJumps = 200;
        this.target = null;

        // Juggling properties
        this.jugglingMimeHeads = [];
        // this.maxJuggling = 5; // Maximum number of MimeHeads being juggled
        this.ejectionTimer = new Clock();
        this.ejectionInterval = 400; // Frames between ejections
        this.juggleRadiusX = 25; // Horizontal radius
        this.juggleRadiusY = 25; // Vertical radius
        this.juggleAngle = 0; // Current angle for juggling animation
        this.juggleSpeed = 0.02; // Speed of juggling rotation


        this.shootingMimeHeads = false;
        this.shootAllMimeHeadsChance = 0;

        // Juggle center offset variables
        this.juggleOffsetX = 0; // Default to 0 if not provided
        this.juggleOffsetY = 0; // Default to 0 if not provided
        this.setJuggleCenter(7, -7);

        // Shield properties for stage 3
        this.hasShield = false;
        this.shieldActive = false;
        this.shieldToggleTimer = new Clock();
        this.shieldToggleInterval = 100; // Frames between shield toggles

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
                // Stage 1: Basic behavior, no MimeHeads
                this.maxJuggling = 3;
                this.removeAllMimeHeads();
                this.juggleSpeed = isStronger ? 0.03 : 0.025;
                this.hasShield = false;


                break;
            case 2:
                // Stage 2: Start juggling MimeHeads
                this.maxJuggling = isStronger ? 7 : 5; // More MimeHeads if stronger
                this.jumpDelay = isStronger ? 250 : 400;
                this.juggleSpeed = isStronger ? 0.05 : 0.04;
                this.ejectionInterval = isStronger ? 250 : 300;
                this.spawnMimeHeads();
                this.hasShield = false;
                break;
            case 3:
                // Stage 3: Advanced behavior with shields
                this.maxJuggling = isStronger ? 10 : 7; // Even more MimeHeads if stronger
                this.jumpDelay = isStronger ? 200 : 300;
                this.juggleSpeed = isStronger ? 0.07 : 0.06;
                this.ejectionInterval = isStronger ? 100 : 200;
                this.spawnMimeHeads();
                this.hasShield = true;
                this.shieldActive = isStronger ? false : true; // Shield starts off if stronger
                this.shootAllMimeHeadsChance = 0.5;

                break;
            default:
                break;
        }
    }



    update(map, entities) {
        super.update(map, entities);
    }

    sharedStageBehavior(map, entities) {
        // Handle direction change upon hitting walls
        if (this.collidesWithMap && 
            (this.rightHit || this.leftHit
            || !map.pointIsCollidingWithWall(this.x + this.width - 2, this.y + this.height + 1)
            || !map.pointIsCollidingWithWall(this.x + 2, this.y + this.height + 1))) {
            this.direction *= -1;
            this.x += this.direction;
        }

        // Set horizontal velocity based on direction
        if(!this.isJumping) {
            this.velocity.x = this.speed * this.direction;
        } else {
            this.velocity.x = this.jumpingHorizontalSpeed * this.direction;
        }
        this.sprite.direction = this.direction;
        this.sprite.setAnimation("Run");

        this.updateMimeHeads(map, entities);


    }


    stage1Behavior(map, entities) {

    }

    stage2Behavior(map, entities) {
        this.jumpAround(map, entities);
    }

    stage3Behavior(map, entities) {
        this.jumpAround(map, entities);
        // Toggle shield periodically
        if (this.shieldToggleTimer.getTime() > this.shieldToggleInterval) {
            this.hasProtectionAura = !this.hasProtectionAura;
            this.shieldToggleTimer.restart();
        }
    }

    


    spawnMimeHeads() {
        Loader.playSound("jester_laugh.wav");
        this.removeAllMimeHeads(); // Clear existing MimeHeads
        for (let i = 0; i < this.maxJuggling; i++) {
            let phaseOffset = (i / this.maxJuggling) * Math.PI; // Phase offset for criss-cross effect
            let mimeHead = new MimeHeadEnemy(
                this.x + this.juggleOffsetX + this.juggleRadiusX * Math.sin(phaseOffset),
                this.y + this.juggleOffsetY - this.juggleRadiusY * Math.cos(phaseOffset)
            );
            mimeHead.isBeingJuggled = true;
            mimeHead.sprite.setAnimation("Rotate");

            this.jugglingMimeHeads.push(mimeHead);

            // Add the MimeHead to the main entities list
            // Assuming 'entities' is accessible or passed appropriately
            // If not, consider passing 'entities' as a parameter
            // Here, we'll assume it's accessible via this.entities
            currentScene.addEntity(mimeHead);
        }
    }

    removeAllMimeHeads() {
        // Remove all MimeHeads from the game
        this.jugglingMimeHeads.forEach(mime => {
            mime.dead = true;
        });
        this.jugglingMimeHeads = [];
    }


    updateMimeHeads(map, entities) {
        // Update juggling angle
        this.juggleAngle += this.juggleSpeed;
        if (this.juggleAngle >= 2 * Math.PI) {
            this.juggleAngle -= 2 * Math.PI;
        }

        // Update positions of juggling MimeHeads with a more vertical figure-eight pattern
        this.jugglingMimeHeads.forEach((mime, index) => {
            let phaseOffset = ((this.maxJuggling - index) / this.maxJuggling) * Math.PI; // Phase offset for criss-cross
            let angle = this.juggleAngle + phaseOffset;

            // Modified Figure-Eight Parametric Equations for More Vertical Movement
            // xOffset has reduced amplitude, yOffset has increased amplitude
            let xOffset = this.juggleRadiusX * Math.cos(angle); // * Math.sin(angle);
            let yOffset = this.juggleRadiusY * Math.sin(angle);

            mime.x = this.x + this.juggleOffsetX + xOffset;
            mime.y = this.y + this.juggleOffsetY - yOffset;

            mime.hasProtectionAura = true;

            mime.velocity.x = 0;
            mime.velocity.y = 0;

            mime.collidesWithMap = false; // Prevent MimeHeads from colliding with the map
        });

        // Handle periodic ejection of MimeHeads if the head is above the unicyclist and to the right
        if (!this.isJumping && this.ejectionTimer.getTime() > this.ejectionInterval) {

            if(Math.random() < this.shootAllMimeHeadsChance) {
                for(let i = 0; i < this.jugglingMimeHeads.length; i++) {
                    let mimeHead = this.jugglingMimeHeads[i];
                    mimeHead.isProjectile = true;
                    let player = currentScene.player;
                    // shoot directly at the player
                    let angle = Math.atan2(player.y - mimeHead.y, player.x - mimeHead.x);
                    mimeHead.velocity.x = Math.cos(angle) * 2;
                    mimeHead.velocity.y = Math.sin(angle) * 2;
                    mimeHead.gravity = 0;
                    mimeHead.collidesWithMap = false
                    mimeHead.isBeingJuggled = false;
                    mimeHead.hasProtectionAura = false;
                    this.jugglingMimeHeads.splice(i, 1);
                    
                }
                this.ejectionTimer.restart();
            } else {
                if (this.jugglingMimeHeads.length > 0
                    && !this.jugglingMimeHeads[0].collidingWithMap(map)
                    && this.jugglingMimeHeads[0].y > 8
                    && this.jugglingMimeHeads[0].y < this.y - this.juggleRadiusY + 10
                    && this.jugglingMimeHeads[0].x > this.x) {
                    // Eject the first MimeHead in the juggling list
                    let mimeHead = this.jugglingMimeHeads.shift();
                    mimeHead.isBeingJuggled = false;
                    mimeHead.hasProtectionAura = false;

                    // Set initial velocity for the ejected MimeHead
                    let ejectDirection = this.direction === 1 ? 1 : -1;
                    // mimeHead.velocity.x = ejectDirection * 2; // Horizontal speed
                    // mimeHead.velocity.y = -2; // Initial upward speed

                    mimeHead.collidesWithMap = true;

                    this.ejectionTimer.restart();

                }
            }
        }

        if(this.jugglingMimeHeads.length === 0) {
            this.spawnMimeHeads(entities);
        }

    }

    jumpAround(map, entities) {
        // Jump between its jump locations
        if(this.jumpClock.getTime() > this.timeBetweenJumps && this.canJump) {
            let target = map.bossCues[Math.floor(Math.random() * map.bossCues.length)];
            this.target = target;

            this.gravity = this.jumpingGravity;

            // calculate the requisite starting y velocity to reach the target given the gravity and x speed
            let distance = Math.abs(target.x - this.x);
            this.direction = this.x < target.x ? 1 : -1;


            let timeToReach = distance / this.jumpingHorizontalSpeed;
            let yVelocity = (target.y - this.y - 0.5 * this.gravity * Math.pow(timeToReach, 2)) / timeToReach;
            this.velocity.y = yVelocity;


            this.isJumping = true;
            this.collidesWithMap = false;


            this.jumpClock.restart();
        }
        if(this.target !== null) {
            // console.log(distance(this.x, this.y, this.target.x, this.target.y));
        }
        if(this.target !== null && distance(this.x, this.y, this.target.x, this.target.y) < 24) {
            this.isJumping = false;
            this.collidesWithMap = true;
            this.target = null;
            this.gravity = this.nonJumpingGravity;
            console.log("landed");

        }
    }




    setJuggleCenter(offsetX, offsetY) {
        this.juggleOffsetX = offsetX;
        this.juggleOffsetY = offsetY;
    }

    interactWith(other) {

    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);


        // Draw shield aura if active
        if (this.hasShield && this.shieldActive) {
            context.strokeStyle = "rgba(0, 255, 255, 0.5)";
            context.beginPath();
            context.arc(this.x, this.y, this.protectionAuraRadius, 0, 2 * Math.PI);
            context.stroke();
        }

    }

    onDeath() {
        // Remove all MimeHeads
        this.removeAllMimeHeads();
    }
}



// MimeHeadEnemy.js

class MimeHeadEnemy extends Enemy {
    constructor(x, y, isProjectile = false) {
        super(x, y, 6, 6, 50);
        this.speed = 0.5;
        this.direction = 1;

        this.isProjectile = isProjectile;

        // Frames per animation frame
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.mime_head, "Idle", this.animationSpeed);

        this.protectionAuraRadius = 6;

        this.jumpSpeed = 2.6;
        this.gravity = 0.07;
        this.jumpClock = new Clock();
        this.jumpDelay = 120; // Frames before next jump

        // Whether it's being juggled by the Unicyclist
        this.isBeingJuggled = false;
    }

    update(map, entities) {
        super.update(map, entities);

        if(this.dead) {
            return;
        }

        if (this.isBeingJuggled) {
            // MimeHeads being juggled do not perform their own behaviors
            this.velocity.x = 0;
            this.velocity.y = 0;
            return;
        }

        if(this.isProjectile) {
            this.sprite.setAnimation("Rotate");
            return;
        }

        // Basic hopping behavior
        if (!this.bottomHit) {
            this.velocity.x = this.speed * this.direction;
            this.sprite.setAnimation("Rotate");
        } else {
            this.velocity.x = 0;
            this.sprite.setAnimation("Idle");
        }

        if (this.bottomHit && this.jumpClock.getTime() > this.jumpDelay) {
            this.velocity.y = -this.jumpSpeed;
            this.jumpClock.restart();
        }
    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }

    interactWith(other) {
        if(this.isProjectile) return;
        if (other instanceof Player && Math.abs(this.x - other.x) > 32 && this.bottomHit) {
            this.direction = this.x < other.x ? 1 : -1;
        }
    }
}

