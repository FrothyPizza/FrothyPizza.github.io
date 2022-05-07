class Vec2 {
    constructor(x, y) {
        if(x instanceof Vec2) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x || 0;
            this.y = y || 0;
        }
    }

	equals(other) {
		return other.x == this.x && other.y == this.y;
	}

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    set length(length) {
        let angle = this.angle;
        this.x = Math.cos(angle) * length;
        this.y = Math.sin(angle) * length;
    }

    get angle() {
        return Math.atan2(this.y, this.x);
    }

    set angle(angle) {
        let length = this.length;
        this.x = Math.cos(angle) * length;
        this.y = Math.sin(angle) * length;
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
    }

    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
    }

    multiply(vector) {
        this.x *= vector.x;
        this.y *= vector.y;
    }

    scalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
    }

    normalize() {
        let length = this.length;
        this.x /= length;
        this.y /= length;
    }

	copy() {
		return new Vec2(this);
	}
	// in case I forget which one I named it
	clone() {
		return new Vec2(this);
	}
	

    static fromAngle(angle) {
        return new Vec2(Math.cos(angle), Math.sin(angle));
    }

	static add(vec1, vec2) {
		let n = vec1.copy();
		n.add(vec2);
		return n;
	}

    static angleBetween(vector1, vector2) {
        return Math.atan2(vector2.y - vector1.y, vector2.x - vector1.x);
    }

    static dist(vector1, vector2) {
        return Math.sqrt(Math.pow(vector2.x - vector1.x, 2) + Math.pow(vector2.y - vector1.y, 2));
    }
}

class ScreenShaker {
	constructor(canv) {
		this.canvas = canv;
		this.direction = new Vec2(0, 0);
		this.offset = new Vec2(0, 0);
		this.speed = 0.1;
		this.damping = 0.9;
		this.magnitude = 0;
		console.log(this.direction);
	}

	update() {
		this.direction.normalize();
		this.offset = this.direction.copy();
		this.damping *= 0.8;
		this.offset.scalar(this.damping * this.magnitude * Math.sin(performance.now() * this.speed));
		this.canvas.style["object-position"] = this.offset.x + "px " + this.offset.y + "px";
	}

	pulse(vec) {
		this.damping = 0.9;
		this.magnitude = vec.length;
		this.direction = vec.copy();
		this.direction.multiply(new Vec2(Math.random() * 0.2, Math.random() * 0.2));
	}
}

let mouse = {
    pos: new Vec2(0, 0),
    leftDown: false,
    rightDown: false,
    onLeftClick: () => {},
    onLeftRelease: () => {},
    relativeContainer: null,
    isInContainer: false,
    get x() { return this.pos.x; },
    get y() { return this.pos.y },
    set x(x) { this.pos.x = x; },
    set y(y) { this.pos.y = y; },
};

document.addEventListener('mousemove', event => {
    if(mouse.relativeContainer) {
        let boundingRect = mouse.relativeContainer.getBoundingClientRect();
        mouse.x = event.clientX - boundingRect.left;
        mouse.y = event.clientY - boundingRect.top;

        mouse.isInContainer = mouse.x >= 0 && mouse.x <= mouse.relativeContainer.width &&
                              mouse.y >= 0 && mouse.y <= mouse.relativeContainer.height;
    } else {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    }
});

document.addEventListener('mousedown', event => {
    if(event.button == 0) {
        mouse.leftDown = true;
        mouse.onLeftClick();
    } else if(event.button == 2) {
        mouse.rightDown = true;
    }
});

document.addEventListener('mouseup', event => {
    if(event.button == 0) {
        mouse.leftDown = false;
        mouse.onLeftRelease();
    } else if(event.button == 2) {
        mouse.rightDown = false;
    }
});







document.addEventListener("visibilitychange", () => {
    if(document.hidden) {
        mouse.leftDown = false;
        mouse.rightDown = false;

        keys.forEach(key => {
            keys[key] = false;
        });
    }
});




class Clock {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.pausedTime = 0;
        this.isPaused = false;
        this.isStarted = false;

		this.start();
    }

    start() {
        this.startTime = performance.now();
        this.isStarted = true;
        this.isPaused = false;
    }

    pause() {
        if (this.isStarted && !this.isPaused) {
            this.isPaused = true;
            this.pausedTime = performance.now();
        }
    }

    resume() {
        if (this.isStarted && this.isPaused) {
            this.isPaused = false;
            this.startTime += (performance.now() - this.pausedTime);
        }
    }

	add(ms) {
		this.startTime -= ms;
	}

    getElapsedTime() {
        if (this.isStarted && !this.isPaused) {
            this.elapsedTime = performance.now() - this.startTime;
        }
        return this.elapsedTime;
    }

    restart() {
        this.startTime = performance.now();
        this.elapsedTime = 0;
        this.isStarted = true;
        this.isPaused = false;
    }
}