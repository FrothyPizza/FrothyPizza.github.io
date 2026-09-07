/**
 * 2D vector, behaviourally identical to the original game's `Vec2`
 * (Samurai Slasher/js/lib/util.js). Only the operations the game actually uses
 * are kept; every one of them keeps the original's exact arithmetic so that
 * floating point results are bit-identical.
 */
export class Vec2 {
	constructor(x, y) {
		if (x instanceof Vec2) {
			this.x = x.x;
			this.y = x.y;
		} else {
			this.x = x || 0;
			this.y = y || 0;
		}
	}

	get length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	add(vector) {
		this.x += vector.x;
		this.y += vector.y;
	}

	multiply(vector) {
		this.x *= vector.x;
		this.y *= vector.y;
	}

	normalize() {
		const length = this.length;
		this.x /= length;
		this.y /= length;
	}

	copy() {
		return new Vec2(this);
	}

	static add(a, b) {
		const n = a.copy();
		n.add(b);
		return n;
	}

	static dist(a, b) {
		return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
	}
}

/**
 * The original accepted either `(Vec2)` or `(x, y)` or nothing for its vector
 * backed components. Kept verbatim so component construction matches.
 */
export function vec2From(param1, param2) {
	if (param1 instanceof Vec2) return param1.copy();
	if (!isNaN(param1) && !isNaN(param2)) return new Vec2(param1, param2);
	return new Vec2(0, 0);
}
