
// const PLAYER_WEAPONS = ["cannon", "drill", "hammer", "shuriken", "sword", "spear"];
const PLAYER_WEAPONS = ["shuriken", "sword", "spear", "hammer"];
const WEAPON_OPTIONS = {
    "sword": {
        isProjectile: false,
        attackDelay: 20,
        spriteOffsetX: -3,
        spriteOffsetY: -7,
        collider: {offsetX: -2, offsetY: -9, width: 30, height: 24},
        animationSpeed: 5,
        damage: CONSTANTS.DEBUG ? 1000 : 100,
        // sound: {name: "sword_slash.mp3", volume: 0.05},
        sound: {name: "hit.wav", volume: 0.2},
    },
    "spear": {
        isProjectile: false,
        attackDelay: 15,
        spriteOffsetX: -3,
        spriteOffsetY: -7,
        collider: {offsetX: 0, offsetY: 0, width: 42, height: 8},
        animationSpeed: 4,
        damage: 75,
        // sound: {name: "sword_slash.mp3", volume: 0.05},
        sound: {name: "hit.wav", volume: 0.2},
    },
    "hammer": {
        isProjectile: false,
        attackDelay: 60,
        spriteOffsetX: -3,
        spriteOffsetY: -7,
        collider: {offsetX: -2, offsetY: -13, width: 28, height: 30},
        animationSpeed: 6,
        damage: 250,
        // sound: {name: "hammer_slash.mp3", volume: 0.15},
        sound: {name: "hit.wav", volume: 0.2},
    },
    "shuriken": {
        isProjectile: true,
        createProjectileCollider: (x, y) => {
            return new Collider(x, y, 4, 4, 50, 60);
        },
        createProjectileSprite: () => {
            return new AnimatedSprite(Loader.spriteSheets["shuriken"], "Attack", 3)
        },
        speed: 4,
        attackDelay: 20,
        spriteOffsetX: 2,
        spriteOffsetY: 2,
        collider: {offsetX: 0, offsetY: 0, width: 0, height: 0},
        animationSpeed: 24,
        damage: 50,
        // sound: {name: "shuriken.wav", volume: 0.1},
        sound: {name: "hit.wav", volume: 0.2},
    }
    
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 8, 8);
        this.spawnPosition = {x: x, y: y};

        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.samurai, "Run", this.animationSpeed);

        this.weapon;
        this.setWeapon("sword");
        this.weaponSprites = {};
        for(let i = 0; i < PLAYER_WEAPONS.length; i++) {
            this.weaponSprites[PLAYER_WEAPONS[i]] = new AnimatedSprite(Loader.spriteSheets[PLAYER_WEAPONS[i]], "Idle", WEAPON_OPTIONS[PLAYER_WEAPONS[i]].animationSpeed);
        }

        this.defaultSpeed = 0.666;
        this.speed = 1;
        this.friction = 0.94;
        this.xVelLowerThreshold = 0.3;

        this.gravity = 0.17;
		this.jumpReleaseMultiplier = 0.7;
		this.maxJumpHoldTime = 11;
		this.jumpHoldTimer = new Clock();
		this.jumpHoldTimer.add(this.maxJumpHoldTime + 6);
		this.hasCutJumpVelocity = false;
        this.canJump = true;

		this.jumpSpeed = 2.6;
        this.wallJumpSpeed = 1.6;
        this.isWallJumping = false;
        this.wallSlideDownSpeed = 0.5;

        this.framesAllowedTouchSpike = 2;
        this.framesTouchingSpike = 0;

        this.attackClock = new Clock();

        this.invincibilityDuration = 60;
        this.invincibilityTimer = new Clock();
        this.isInvincible = false;

        this.dead = false;
        this.framesCollindingWithEnemy = 0;
        this.allowedFramesCollidingWithEnemy = 4;

        // Dash variables
        this.dashSpeed = 3.5;         // Horizontal speed during dash
        this.dashDuration = 9;     // How long dash lasts (in frames)
        this.dashCooldown = 20;     // Frames before next dash allowed
        this.isDashing = false;
        this.dashTimer = new Clock();
        this.dashClock = new Clock();
    }

    update(map, entities) {
        // Disable player movement if a riddle is active
        if(currentScene.isRiddleActive) {
            this.velocity.x = 0;
            this.velocity.y = 0;
            return;
        }

        super.update(map, entities);
        this.constrainPosition(map);

        if(this.dead) {
            return;
        }

        // check for spike
        // handle spikes
        if(map.pointIsCollidingWithSpikes(this.x, this.y) 
            || map.pointIsCollidingWithSpikes(this.x + this.width - 1, this.y) 
            || map.pointIsCollidingWithSpikes(this.x, this.y + this.height - 1) 
            || map.pointIsCollidingWithSpikes(this.x + this.width - 1, this.y + this.height - 1)) {
                this.framesTouchingSpike++;
            } else {
                this.framesTouchingSpike = 0;
            }
            if(this.framesTouchingSpike >= this.framesAllowedTouchSpike) {
                // this.x = this.spawnPosition.x;
                // this.y = this.spawnPosition.y;
                this.takeDamage();
            }

        // Attempt to start dash if conditions are met
        if(!this.isDashing && Inputs.dash && this.dashClock.getTime() > this.dashCooldown) {
            this.isDashing = true;
            this.dashTimer.restart();
            this.velocity.x = this.sprite.direction * this.dashSpeed;
            Loader.playSound("dash01.wav", 0.1);
        }

        // If currently dashing, override normal movement
        if(this.isDashing) {
            this.sprite.setAnimation("Run");
            // Maintain horizontal dash speed, ignore normal friction and jumping
            this.velocity.y = 0; 
            this.velocity.x = this.sprite.direction * this.dashSpeed; 

            for(let i = 0; i < 5; i++) {
                // create light blue particles
                let particle = new Particle(this.x + this.width/2 + Math.floor(Math.random() * 3) - 1, 
                    this.y + this.height/2 + Math.floor(Math.random() * 8) - 4, 
                    2, 2, "rgba(0, 255, 255, 0.5)", Math.floor(Math.random() * 10));
                entities.push(particle);
            }

            if(this.dashTimer.getTime() > this.dashDuration) {
                this.isDashing = false;
                this.dashClock.restart(); // start cooldown after dash ends
                this.velocity.x = 0;
            }
            // Skip normal handling while dashing
            
            if(this.isDashing && (this.velocity.x > 0 && Inputs.left) || (this.velocity.x < 0 && Inputs.right)) {
                this.isDashing = false;
                this.dashClock.restart(); // start cooldown after dash ends
                this.velocity.x = 0;
            }

            return;
        }

        // handle basic physics
        this.velocity.x *= this.friction;
        if(this.bottomHit && this.velocity.x < 0.5) this.velocity.x = 0;
        if(Math.abs(this.velocity.x) < this.xVelLowerThreshold) this.velocity.x = 0;


        // handle jumping
        if(!Inputs.jump) this.canJump = true;
        if(this.bottomHit && Inputs.jump && this.canJump) {
            this.velocity.y = -this.jumpSpeed;
            this.hasCutJumpVelocity = false;
            this.jumpHoldTimer.restart();
            this.canJump = false;

            Loader.playSound("jump.wav", 0.1);
        }
        if(this.jumpHoldTimer.getTime() < this.maxJumpHoldTime && Inputs.jump) {
            this.velocity.y = -this.jumpSpeed;
            if(this.topHit) {
                this.hasCutJumpVelocity = true;
                this.jumpHoldTimer.add(10000);
            }
        } else if(!this.hasCutJumpVelocity && this.jumpHoldTimer.getTime() < this.maxJumpHoldTime) {
            this.jumpHoldTimer.add(10000);
            this.velocity.y *= this.jumpReleaseMultiplier;
            this.hasCutJumpVelocity = true;
        }
        
        // Handle wall jumping
        if(!this.bottomHit && this.rightHit && Inputs.jump && this.canJump && !this.isWallJumping) {
            this.canJump = false;
            this.velocity.y = -this.jumpSpeed;
            this.velocity.x = -this.wallJumpSpeed;
            this.moveH(map, -1);
            this.sprite.direction = -1;
            Inputs.shoot = false;

            Loader.playSound("jump.wav", 0.1);
        }
        if(!this.bottomHit && this.leftHit && Inputs.jump && this.canJump && !this.isWallJumping) {
            this.canJump = false;
            this.velocity.y = -this.jumpSpeed;
            this.velocity.x = this.wallJumpSpeed;
            this.moveH(map, 1);
            this.sprite.direction = 1;
            Inputs.shoot = false;

            
            Loader.playSound("jump.wav", 0.1);
        }

        if(Math.abs(this.velocity.y) < 0.25) {
            if(!XOR(Inputs.left, Inputs.right)) {
                this.sprite.setAnimation("Idle");
            } else {
                this.sprite.setAnimation("Run");
            }
        } else {
            if(this.velocity.y < 0) {
                this.sprite.setAnimation("Jump");
            } else {
                this.sprite.setAnimation("Fall");
            }
        }

        if(Inputs.left && Math.abs(this.velocity.x) < this.speed && this.velocity.x <= 0.5) {
            this.moveH(map, -this.speed);
            this.sprite.direction = -1;
        }
        if(Inputs.right && Math.abs(this.velocity.x) < this.speed && this.velocity.x >= -0.5) {
            this.moveH(map, this.speed);
            this.sprite.direction = 1;
        }

        // handle wall sliding
        if(!this.bottomHit && this.rightHit && Inputs.right) {
            if(this.velocity.y > 0)
                this.velocity.y -= this.gravity/2;
            if(this.velocity.y > this.wallSlideDownSpeed) this.velocity.y = this.wallSlideDownSpeed;
            this.sprite.direction = this.rightHit ? 1 : -1;
            this.sprite.setAnimation("Wall Slide");
        }
        if(!this.bottomHit && this.leftHit && Inputs.left) {
            if(this.velocity.y > 0)
                this.velocity.y -= this.gravity/2;
            if(this.velocity.y > this.wallSlideDownSpeed) this.velocity.y = this.wallSlideDownSpeed;
            this.sprite.direction = this.rightHit ? 1 : -1;
            this.sprite.setAnimation("Wall Slide");
        }



        // handle weapon
        if(this.weapon) {
            if(Inputs.shoot && this.attackClock.getTime() > WEAPON_OPTIONS[this.weapon].attackDelay) {

                let weaponSprite = this.weaponSprites[this.weapon];
                weaponSprite.setAnimation("Attack");
                weaponSprite.restartAnimation();
                weaponSprite.nextAnimation = "Idle";

                Loader.playSound(WEAPON_OPTIONS[this.weapon].sound.name, WEAPON_OPTIONS[this.weapon].sound.volume);

                if(WEAPON_OPTIONS[this.weapon].isProjectile) {
                    this.shootProjectile(entities);
                } else {
                    entities.push(this.createWeaponCollider());
                }

                this.attackClock.restart();
            }
        }

        // handle invincibility
        if(this.isInvincible && this.invincibilityTimer.getTime() > this.invincibilityDuration) {
            this.isInvincible = false;
            if(currentScene.crate.isHidden) {
                currentScene.crate.relocate();
            }
        }

        this.isWallJumping = false;
    }

    interactWith(other) {
        if(other instanceof Flag) {
            if(this.colliding(other)) {
                currentScene.hitFlagToWin();
            }
        }
        if(other.isEnemy || (other instanceof Collider && other.damagesPlayer)) {
            if(this.colliding(other) && !this.isInvincible && !this.dead) {
                this.framesCollindingWithEnemy++;
                if(this.framesCollindingWithEnemy < this.allowedFramesCollidingWithEnemy)
                    return;
                this.takeDamage();
            } else {
                // // if dashing, we define a "close miss" as being within 2 pixels of the upper or lower edge of the enemy
                // // but not actually colliding with it
                // if(this.isDashing && !this.isInvincible) {
                //     if((this.y + this.height > other.y - 3 && this.y < other.y + other.height + 3)
                //         && (this.x + this.width > other.x && this.x < other.x + other.width)) {
                //         // create particle at that location
                //         let particleOffsetY = 0;
                //         if(this.y > other.y + other.height/2) {
                //             particleOffsetY = -3;
                //         } else {
                //             particleOffsetY = 3;
                //         }
                //         let particle = new Particle(this.x + this.width/2, this.y + this.height/2 + particleOffsetY, 4, 4, "rgba(255, 215, 0, 0.5)", 60);
                //         currentScene.entities.push(particle);
                //     }
                // }
            }
        }
        if(other instanceof Crate) {
            if(this.colliding(other)) {
                // choose a random other weapon
                let weapons = PLAYER_WEAPONS.filter(weapon => weapon !== this.weapon);
                let newWeapon = weapons[Math.floor(Math.random() * weapons.length)];
                this.setWeapon(newWeapon);
                other.hide();

                Loader.playSound("powerup2.wav", 0.3);
            }
        }
    }

    takeDamage() {
        if(this.isInvincible || this.dead) return;
        Loader.playSound("damage.wav", 0.3);
        if(this.weapon) {
            // create a dummy entity with the weapon sprite and call die method so it goes flying
            let weaponSprite = new AnimatedSprite(Loader.spriteSheets[this.weapon], "Idle", WEAPON_OPTIONS[this.weapon].animationSpeed);
            let dummy = new TurtleTadpoleEnemy(this.x, this.y, 0, 0);
            dummy.sprite = weaponSprite;
            dummy.maxHealth = 0;
            dummy.die(-this.sprite.direction * 3);
            currentScene.entities.push(dummy);

            
            currentScene.updateCrateLocations();

            shakeScreen(5);
            
            this.isInvincible = true;
            this.invincibilityTimer.restart();
            this.weapon = null;
        } else {
            // dead
            currentScene.freezeFrame(60);
            this.velocity.x = -this.sprite.direction * 3;
            this.velocity.y = -3;
            this.dead = true;
            this.collidesWithMap = false;
            this.sprite.setAnimation("Idle");
            this.sprite.paused = true;
            setFrameTimeout(() => {
                if(currentScene.restart)
                    currentScene.restart();
            }, 240);
        }
    }

    resetPosition() {
        this.x = this.spawnPosition.x;
        this.y = this.spawnPosition.y;
    }

    draw(context) {
        if(this.dead) {
            this.sprite.tint = "rgba(255, 0, 0, 0.5)";
        } else{
            this.sprite.tint = null;
        }

        // Draw Player
        if(this.isInvincible) {
            if(APP_ELAPSED_FRAMES % 20 < 10) {
                this.sprite.draw(context, this.x, this.y);
            }
        } else {
            this.sprite.draw(context, this.x, this.y);
        }

        // Draw Weapon
        if(this.weapon) {
            let weaponSprite = this.weaponSprites[this.weapon];
            weaponSprite.direction = this.sprite.direction;

            let offsetX;
            if(this.sprite.direction === 1)
                offsetX = WEAPON_OPTIONS[this.weapon].spriteOffsetX + this.width;
            else
                offsetX = -WEAPON_OPTIONS[this.weapon].spriteOffsetX - weaponSprite.width;
            let offsetY = WEAPON_OPTIONS[this.weapon].spriteOffsetY;    
            weaponSprite.draw(context, this.x + offsetX, this.y + offsetY);
        }
    }

    setWeapon(weapon) {
        if(!PLAYER_WEAPONS.includes(weapon)) return;
        this.weapon = weapon;
    }

    createWeaponCollider() {
        let direction = this.sprite.direction;
        let collider = WEAPON_OPTIONS[this.weapon].collider;
        
        if(direction === 1) {
            return new Collider(this.x + this.width + collider.offsetX, this.y + collider.offsetY, collider.width, collider.height, WEAPON_OPTIONS[this.weapon].damage);
        } else {
            return new Collider(this.x - collider.offsetX - collider.width, this.y + collider.offsetY, collider.width, collider.height, WEAPON_OPTIONS[this.weapon].damage);
        }
    }

    shootProjectile(entities) {
        let collider = WEAPON_OPTIONS[this.weapon].createProjectileCollider(this.x, this.y);
        let sprite = WEAPON_OPTIONS[this.weapon].createProjectileSprite();
        entities.push(collider);
        entities.push(new Projectile(
            this.x, this.y, this.sprite.direction * WEAPON_OPTIONS[this.weapon].speed, 0, collider, sprite
        ));
    }

}










// Enemy that runs back and forth from edge to edge
class SentryEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 8, 8, 150);
        this.speed = 0.5;
        this.direction = 1;


        // frames per animation frame
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.spider, "Run", this.animationSpeed);

        this.amountOfTimeToWait = 90;
        this.waitTimer = new Clock();
        this.waitTimer.add(this.amountOfTimeToWait);


    }

    update(map, entities) {
        super.update(map, entities);

        if(this.rightHit || this.leftHit) {
            this.direction *= -1;
            this.x += this.direction;
        }

        if(this.waitTimer.getTime() > this.amountOfTimeToWait) {
            this.velocity.x = this.speed * this.direction;
            this.sprite.direction = this.direction;
            this.sprite.setAnimation("Run");

        } else {
            this.velocity.x = 0;
            this.sprite.setAnimation("Idle");
        }

        // if the point to the down and right or left and down is empty, turn around since it's about to fall off
        if(!map.pointIsCollidingWithWall(this.x + this.width + 1, this.y + this.height + 1)
        || !map.pointIsCollidingWithWall(this.x - 1, this.y + this.height + 1)) {
            this.direction *= -1;

            this.waitTimer.restart();
            this.x += this.direction;
        }




    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }

    interactWith(other) {
        // if(other.isEnemy) {
        //     if(this.colliding(other)) {
        //         this.direction *= -1;
        //     }
        // }
    }
}





// // the turtle makes it rain tadpoles (that look like sperm) that the player has to dodge.
// class TurtleEnemy extends Enemy {
//     constructor(x, y) {
//         super(x, y, 54, 39);
//         this.speed = 0.2;
//         this.direction = -1;

//         this.animationSpeed = 8;
//         this.sprite = new AnimatedSprite(Loader.spriteSheets.turtle, "Run", this.animationSpeed);
//         this.sprite.isBackwards = true;

//         this.protectionAuraRadius = 30;

//         this.jumpSpeed = 4;
//         this.gravity = 0.17;
//         this.canJump = true;


//         this.isContracted = false;
//         this.contractTimer = new Clock();
//         this.contractTime = 400;
//         this.contractTimeRange = {min: 400, max: 600};
//     }

//     update(map, entities) {
//         super.update(map, entities);
        

//         // Turn around if hitting a wall
//         if(this.rightHit || this.leftHit) {
//             this.direction *= -1;
//             this.x += this.direction * 2;
//         }


//         // Contract and expand
//         if(this.contractTimer.getTime() > this.contractTime) {
//             if(!this.isContracted) {
//                 this.sprite.setAnimation("Contract");
//                 this.sprite.nextAnimation = "Idle-Contracted";

//                 this.sprite.onAnimationComplete = () => {
//                     this.hasProtectionAura = true;
//                     this.sprite.onAnimationComplete = null;
//                 }

//                 this.isContracted = !this.isContracted;

//                 this.velocity.x = 0;
//             }
//             else {
//                 this.sprite.setAnimation("Run");
//                 this.isContracted = !this.isContracted;

//                 this.hasProtectionAura = false;
//             }
            
//             this.contractTimer.restart();
//             this.contractTime = Math.random() * (this.contractTimeRange.max - this.contractTimeRange.min) + this.contractTimeRange.min;
//         }

//         // If not contracted, move
//         if(!this.isContracted) {
//             this.velocity.x = this.speed * this.direction;
//             this.sprite.direction = this.direction;
//             this.sprite.setAnimation("Run");
//         }
       
//     }

//     draw(context) {
//         super.draw(context);
//         this.sprite.draw(context, this.x, this.y);
//         // rect(this.x, this.y, this.width, this.height, context, "rgba(255, 0, 0, 0.5)");
//     }

//     interactWith(other) {
//         // if(other.isEnemy) {
//         //     if(this.colliding(other)) {
//         //         this.direction *= -1;
//         //     }
//         // }
//     }

// }