

class Vectory {
    constructor(x = 0, y = 0) {
        this.vec = {x: x, y: y};
    }
    get x() { return this.vec.x; }
    set x(value) { this.vec.x = value; }
    get y() { return this.vec.y; }
    set y(value) { this.vec.y = value; }

}

ECS.Components.Position = class Position extends Vectory {
    constructor(x = 0, y = 0) {
        super(x, y);
        this.lastPos = {x: x, y: y};
    }
}

ECS.Components.Velocity = class Velocity extends Vectory {
    constructor(x = 0, y = 0) {
        super(x, y);
    }
}

ECS.Components.Gravity = class Gravity {
    static defaultGravity = 0.1;
    
    constructor(gravity = Gravity.defaultGravity) {
        this.gravity = {x: 0, y: gravity};
    }
}

