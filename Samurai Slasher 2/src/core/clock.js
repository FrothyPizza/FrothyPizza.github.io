/**
 * Time services.
 *
 * The original game read `performance.now()` directly from `Clock` instances
 * and from `setTimeout`. Gameplay timings therefore ran on the wall clock, and
 * the spec requires that to stay true: spawn cadence, hitstop and damage
 * delays are all wall-clock driven, not frame driven.
 *
 * `TimeSource` keeps that behaviour but funnels every read through one object
 * so the whole simulation can be (a) frozen while a menu is open and
 * (b) replaced with a fake clock in tests. When it is never paused it returns
 * exactly `performance.now()`, so live gameplay is unchanged.
 */
export class TimeSource {
	constructor(nowFn) {
		this.nowFn = nowFn;
		this._pausedAt = null;
		this._skew = 0;
	}

	/** Milliseconds since page start, minus any time spent paused. */
	now() {
		const raw = this._pausedAt !== null ? this._pausedAt : this.nowFn();
		return raw - this._skew;
	}

	get paused() {
		return this._pausedAt !== null;
	}

	pause() {
		if (this._pausedAt === null) this._pausedAt = this.nowFn();
	}

	resume() {
		if (this._pausedAt === null) return;
		this._skew += this.nowFn() - this._pausedAt;
		this._pausedAt = null;
	}
}

/**
 * Port of the original `Clock` (Samurai Slasher/js/lib/util.js) with the
 * ambient `performance.now()` replaced by an injected `TimeSource`.
 * Semantics — including the slightly odd `add()` which rewinds `startTime` —
 * are preserved exactly, because jump-hold and spawn logic depend on them.
 */
export class Stopwatch {
	constructor(time) {
		this.time = time;
		this.startTime = 0;
		this.elapsedTime = 0;
		this.pausedTime = 0;
		this.isPaused = false;
		this.isStarted = false;

		this.start();
	}

	start() {
		this.startTime = this.time.now();
		this.isStarted = true;
		this.isPaused = false;
	}

	pause() {
		if (this.isStarted && !this.isPaused) {
			this.isPaused = true;
			this.pausedTime = this.time.now();
		}
	}

	resume() {
		if (this.isStarted && this.isPaused) {
			this.isPaused = false;
			this.startTime += this.time.now() - this.pausedTime;
		}
	}

	/** Pretends `ms` more time has already elapsed. */
	add(ms) {
		this.startTime -= ms;
	}

	getElapsedTime() {
		if (this.isStarted && !this.isPaused) {
			this.elapsedTime = this.time.now() - this.startTime;
		}
		return this.elapsedTime;
	}

	restart() {
		this.startTime = this.time.now();
		this.elapsedTime = 0;
		this.isStarted = true;
		this.isPaused = false;
	}
}
