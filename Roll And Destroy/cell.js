
const MAX_VELOCITY = 7;

////// 'abstract' classes
class Cell {
    constructor(x, y) {
        this.color = { r: 13, g: 13, b: 13 };
        this.type = 'empty';
        this.specific = null;
        this.velocity = { x: 0, y: 0 };
        this.position = { x: Math.round(x), y: Math.round(y) };
        this.hasBeenUpdated = false;

        this.health = 100;
        this.corrodable = false;
        this.corrosionChance = 1;
        this.toughness = 0; // used for explosions
        this.flammability = 0; // how much damage it takes from fire, range from 0 to 1 (0 = no damage, 1 = full)
        this.temperature = 0; // 0 is neutral, positive is hot (does fire damage), negative is cold (does cold damage)
    }

    get x() { return this.position.x; }
    get y() { return this.position.y; }
    set x(value) { this.position.x = value; }
    set y(value) { this.position.y = value; }

    step(matrix) {
        // override
        
    }

    actOnOther(target, matrix) {
        // override
        return false;
    }

    actAround(matrix) {
        let acted = false;
        let neighbors = matrix.getNeighborArray(this.x, this.y);
        for(let i = 0; i < neighbors.length; i++) {
            if(this.actOnOther(neighbors[i], matrix))
                acted = true;
        }
        return acted;
    }

    darken(factor) {
        this.color.r *= factor;
        this.color.g *= factor;
        this.color.b *= factor;

        if(this.color.r < 20) this.color.r = 50;
        if(this.color.g < 20) this.color.g = 50;
        if(this.color.b < 20) this.color.b = 50;
    }

    particleSimulate(matrix) {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return;

        if(matrix.get(this.x, this.y + 1).type === 'empty')
            this.velocity.y += 0.06;
        if(Math.round(this.velocity.y) === 0 && Math.round(this.velocity.x) === 0) return;

        // clamp velocity
        if(this.velocity.x > MAX_VELOCITY) this.velocity.x = MAX_VELOCITY;
        if(this.velocity.x < -MAX_VELOCITY) this.velocity.x = -MAX_VELOCITY;
        if(this.velocity.y > MAX_VELOCITY) this.velocity.y = MAX_VELOCITY;
        if(this.velocity.y < -MAX_VELOCITY) this.velocity.y = -MAX_VELOCITY;

        // console.log(this.velocity.x, this.velocity.y);

        let desiredPosition = {
            x: this.x + Math.round(this.velocity.x),
            y: this.y + Math.round(this.velocity.y)
        };

        let between = bresenham(this.x, this.y, desiredPosition.x, desiredPosition.y);

        for(let i = 1; i < between.length; i++) {
            let checkCell = matrix.get(between[i].x, between[i].y);
            

            if(this.actOnOther(checkCell, matrix) || (checkCell.type !== 'empty' && checkCell.specific !== this.specific)) {
                let newPos = {
                    x: between[i - 1].x,
                    y: between[i - 1].y
                };
                matrix.swap(this.x, this.y, newPos.x, newPos.y);
                this.velocity.x = 0;
                this.velocity.y = 0;
                // matrix.set(newPos.x, newPos.y, this);
                return;
            }
        }

        matrix.swap(this.x, this.y, desiredPosition.x, desiredPosition.y);
        // matrix.set(desiredPosition.x, desiredPosition.y, this);
    }
}

class Liquid extends Cell {
    constructor(x, y) {
        super(x, y);
        this.type = 'liquid';
        this.color = { r: 255, g: 255, b: 255 };
        this.velocity = { x: 0, y: 0 };

        this.density = 1;
        this.dispersionRate = 5;
        this.dispersionDirection = Math.random() > 0.5 ? 1 : -1;

        this.velocity.y = 1;
        this.temperature = -1;
    }

    step(matrix) {
        
        let nbs = matrix.getNeighbors(this.x, this.y);

        let canMove = (cell) => {
            return cell.type === 'empty' || ((cell.type === 'liquid' || cell.type === 'gas') && cell.density < this.density);
        }

        if((nbs.down.type === 'liquid' || nbs.down.type === 'gas') && nbs.down.density < this.density) {
            matrix.swap(this.x, this.y, nbs.down.x, nbs.down.y);
            this.velocity.y = 0;
            this.velocity.x = 0;
            return;
        }

        if(canMove(nbs.down)) {
            matrix.swap(this.x, this.y, nbs.down.x, nbs.down.y);
        } else {
            if(canMove(nbs.downLeft) && canMove(nbs.downRight)) {
                matrix.swap(this.x, this.y, this.x + (Math.random() > 0.5 ? 1 : -1), this.y + 1);
            } else if(canMove(nbs.downLeft)) {
                matrix.swap(this.x, this.y, this.x - 1, this.y + 1);
            } else if(canMove(nbs.downRight) ) {
                matrix.swap(this.x, this.y, this.x + 1, this.y + 1);
            } else if(canMove(nbs.left) || canMove(nbs.right)) {
                this.dispersionDirection = 
                    canMove(nbs.left) && canMove(nbs.right)
                        ? this.dispersionDirection
                        // ? Math.random() > 0.5 ? 1 : -1
                        : (canMove(nbs.right) ? 1 : -1);
                this.velocity.y = 1;
                

                let i;
                let down = 0;
                for(i = 1; i < this.dispersionRate + 1; i++)
                    if(!canMove(matrix.get(this.x + (this.dispersionDirection * i), this.y)))
                        break;
                // this.velocity.x = this.dispersionDirection * (i - 1); //////////////////////////////////////////////////////////////
                matrix.swap(this.x, this.y, this.x + this.dispersionDirection * (i - 1), this.y + down);
            }
        }


        super.particleSimulate(matrix);

        this.actOnOther(matrix.get(this.x, this.y + 1), matrix);
    }



    actOnOther(target) {
        return false;
    }
}

class Solid extends Cell {
    constructor(x, y) {
        super(x, y);
        this.type = 'solid';
        this.color = { r: 255, g: 255, b: 255 };
    }
}

class MovableSolid extends Solid {
    constructor(x, y) {
        super(x, y);
        this.type = 'movableSolid';
        this.corrodable = true;

        this.isFreeFalling = false;
        this.inertalResistance = 0.1;
    }

    actOnOther(target, matrix) {
        // if(target.type !== 'empty' && this.velocity.y > 2 && Math.abs(target.velocity.y) === 0) {
        //     this.velocity.x = this.velocity.y * (Math.random() > 0.5 ? 0.5 : -0.5);
        //     // console.log(this.velocity.x);
        //     return true;
        // }
        return false;
    }

    setNeighborsIsFreeFalling(matrix) {
        let nbs = [
            matrix.get(this.x - 1, this.y + 1),
            matrix.get(this.x, this.y + 1),
            matrix.get(this.x + 1, this.y + 1),
        ]
        for(let i in nbs) {
            if(nbs[i].type === 'movableSolid' && this.isFreeFalling && Math.random() < this.inertalResistance) {
                nbs[i].isFreeFalling = true;
            }
        }
    }

    step(matrix) {
        let oldPos = { x: this.x, y: this.y };
        let nbs = matrix.getNeighbors(this.x, this.y);

        

        let canMove = (cell) => {
            return cell.type === 'empty' || cell.type === 'liquid';
        }

        if(Math.round(this.velocity.y) === 0) {
            if(canMove(nbs.down)) {
                matrix.swap(this.x, this.y, this.x, this.y + 1);
            } else if(this.isFreeFalling) {
                if(canMove(nbs.downLeft) && canMove(nbs.downRight)) {
                    matrix.swap(this.x, this.y, this.x + (Math.random() > 0.5 ? 1 : -1), this.y + 1);
                } else if(canMove(nbs.downLeft)) {
                    matrix.swap(this.x, this.y, this.x - 1, this.y + 1);
                } else if(canMove(nbs.downRight)) {
                    matrix.swap(this.x, this.y, this.x + 1, this.y + 1);
                }
            }
        }
        
        super.particleSimulate(matrix);

        if(matrix.get(this.x, this.y + 1).type === 'liquid' || matrix.get(this.x, this.y + 1).type === 'gas') {
            matrix.swap(this.x, this.y, this.x, this.y + 1);
        }

        if(this.isFreeFalling) {
            this.setNeighborsIsFreeFalling(matrix);
        }
        this.isFreeFalling = oldPos.x !== this.x || oldPos.y !== this.y;
    }
}

class ImmovableSolid extends Solid {
    constructor(x, y) {
        super(x, y);
        this.type = 'immovableSolid';
        this.corrodable = true;
    }
}


class Gas extends Cell {
    constructor(x, y) {
        super(x, y);
        this.type = 'gas';
        this.color = { r: 255, g: 255, b: 255 };
        this.velocity = { x: 0, y: 0 };

        this.density = 1;
        this.dispersionRate = 5;
        this.dispersionDirection = Math.random() > 0.5 ? 1 : -1;

        // this.velocity.y = 1;
    }

    step(matrix) {
        this.velocity.x = 0;
        this.velocity.y = 0;
        
        let nbs = matrix.getNeighbors(this.x, this.y);

        let canMove = (cell) => {
            return cell.type === 'empty' || ((cell.type === 'gas' || cell.type === 'liquid') && cell.density > this.density);
        }

        if(nbs.up.type === 'gas' && nbs.up.density > this.density) {
            matrix.swap(this.x, this.y, nbs.up.x, nbs.up.y);
            return;
        }

        if(canMove(nbs.up)) {
            matrix.swap(this.x, this.y, nbs.up.x, nbs.up.y);
        } else {
            if(canMove(nbs.upLeft) && canMove(nbs.upRight)) {
                matrix.swap(this.x, this.y, this.x + (Math.random() > 0.5 ? 1 : -1), this.y - 1);
            } else if(canMove(nbs.upLeft)) {
                matrix.swap(this.x, this.y, this.x - 1, this.y - 1);
            } else if(canMove(nbs.upRight) ) {
                matrix.swap(this.x, this.y, this.x + 1, this.y - 1);
            } else if(canMove(nbs.left) || canMove(nbs.right)) {
                this.dispersionDirection = 
                    canMove(nbs.left) && canMove(nbs.right)
                        ? this.dispersionDirection
                        // ? Math.random() > 0.5 ? 1 : -1
                        : (canMove(nbs.right) ? 1 : -1);

                let i;
                let up = 0;
                for(i = 1; i < this.dispersionRate + 1; i++)
                    if(!canMove(matrix.get(this.x + (this.dispersionDirection * i), this.y)))
                        break;
                this.velocity.x = this.dispersionDirection * (i - 1); //////////////////////////////////////////////////////////////
                matrix.swap(this.x, this.y, this.x + this.dispersionDirection * (i - 1), this.y + up);
            }
        }


        //super.particleSimulate(matrix);
        this.actOnOther(matrix.get(this.x, this.y - 1), matrix);
    }



    actOnOther(target) {
        return false;
    }
}
//////


////// implementations
class Empty extends Cell {
    constructor(x, y) {
        super(x, y);
    }
}

// indestructible
class Barrier extends ImmovableSolid {
    constructor(x, y) {
        super(x, y);
        this.specific = 'barrier';
        this.color = { r: 255, g: 255, b: 255 };
        this.corrodable = false;
        this.toughness = 1000000;
        this.flammability = 0;

    }

    darken(matrix) {
        return;
    }
}


class Water extends Liquid {
    constructor(x, y) {
        super(x, y);
        this.specific = 'water';
        this.color = { r: 35, g: 137, b: 218 };
        this.dispersionRate = 4;
        this.density = 1;
        this.flammability = -1;
    }

    step(matrix) {
        this.actAround(matrix);
        super.step(matrix);


    }

    actOnOther(target, matrix) {
        if(target.specific === 'acid') {
            matrix.set(this.x, this.y, new Acid(this.x, this.y));
            return true;   
        }
        return false;
    }
}

class Acid extends Liquid {
    constructor(x, y) {
        super(x, y);
        this.specific = 'acid';
        this.color = { r: 143, g: 254, b: 9 };
        this.dispersionRate = 1;
        this.density = 2;
        this.flammability = 2.5;

        this.corrosionRate = 5;
        this.corrosionCount = 10;
    }

    step(matrix) {
        super.step(matrix);

        let nbs = matrix.getNeighborArray(this.x, this.y);
        for(let i = 0; i < nbs.length; i++) {
            this.actOnOther(nbs[i], matrix);
        }
    }

    actOnOther(target, matrix) {
        if(target.corrodable && Math.random() < target.corrosionChance) {

            target.health -= this.corrosionRate;
            this.corrosionCount--;

            if(target.health <= 0) {
                matrix.set(target.x, target.y, new FlammableGas(target.x, target.y));
            }
            if(this.corrosionCount <= 0) {
                matrix.set(this.x, this.y, new FlammableGas(this.x, this.y));
            }
            return true;
        }

        return false;
    }
}


class Sand extends MovableSolid {
    constructor(x, y) {
        super(x, y);
        this.specific = 'sand';
        this.color = { r: 194 + Math.random() * 20, g: 168 + Math.random() * 15, b: 128 + Math.random() * 10 };

        this.inertalResistance = 0.8;
        this.health = 40;
        this.flammability = 0.01;
    }

    actOnOther(target, matrix) {
        super.actOnOther(target, matrix);

        return false;
    }
}

class Dirt extends MovableSolid {
    constructor(x, y) {
        super(x, y);
        this.specific = 'dirt';
        this.color = { r: 70 + Math.random() * 20, g: 50 + Math.random() * 10, b: 30 + Math.random() * 10 };

        this.inertalResistance = 0.4;
        this.health = 20;
    }

    actOnOther(target, matrix) {
        super.actOnOther(target, matrix);

        return false;
    }
}

class Fire extends MovableSolid {
    constructor(x, y) {
        super(x, y);
        this.specific = 'fire';
        this.color = { r: 200 + Math.random() * 40, g: 60 + Math.random() * 20, b: 0 + Math.random() * 20 };

        this.inertalResistance = 0.8;
        this.health = 100;
        this.temperature = 6;
    }

    step(matrix) {
        

        this.darken(0.99);
        if(!this.actAround(matrix)) {
            this.health -= 10;
            this.darken(0.9);
            super.step(matrix);
        } else {
            this.health -= 1;
        }

        if(this.health <= 0) {
            matrix.set(this.x, this.y, new Empty(this.x, this.y));
        }

    }

    actOnOther(target, matrix) {
        super.actOnOther(target, matrix);


        target.health -= this.temperature * target.flammability;

        if(target.health <= 0) {
            matrix.set(target.x, target.y, new Fire(target.x, target.y));
            if(Math.random() > 0.3) matrix.set(this.x, this.y, new Smoke(this.x, this.y));
        }

        if(target.flammability < 0) {
            matrix.set(this.x, this.y, new Empty(this.x, this.y));
        }

        return target.flammability > 0;

    }
}

class ExplosionSpark extends Gas {
    constructor(x, y) {
        super(x, y);
        this.specific = 'explosionSpark';
        this.color = { r: 255, g: 255, b: 255 };

        this.dispersionRate = 1;
        this.density = 1;
        this.flammability = 0;

        this.health = 100;
    }

    step(matrix) {
        super.step(matrix);

        this.health -= 50;
        this.darken(0.9);
        if(this.health <= 0) {
            matrix.set(this.x, this.y, new Empty(this.x, this.y));
        }
    }

}


class Wall extends ImmovableSolid {
    constructor(x, y) {
        super(x, y);
        this.specific = 'wall';
        let c = Math.random() * 50 + 100;
        this.color = { r: c + 10, g: c + 7, b: c };

        this.corrosionChance = 0.4;
        this.toughness = 10;
    }
}


class Wood extends ImmovableSolid {
    constructor(x, y) {
        super(x, y);
        this.specific = 'wood';
        this.color = { r: 100 + Math.random() * 20, g: 60 + Math.random() * 15, b: 0 + Math.random() * 15 };

        this.corrosionChance = 1;
        this.toughness = 0;
        this.flammability = 0.5;
    }
}

class FlammableGas extends Gas {
    constructor(x, y) {
        super(x, y);
        this.specific = 'flammableGas';
        this.color = { r: 38, g: 78, b: 28 };
        this.dispersionRate = 10;
        this.density = 0.1;

        this.health = 100;
        this.flammability = 5;
    }

    actOnOther(target, matrix) {
        super.actOnOther(target, matrix);

        return false;
    }
}

class Smoke extends Gas {
    constructor(x, y) {
        super(x, y);
        this.specific = 'smoke';
        let c = Math.random() * 10 + 30;
        this.color = { r: c, g: c, b: c };
        this.dispersionRate = 10;
        this.density = 0.2;

    }

    actOnOther(target, matrix) {
        super.actOnOther(target, matrix);

        return false;
    }
}

class Plant extends ImmovableSolid {
    constructor(x, y) {
        super(x, y);
        this.specific = 'plant';
        this.color = { r: 50 + Math.random() * 5, g: 120 + Math.random() * 20, b: 30 + Math.random() * 5 };
        this.growths = Math.random() > 0.1 ? 1 : 0;
        this.growthChance = 0.1;

        this.corrosionChance = 1;
        this.health = 40;
        this.toughness = 0;
        this.flammability = 0.8;
    }

    step(matrix) {
        super.step(matrix);

        let neighbors = matrix.getNeighborArray(this.x, this.y);

        for(let i = 0; i < neighbors.length; i++) {
            if(neighbors[i].specific === 'water') {
                this.growths--;
                matrix.set(neighbors[i].x, neighbors[i].y, new Empty(neighbors[i].x, neighbors[i].y));
            }
        }


        if(this.growths < 1) {

            let randomNeighbor = Math.random() > 0.1 
                ? matrix.get(this.x + Math.floor(Math.random() * 3 - 1), this.y - 1)
                : neighbors[Math.floor(Math.random() * neighbors.length)];
            
            if(randomNeighbor.specific === 'plant') {
                randomNeighbor.growths--;
                this.growths++;
                return;
            }

            if(randomNeighbor.type !== 'empty') {
                return;
            }


            matrix.set(randomNeighbor.x, randomNeighbor.y, new Plant(randomNeighbor.x, randomNeighbor.y));
            this.growths++;
        }
    }
}

