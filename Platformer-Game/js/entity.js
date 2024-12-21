

class GameObject {
    constructor(x, y, w, h) {
        this.x = round(x);
        this.y = round(y);
        this.width = w;
        this.height = h;

        this.dead = false;
        this.removeFromScene = false
    }

    update(map, entities) {
        // error since this is an abstract class
        throw new Error("Method 'update' must be implemented.");
    }

    draw(context) {
        context.fillStyle = "red";
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    colliding(other) {
        return (this.x + this.width > other.x && this.x < other.x + other.width &&
                this.y + this.height > other.y && this.y < other.y + other.height);
    }
}




class Entity extends GameObject{
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.velocity = {x: 0, y: 0};
        this.defaultGravity = 0.2;
        this.gravity = this.defaultGravity;


        this.bottomHit = false; // whether its bottom is touching the ground
        this.topHit = false; 
        this.leftHit = false;  // whether its left side is touching a wall
        this.rightHit = false;

        this.isEnemy = false;

        this.collidesWithMap = true;

    }

    update(map, entites) {


        this.topHit = map.pointIsCollidingWithWall(this.x, this.y - 1) || map.pointIsCollidingWithWall(this.x + this.width - 1, this.y - 1);
        this.bottomHit = map.pointIsCollidingWithWall(this.x, this.y + this.height) || map.pointIsCollidingWithWall(this.x + this.width - 1, this.y + this.height);
        this.leftHit = map.pointIsCollidingWithWall(this.x - 1, this.y) || map.pointIsCollidingWithWall(this.x - 1, this.y + this.height - 1);
        this.rightHit = map.pointIsCollidingWithWall(this.x + this.width, this.y) || map.pointIsCollidingWithWall(this.x + this.width, this.y + this.height - 1);

        this.velocity.y += this.gravity;

        if(this.collidesWithMap) {
            this.moveH(map, this.velocity.x);
            this.moveV(map, this.velocity.y);
        } else {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
        }

    }

    onDeath() {
        
    }


    round(x, dir) {
        if(x - Math.floor(x) === 0.5) {
            return dir > 0 ? Math.ceil(x) : Math.floor(x);
        }
        return Math.round(x);
    }
        

    moveH(map, value) {
        let saveX = this.x;
        let desiredX = this.round(this.x + value, value);
        let sign = Math.sign(value);
        let modifier = sign == 1 ? this.width - 1 : 0;

        if(this.round(this.x, value) === desiredX) {
            this.x += value;
            return;
        }

        let iterations = 0;
        while(this.round(this.x, value) != desiredX) {
            if(!map.pointIsCollidingWithWall(this.x + sign + modifier, this.y) && !map.pointIsCollidingWithWall(this.x + sign + modifier, this.y + this.height - 1)) {
                this.x += sign;
            } else {
                this.velocity.x = 0;
                return;
            }
            if(++iterations > 200) {
                console.log("Infinite loop detected");
                break;
            }
        }
        this.x = saveX + value;
    }

    moveV(map, value) {
        let saveY = this.y;
        let desiredY = this.round(this.y + value, value);
        let sign = Math.sign(value);
        let modifier = sign == 1 ? this.height - 1 : 0;

        if(this.round(this.y, value) === desiredY) {
            this.y += value;
            return;
        }

        while(this.round(this.y, value) != desiredY) {
            if(!map.pointIsCollidingWithWall(this.x, this.y + sign + modifier) && !map.pointIsCollidingWithWall(this.x + this.width - 1, this.y + sign + modifier)) {
                this.y += sign;
            } else {
                this.velocity.y = 0;
                return;
            }
        }
        this.y = saveY + value;
    }



    collidingWithMap(map) {
        let x = Math.round(this.x);
        let y = Math.round(this.y);
        return map.pointIsCollidingWithWall(x, y)
            || map.pointIsCollidingWithWall(x + this.width - 1, y)
            || map.pointIsCollidingWithWall(x, y + this.height - 1)
            || map.pointIsCollidingWithWall(x + this.width - 1, y + this.height - 1);
    }


    collidingWithBlockType(map, type) {
        let x = Math.round(this.x);
        let y = Math.round(this.y);
        return map.pointIsCollidingWithType(x, y, type)
            || map.pointIsCollidingWithType(x + this.width - 1, y, type)
            || map.pointIsCollidingWithType(x, y + this.height - 1, type)
            || map.pointIsCollidingWithType(x + this.width - 1, y + this.height - 1, type);
    }

    draw(context) {
        super.draw(context);
    }


    constrainPosition(map) {

        if(this.x < 0 - this.width + 1) {
            this.x = 0 - this.width + 1;
        }
        if(this.x > map.width * map.tilewidth - 1) {
            this.x = map.width * map.tilewidth - 1;
        }
        if(this.y < 0 - this.height + 1) {
            this.y = 0 - this.height + 1;
        }
        if(this.y > map.height * map.tileheight - 1) {
            this.y = map.height * map.tileheight - 1;
        }
    }

    isOffMap(map) {
        return this.x < 0 - this.width || this.x > map.width * map.tilewidth || this.y < 0 - this.height || this.y > map.height * map.tileheight;
    }

    interactWith(other) {
        // error since this is an abstract class
        // throw new Error("Method 'interactWith' must be implemented.");
    }
}



