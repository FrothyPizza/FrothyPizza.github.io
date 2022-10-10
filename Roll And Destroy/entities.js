class Entity {
    constructor(x, y, width, height) {
        this.x = Math.round(x);
        this.y = Math.round(y);
        this.velocity = { x: 0, y: 0 };
        this.gravity = 0.2;
        this.jumpForce = -2;
        this.speed = 1;
        this.color = { r: 200, g: 200, b: 255 };
        this.width = width || 4;
        this.height = height || 4;
        this.health = 100;
        this.explosionVulnerability = 0;
        this.acidVulnerability = 0;
        this.dead = false;
        this.damagesPlayer = false;

        this.bottomHit = false;
        this.topHit = false;
        this.leftHit = false;
        this.rightHit = false;

        this.currentlyTouching = [];

        this.pixelOffsets = [];
        for(let y = 0; y < this.height; y++)
            for(let x = 0; x < this.width; x++)
                this.pixelOffsets.push({ x: x, y: y });

    }

    draw() {
        context.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
        context.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
    }

    update(world) {
        this.moveOutIfStuck(world);

        this.topHit = false;
        this.bottomHit = false;
        this.leftHit = false;
        this.rightHit = false;

        // attempt moving in every direction to check which side is colliding
        let save = { x: this.x, y: this.y };
        let saveV = { x: this.velocity.x, y: this.velocity.y };
        this.moveH(world, -1);
        this.x = save.x;
        this.moveH(world, 1);
        this.x = save.x;
        this.moveV(world, -1);
        this.y = save.y;
        this.moveV(world, 1);
        this.y = save.y;
        this.velocity.x = saveV.x;
        this.velocity.y = saveV.y;

        this.velocity.y += this.gravity;


        this.moveV(world, this.velocity.y);
        this.moveH(world, this.velocity.x);

        this.currentlyTouching = [];
        let x = Math.round(this.x);
        let y = Math.round(this.y);
        for(let offset of this.pixelOffsets) {
            let xo = x + offset.x;
            let yo = y + offset.y;
            if(world.get(xo, yo).specific)
                this.currentlyTouching.push(world.get(xo, yo).specific);

            if(world.get(xo, yo).specific === 'explosionSpark')
                this.health -= this.explosionVulnerability;
            
            if(world.get(xo, yo).specific === 'acid')
                this.health -= this.acidVulnerability;
        }

        if(this.health <= 0) {
            this.dead = true;
        }
    }

    moveH(world, val) {
        let oldX = this.x;
        if(!this.moveHhelper(world, val)) {
            this.moveV(world, -1);
            if(!this.moveHhelper(world, val)) {
                this.moveV(world, 1);
            }
        }
        return this.x !== oldX;
    }

    // returns whether it moved the whole distance
    moveHhelper(world, val) {
        let pos = { x: Math.round(this.x), y: Math.round(this.y) };
        let newPos = { x: Math.round(this.x + val), y: Math.round(this.y) };

        if(pos === newPos) {
            this.x += val;
            return false;
        }


        let inbetween = bresenham(pos.x, pos.y, newPos.x, newPos.y);
        for(let i = 1; i < inbetween.length; i++) {
            let point = inbetween[i];
            if(this.colliding(world, point.x, point.y)) {
                this.x = inbetween[i - 1].x;
                this.velocity.x = 0;
                if(val < 0) {
                    this.leftHit = true;
                }
                if(val > 0) {
                    this.rightHit = true;
                }
                return false;
            }
        }

        this.x += val;
        return true;
    }

    moveV(world, val) {
        let pos = { x: Math.round(this.x), y: Math.round(this.y) };
        let newPos = { x: Math.round(this.x), y: Math.round(this.y + val) };

        if(pos === newPos) {
            this.y += val;
            return false;
        }

        let inbetween = bresenham(pos.x, pos.y, newPos.x, newPos.y);
        for(let i = 1; i < inbetween.length; i++) {
            let point = inbetween[i];
            if(this.colliding(world, point.x, point.y)) {
                this.y = inbetween[i - 1].y;
                this.velocity.y = 0;
                if(val < 0) {
                    this.topHit = true;
                }
                if(val > 0) {
                    this.bottomHit = true;
                }
                return Math.round(this.y) !== Math.round(pos.y);
            }
        }

        this.y += val;
        return true;
    }

    colliding(world, x, y) {
        x = Math.round(x);
        y = Math.round(y);
        for(let offset of this.pixelOffsets) {
            let xo = x + offset.x;
            let yo = y + offset.y;
            if(world.get(xo, yo).type === 'immovableSolid' || world.get(xo, yo).type === 'movableSolid' && world.get(xo, yo).specific !== 'fire') {
                return true;
            }
        }
        return false;
    }

    moveOutIfStuck(world) {
        if(!this.colliding(world, this.x, this.y)) return; 
        for(let i = 1; i <= 10; ++i) {
            this.y -= i;
            if(!this.colliding(world, this.x, this.y)) return;
            this.x += i;
            if(!this.colliding(world, this.x, this.y)) return;
            this.x -= i * 2;
            if(!this.colliding(world, this.x, this.y)) return;
            this.y += i;
            this.x += i;

            this.x -= i;
            if(!this.colliding(world, this.x, this.y)) return;
            this.x += i;

            this.x += i;
            if(!this.colliding(world, this.x, this.y)) return;
            this.x -= i;
        }

    }
}



class Player extends Entity {
    constructor(x, y) {
        super(x, y, 4, 4);

		this.jumpSpeed = 2.5;
		this.jumpReleaseMultiplier = 0.7;
		this.maxJumpHoldTime = 100;
		this.jumpHoldTimer = new Clock();
		this.jumpHoldTimer.add(this.maxJumpHoldTime + 1000);
		this.hasCutJumpVelocity = false;

        this.health = 100;
        this.explosionVulnerability = 1.3;
        this.acidVulnerability = 0.3;
        this.invincibilityTimer = new Clock();
        this.invincibilityTimer.start();
        this.invincibilityTime = 200;
        this.invincibilityTimer.add(this.invincibilityTime);


        this.shootTimer = new Clock();
        this.shootDelay = 500;

        this.stoneAmount = 100;
        this.buildDist = 14;
        this.buildRadius = 2;

        this.score = 0;
    }

    update(world, entities) {
        super.update(world);
        



        if(this.bottomHit && Inputs.jumpPressed) {
            this.velocity.y = -this.jumpSpeed;
            this.jumpHoldTimer.restart();

            // sounds.jump.play();
        }
        
        if(this.jumpHoldTimer.getElapsedTime() < this.maxJumpHoldTime && Inputs.jumpPressed) {
            this.velocity.y = -this.jumpSpeed;
            this.hasCutJumpVelocity = true;
            if(this.topHit) {
                this.hasCutJumpVelocity = true;
                this.jumpHoldTimer.add(10000);
            }
        } else if(!this.hasCutJumpVelocity) {
            this.jumpHoldTimer.add(10000);
            this.velocity.y *= this.jumpReleaseMultiplier;
            this.hasCutJumpVelocity = true;
        }
        
        if(Inputs.leftPressed) {
            this.moveH(world, -this.speed);
        }
        if(Inputs.rightPressed) {
            this.moveH(world, this.speed);
        }

        if(Inputs.shootPressed) {
            this.shoot(world, entities);
        }

        if(Inputs.buildPressed) {
            this.createWall(world);
        }


        if(this.touchingEnemies(entities)) {
            this.health -= 1;
        }

    }



    createWall(world) {
        if(this.stoneAmount <= 0) return;
        let angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        let x = Math.round(this.x + this.width/2 + Math.cos(angle) * this.buildDist);
        let y = Math.round(this.y + Math.sin(angle) * this.buildDist);

        world.set(x, y, createCell('wood'));
        world.set(x + 1, y, createCell('wood'));
        world.set(x, y + 1, createCell('wood'));
        world.set(x + 1, y + 1, createCell('wood'));

        // this.stoneAmount -= 0.2;
    }

    draw() {
        super.draw();
        
        context.fillStyle = 'rgba(200, 100, 0, 0.7)';
        context.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height * this.stoneAmount / 100);

        if(this.stoneAmount > 0) {
            let angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
            let x = Math.round(this.x + this.width/2 + Math.cos(angle) * this.buildDist);
            let y = Math.round(this.y + Math.sin(angle) * this.buildDist);
            context.fillStyle = 'rgba(255, 255, 255, 0.5)';
            context.fillRect(x, y, 2, 2);
        }
    }

    touchingEnemies(entities) {
        for(let entity of entities) {
            if(entity.damagesPlayer && 
                entity.x > this.x - this.width && 
                entity.x < this.x + this.width && 
                entity.y > this.y - this.height && 
                entity.y < this.y + this.height) {
                return true;
            }
        }
        return false;
    }


    shoot(world, entities) {
        if(this.shootTimer.getElapsedTime() < this.shootDelay) return;
        this.shootTimer.restart();

        let angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        let explosive = new Explosive(this.x + this.width/2, this.y, angle);

        entities.push(explosive);
        sounds.shoot.play();

        // setTimeout(() => {
        //     sounds.beep.volume = 0.03;
        //     sounds.beep.play();

        // }, 1000 / 4);
        
        // setTimeout(() => {
        //     sounds.beep.volume = 0.06;
        //     sounds.beep.currentTime = 0;
        //     sounds.beep.play();
        // }, 1000 / 2);

        // setTimeout(() => {
        //     sounds.beep.volume = 0.09;
        //     sounds.beep.currentTime = 0;
        //     sounds.beep.play();
        // }, 1000 / 4 * 3);
    }
}


class Explosive extends Entity {
    constructor(x, y, direction) {
        super(x, y, 2, 2);
        this.speed = 4;

        this.velocity.x = Math.cos(direction) * this.speed;
        this.velocity.y = Math.sin(direction) * this.speed;

        this.color = { r: 100, g: 0, b: 0 };


        this.explosionSize = 16;
        this.explosionIntensity = 1;
        this.explosionTimer = new Clock();
        this.explosionTime = 1000;
    }

    update(world) {
        if(this.colliding(world, this.x, this.y) || this.bottomHit || this.topHit || this.leftHit || this.rightHit) {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.gravity = 0;
        }
        super.update(world);
        
        let timeToExplode = this.explosionTime - this.explosionTimer.getElapsedTime();
        this.color.r = 255 - Math.round(170 * (timeToExplode / this.explosionTime));

        if(this.explosionTimer.getElapsedTime() > this.explosionTime) {
            world.explode(Math.round(this.x), Math.round(this.y), this.explosionSize, this.explosionIntensity);
            this.dead = true;

            sounds.explosion.currentTime = 0;
            sounds.explosion.play();
        }


    }
}



// an enemy that jumps around towards the player
class Meep extends Entity {
    constructor(x, y) {
        super(x, y, 2, 2);
        this.damagesPlayer = true;

        this.speed = 1;
        this.direction = 1;
        this.jumpForce = 2.2;
        this.jumpTimer = new Clock();
        this.jumpTimer.start();
        this.gravity = 0.11;

        this.creates = 'sand';

        this.color = { r: 255, g: 200, b: 200 };

        this.jumpInterval = 1500 + Math.random() * 1000;

        this.health = 1;       
        this.explosionVulnerability = 1;
        this.acidVulnerability = 0;
    }

    update(world, player) {
        super.update(world);


        if(this.jumpTimer.getElapsedTime() > this.jumpInterval && this.bottomHit) {
            this.jumpTimer.restart();
            this.jumpInterval = 1500 + Math.random() * 1000;
            this.velocity.y = -this.jumpForce;

            if(Math.random() > 0.7) {
                this.direction = (player.x > this.x) ? 1 : -1;
            } else {
                this.direction = (Math.random() > 0.5) ? 1 : -1;
            }
        }


        if(this.creates === 'wall') {
            if(Math.random() > 0.7) {
                this.place(world);
            }
        } else {
           this.place(world); 
        }
        


        if(!this.bottomHit) {
            this.velocity.x = this.direction * this.speed;
        } else {
            this.velocity.x = 0;
        }

        if(this.leftHit && this.direction < 0) {
            this.direction = 1;
        }
        if(this.rightHit && this.direction > 0) {
            this.direction = -1;
        }
    }

    place(world) {
        let offset = Math.floor(Math.random() * 3);
        let cell = createCell(this.creates);
        cell.toughness = 0;
        if((this.creates === 'sand' || this.creates === 'dirt') && world.get(this.x + offset, this.y + 1)) 
            cell.isFreeFalling = true;

        world.set(this.x + offset, this.y + 1, cell);

    }
}


class Seeker extends Entity {
    constructor(x, y) {
        super(x, y, 2, 2);
        this.damagesPlayer = true;

        this.speed = 0.25 + Math.random() * 0.25;
        this.angle = 0;
        this.angleOffset = Math.random() * 0.5 - 0.25;

        this.creates = 'sand';

        this.color = { r: 255, g: 200, b: 200 };

        this.jumpInterval = 1500 + Math.random() * 1000;

        this.health = 1;       
        this.explosionVulnerability = 1;
        this.acidVulnerability = 1;
    }

    update(world, player) {
        super.update(world);

        this.angle = Math.atan2(player.y - this.y, player.x - this.x) + this.angleOffset;
        this.velocity.x = Math.cos(this.angle) * this.speed;
        this.velocity.y = Math.sin(this.angle) * this.speed;

        this.place(world);
    }

    place(world) {
        // place behind it
        let angle = this.angle + Math.PI;
        
        let position = {
            x: this.x + Math.cos(angle) * 4,
            y: this.y + Math.sin(angle) * 4
        }
        let cell = createCell(this.creates);
        cell.toughness = 0;
        world.set(Math.round(position.x), Math.round(position.y), cell);

    }
}


function createMeep(x, y, element) {
    let meep = new Meep(x, y);
    meep.creates = element;

    if(element === 'sand') {
        meep.color = { r: 194, g: 168, b: 128 };
    }
    if(element === 'dirt') {
        meep.color = { r: 70, g: 50, b: 30 };
    }
    if(element === 'wall') {
        meep.color = { r: 120, g: 120, b: 120 };
    }
    if(element === 'water') {
        meep.color = { r: 0, g: 0, b: 255 };
    }
    if(element === 'acid') {
        meep.color = { r: 0, g: 255, b: 0 };
        meep.acidVulnerability = 0;
    }

    return meep;

}


createSeeker = function(x, y, element) {
    let seeker = new Seeker(x, y);
    seeker.creates = element;

    if(element === 'sand') {
        seeker.color = { r: 194, g: 168, b: 128 };
    }
    if(element === 'dirt') {
        seeker.color = { r: 70, g: 50, b: 30 };
    }
    if(element === 'wall') {
        seeker.color = { r: 120, g: 120, b: 120 };
    }
    if(element === 'water') {
        seeker.color = { r: 0, g: 0, b: 255 };
    }
    if(element === 'acid') {
        seeker.color = { r: 0, g: 255, b: 0 };
        seeker.acidVulnerability = 0;
    }

    return seeker;
}