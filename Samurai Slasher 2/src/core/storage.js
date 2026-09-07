/**
 * Persistence service. Per-level high scores live under one namespaced key so
 * adding a level never needs new storage plumbing — and so the sequel never
 * touches the original game's `samhighscore` entry.
 */

const PREFIX = 'ss2:';

export class MemoryStorage {
	constructor(initial = {}) {
		this.map = new Map(Object.entries(initial));
	}

	getItem(key) {
		return this.map.has(key) ? this.map.get(key) : null;
	}

	setItem(key, value) {
		this.map.set(key, String(value));
	}
}

/** Falls back to memory when localStorage is unavailable (private mode, file://). */
export function createStorage() {
	try {
		const probe = `${PREFIX}probe`;
		window.localStorage.setItem(probe, '1');
		window.localStorage.removeItem(probe);
		return window.localStorage;
	} catch {
		return new MemoryStorage();
	}
}

export class ScoreBook {
	constructor(storage) {
		this.storage = storage;
	}

	highScore(levelId) {
		const raw = this.storage.getItem(`${PREFIX}highscore:${levelId}`);
		const value = Number(raw);
		return Number.isFinite(value) && value > 0 ? value : 0;
	}

	/** Returns true when a new record was set. */
	submit(levelId, score) {
		if (score <= this.highScore(levelId)) return false;
		this.storage.setItem(`${PREFIX}highscore:${levelId}`, score);
		return true;
	}
}
