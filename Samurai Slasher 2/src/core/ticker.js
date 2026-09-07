/**
 * Frame pacing, ported 1:1 from PIXI 6.2.2's `Ticker`
 * (Samurai Slasher/js/lib/pixi.min.js).
 *
 * This is deliberately *not* a modernised loop. The original ran two PIXI
 * tickers at once:
 *
 *   - `app.ticker` (`maxFPS = 63`) drove the ECS systems and the renderer,
 *     and was stopped outright during hitstop (`freeze()`).
 *   - `Ticker.shared` drove every `AnimatedSprite`, was never capped and was
 *     never stopped — so animations kept advancing through hitstop.
 *
 * Reproducing that split is required for exact compatibility, so both tickers
 * live here and `FrameDriver` steps them in the original registration order.
 * There is no delta-time integration anywhere in gameplay: `deltaTime` is only
 * consumed by animation, exactly as PIXI did.
 *
 * The intrusive linked list is not nostalgia either: a listener that removes
 * and re-adds itself mid-dispatch (which `AnimatedSprite.onComplete ->
 * setAnimation` does every time an attack finishes) gets visited a second time
 * in the same pass. An array snapshot would silently lose that.
 */

export const TARGET_FPMS = 0.06;

export const UPDATE_PRIORITY = {
	INTERACTION: 50,
	HIGH: 25,
	NORMAL: 0,
	LOW: -25,
	UTILITY: -50,
};

class TickerListener {
	constructor(fn, priority) {
		this.fn = fn;
		this.priority = priority;
		this.next = null;
		this.previous = null;
		this._destroyed = false;
	}

	match(fn) {
		return this.fn === fn;
	}

	emit(deltaTime) {
		if (this.fn) this.fn(deltaTime);
		const redirect = this.next;
		if (this._destroyed) this.next = null;
		return redirect;
	}

	connect(previous) {
		this.previous = previous;
		if (previous.next) previous.next.previous = this;
		this.next = previous.next;
		previous.next = this;
	}

	destroy(hard = false) {
		this._destroyed = true;
		this.fn = null;
		if (this.previous) this.previous.next = this.next;
		if (this.next) this.next.previous = this.previous;
		const redirect = this.next;
		this.next = hard ? null : redirect;
		this.previous = null;
		return redirect;
	}
}

export class Ticker {
	constructor() {
		this._head = new TickerListener(null, Infinity);
		this.started = false;
		this.speed = 1;
		this.deltaTime = 1;
		this.deltaMS = 1 / TARGET_FPMS;
		this.elapsedMS = 1 / TARGET_FPMS;
		this.lastTime = -1;
		this.minFPS = 10;
		this._maxElapsedMS = 100;
		this._minElapsedMS = 0;
		this._lastFrame = -1;
	}

	/** PIXI clamps `maxFPS` up to at least `minFPS`; 63 -> 1000/63 ms. */
	set maxFPS(fps) {
		if (fps === 0) {
			this._minElapsedMS = 0;
		} else {
			const clamped = Math.max(this.minFPS, fps);
			this._minElapsedMS = 1 / (clamped / 1000);
		}
	}

	get maxFPS() {
		return this._minElapsedMS ? Math.round(1000 / this._minElapsedMS) : 0;
	}

	/** Higher priority runs first; ties keep insertion order. */
	add(fn, priority = UPDATE_PRIORITY.NORMAL) {
		const listener = new TickerListener(fn, priority);
		let current = this._head.next;
		let previous = this._head;
		if (!current) {
			listener.connect(previous);
		} else {
			while (current) {
				if (listener.priority > current.priority) {
					listener.connect(previous);
					break;
				}
				previous = current;
				current = current.next;
			}
			if (!listener.previous) listener.connect(previous);
		}
		return this;
	}

	remove(fn) {
		let listener = this._head.next;
		while (listener) listener = listener.match(fn) ? listener.destroy() : listener.next;
		return this;
	}

	get count() {
		let n = 0;
		for (let l = this._head.next; l; l = l.next) ++n;
		return n;
	}

	/** `start()` rebases the clock, exactly like PIXI's `_requestIfNeeded`. */
	start(now) {
		if (this.started) return;
		this.started = true;
		this.lastTime = now;
		this._lastFrame = now;
	}

	stop() {
		this.started = false;
	}

	update(currentTime) {
		let elapsedMS;
		if (currentTime > this.lastTime) {
			elapsedMS = this.elapsedMS = currentTime - this.lastTime;
			if (elapsedMS > this._maxElapsedMS) elapsedMS = this._maxElapsedMS;
			elapsedMS *= this.speed;

			if (this._minElapsedMS) {
				// `| 0` truncation is PIXI's, and it is load bearing at 60Hz.
				const delta = (currentTime - this._lastFrame) | 0;
				// Note: `lastTime` is intentionally *not* updated on a skipped
				// frame, so the skipped elapsed time rolls into the next one.
				if (delta < this._minElapsedMS) return;
				this._lastFrame = currentTime - (delta % this._minElapsedMS);
			}

			this.deltaMS = elapsedMS;
			this.deltaTime = this.deltaMS * TARGET_FPMS;

			let listener = this._head.next;
			while (listener) listener = listener.emit(this.deltaTime);
		} else {
			this.deltaTime = this.deltaMS = this.elapsedMS = 0;
		}
		this.lastTime = currentTime;
	}
}

/**
 * Owns the two tickers and steps them in the order the browser did: the
 * application ticker registered its animation frame first (at construction),
 * the shared animation ticker second (when the first sprite started playing).
 */
export class FrameDriver {
	constructor({ maxFPS = 63 } = {}) {
		this.app = new Ticker();
		this.app.maxFPS = maxFPS;
		this.animation = new Ticker();
		this.onBeforeFrame = null;
	}

	start(now) {
		this.app.start(now);
		this.animation.start(now);
	}

	/**
	 * One host frame. Wall-clock timers (unaffected by hitstop) run first,
	 * then the capped application ticker, then the uncapped animation ticker.
	 */
	frame(now) {
		if (this.onBeforeFrame) this.onBeforeFrame(now);
		if (this.app.started) this.app.update(now);
		if (this.animation.started) this.animation.update(now);
	}

	/** Hitstop: stops gameplay + rendering but not animation. */
	freezeApp() {
		this.app.stop();
	}

	unfreezeApp(now) {
		this.app.start(now);
	}
}
