/**
 * Deterministic environment for headless runs.
 *
 * Provides a fake wall clock, a `setTimeout`/`clearTimeout` pair driven by it,
 * and a fixed 60Hz frame schedule. Both sides of the differential harness —
 * the original source running in a VM and the new runtime — are driven by the
 * *same* instance, so "same frame" means the same millisecond on both sides.
 *
 * 60Hz is not arbitrary: at 1000/60 ms per frame PIXI's `deltaTime` works out
 * to exactly 1.0 (16.666… * 0.06), which is what the original saw on a normal
 * display, and it clears the `maxFPS = 63` gate (a 15.873ms minimum) every
 * frame.
 */
export const FRAME_MS = 1000 / 60;

export class FakeEnvironment {
	constructor({ startTime = 1000 } = {}) {
		this.time = startTime;
		this.timers = new Map();
		this.nextTimerId = 1;
		this.frameIndex = 0;
	}

	now() {
		return this.time;
	}

	setTimeout(fn, ms) {
		const id = this.nextTimerId++;
		this.timers.set(id, { id, due: this.time + (Number(ms) || 0), fn });
		return id;
	}

	clearTimeout(id) {
		this.timers.delete(id);
	}

	clearAllTimers() {
		this.timers.clear();
	}

	get pendingTimers() {
		return this.timers.size;
	}

	/**
	 * Advances the clock and fires everything that came due, oldest deadline
	 * first and, for ties, in scheduling order. Callbacks scheduled by a
	 * callback wait for the next drain, matching the browser task queue.
	 */
	advanceTo(time) {
		this.time = time;
		const due = [];
		for (const timer of this.timers.values()) {
			if (timer.due <= this.time) due.push(timer);
		}
		if (due.length === 0) return;
		due.sort((a, b) => (a.due === b.due ? a.id - b.id : a.due - b.due));
		for (const timer of due) {
			if (!this.timers.has(timer.id)) continue;
			this.timers.delete(timer.id);
			timer.fn();
		}
	}

	/** Timestamp of frame `index` on the fixed schedule. */
	frameTime(index) {
		return this.startTimeOfFrames + index * FRAME_MS;
	}

	get startTimeOfFrames() {
		if (this._frameOrigin === undefined) this._frameOrigin = this.time;
		return this._frameOrigin;
	}

	/** Timestamp for the next frame, without advancing anything. */
	nextFrameTime() {
		return this.startTimeOfFrames + (this.frameIndex + 1) * FRAME_MS;
	}
}
