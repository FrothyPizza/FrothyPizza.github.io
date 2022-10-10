function bresenham(x0, y0, x1, y1) {
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;
 
    let points = [];
    while(true) {
        points.push({ x: x0, y: y0 });
 
        if ((x0 === x1) && (y0 === y1)) return points;
        var e2 = 2*err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
}

function mod(x, y) {
    if(x < 0) {
        return x + y;
    } else {
        return x % y;
    }
}

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