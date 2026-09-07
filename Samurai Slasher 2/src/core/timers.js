import { TimeSource } from './clock.js';

/**
 * Owned replacement for bare `setTimeout`.
 *
 * The original scattered `setTimeout` calls across systems and blueprints.
 * They fired on the wall clock (so they kept running through hitstop), which
 * the spec requires us to preserve — but they also kept firing after a
 * restart, mutating entities that no longer existed and, in the worst case,
 * scheduling a *second* `restart()` after the player had already respawned.
 *
 * This service keeps the wall-clock semantics and adds ownership: every timer
 * belongs to a scope, and disposing the scope cancels them. That is a pure
 * lifecycle fix — while a run is live, callbacks fire at exactly the same
 * times as before.
 */
export class TimerService {
	/** @param {TimeSource} time */
	constructor(time) {
		this.time = time;
		this._timers = new Map();
		this._nextId = 1;
	}

	/** Schedules `fn` to run once, `ms` from now. Returns a cancel handle. */
	after(ms, fn) {
		const id = this._nextId++;
		this._timers.set(id, { id, due: this.time.now() + ms, fn });
		return id;
	}

	clear(handle) {
		this._timers.delete(handle);
	}

	/** Cancels everything. Called on world teardown / level change. */
	clearAll() {
		this._timers.clear();
	}

	get pending() {
		return this._timers.size;
	}

	/**
	 * Fires everything that is due, oldest deadline first and, for equal
	 * deadlines, in scheduling order — the ordering browsers guarantee.
	 * Callbacks scheduled *by* a callback do not run until the next update,
	 * matching the browser task queue.
	 */
	update() {
		if (this._timers.size === 0) return;
		const now = this.time.now();
		const due = [];
		for (const timer of this._timers.values()) {
			if (timer.due <= now) due.push(timer);
		}
		if (due.length === 0) return;
		due.sort((a, b) => (a.due === b.due ? a.id - b.id : a.due - b.due));
		for (const timer of due) {
			// A callback may have cancelled a later one in the same batch.
			if (!this._timers.has(timer.id)) continue;
			this._timers.delete(timer.id);
			timer.fn();
		}
	}
}
