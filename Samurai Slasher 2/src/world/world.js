import { Entity } from './entity.js';
import { Container } from '../core/display.js';

/**
 * The World owns everything a running level needs, explicitly:
 *
 *   entities, the display container they draw into, the timer service their
 *   callbacks are scheduled on, the RNG they draw from, the audio sink, the
 *   score book, the level definition, and the screen metrics.
 *
 * Nothing here reaches for a global. That is the single biggest structural
 * change from the original — where `ECS`, `gameScene`, `app`, `Globals`,
 * `sounds`, `WEAPONS` and `localStorage` were all ambient — and it is what
 * makes a second level, a paused menu and a headless test run possible.
 */
export class World {
	constructor({
		scene,
		animationTicker,
		time,
		timers,
		random,
		auxRandom,
		audio,
		storage,
		assets,
		level,
		screen,
		weapons,
		enemies,
	}) {
		this.scene = scene || new Container();
		this.animationTicker = animationTicker;
		this.time = time;
		this.timers = timers;
		this.random = random;
		// A second, independent stream. Anything that draws randomness *outside*
		// the original's code paths (the boss system) must use this one, or the
		// seeded parity tests would diverge on the classic arena.
		this.auxRandom = auxRandom || (() => Math.random());
		this.audio = audio;
		this.storage = storage;
		this.assets = assets;
		this.level = level;
		this.screen = screen;
		this.weapons = weapons;
		this.enemies = enemies;

		this.entities = new Map();
		this.nextId = 0;

		/** Set when the run has ended; blocks double restarts. */
		this.runOver = false;
		/** Hooks the host scene installs (hitstop, restart, score changes). */
		this.hooks = {
			freeze: () => {},
			onRunEnded: () => {},
			onScoreChanged: () => {},
		};
	}

	/** Lets a test align entity ids with an oracle run. */
	seedEntityIds(next) {
		this.nextId = next;
	}

	create() {
		return new Entity(this.nextId++);
	}

	register(entity) {
		this.entities.set(entity.id, entity);
		return entity;
	}

	get(id) {
		return this.entities.get(id);
	}

	removeEntity(id) {
		const entity = this.entities.get(id);
		if (!entity) return;
		entity.destroy();
		this.entities.delete(id);
	}

	/**
	 * Iterates entities that have every named component.
	 *
	 * The key list is snapshotted up front and entities deleted mid-iteration
	 * are skipped — precisely the `for...in` semantics the original systems
	 * were written against. Entities *created* mid-iteration are not visited
	 * until the next pass, which is also what `for...in` did.
	 */
	*each(...names) {
		const ids = Array.from(this.entities.keys());
		for (let i = 0; i < ids.length; ++i) {
			const entity = this.entities.get(ids[i]);
			if (entity === undefined) continue;
			if (names.length && !entity.has(...names)) continue;
			yield entity;
		}
	}

	find(...names) {
		for (const entity of this.each(...names)) return entity;
		return undefined;
	}

	get player() {
		return this.find('playerController');
	}

	/** Tears the level down: entities, display list and every pending timer. */
	destroy() {
		for (const id of Array.from(this.entities.keys())) this.removeEntity(id);
		this.entities.clear();
		this.scene.removeChildren();
		this.timers.clearAll();
	}
}
