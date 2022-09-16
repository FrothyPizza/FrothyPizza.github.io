

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}


class Vector2 {
    constructor(x, y) {
        if(x instanceof Vector2) {
            this.x = x.x;
            this.y = x.y;
        } else {
            this.x = x || 0;
            this.y = y || 0;
        }
    }

    // getters and setters are so cool
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


    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }

    static angleBetween(vector1, vector2) {
        return Math.atan2(vector2.y - vector1.y, vector2.x - vector1.x);
    }

    static dist(vector1, vector2) {
        return Math.sqrt(Math.pow(vector2.x - vector1.x, 2) + Math.pow(vector2.y - vector1.y, 2));
    }
}



let mouse = {
    pos: new Vector2(0, 0),
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

canvas.addEventListener('mousemove', event => {
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

canvas.addEventListener('mousedown', event => {
    if(event.button == 0) {
        mouse.leftDown = true;
        mouse.onLeftClick();
    } else if(event.button == 2) {
        mouse.rightDown = true;
    }
}, true);

canvas.addEventListener('mouseup', event => {
    if(event.button == 0) {
        mouse.leftDown = false;
        mouse.onLeftRelease();
    } else if(event.button == 2) {
        mouse.rightDown = false;
    }
}, true);




let keys = [];
document.addEventListener('keydown', event => {
    keys[event.key] = true;
}, true);

document.addEventListener('keyup', event => {
    keys[event.key] = false;
    keys[event.key.toLowerCase()] = false;
}, true);


let keyPressListeners = [];
function addKeyPressListener(key, callback) {
    let listener = {
        key: key,
        func: event => {
            if(event.key == key) {
                callback();
            }
        }
    }

    document.addEventListener('keydown', listener.func);
    keyPressListeners.push(listener);
}

function removeKeyListeners(key) {
    for(let i = 0; i < keyPressListeners.length; i++) {
        if(keyPressListeners[i].key == key) {
            document.removeEventListener('keydown', keyPressListeners[i].func);
            keyPressListeners.splice(i, 1);
            i--;
        }
    }
}





document.addEventListener("visibilitychange", () => {
    if(document.hidden) {
        mouse.leftDown = false;
        mouse.rightDown = false;

        keys.forEach(key => {
            keys[key] = false;
        });
    }
});