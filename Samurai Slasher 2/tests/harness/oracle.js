import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createPixi, UPDATE_PRIORITY } from './pixi-stub.js';
import { buildLoaderResources } from './node-assets.js';

/**
 * Runs the ORIGINAL, UNMODIFIED Samurai Slasher sources as a test oracle.
 *
 * The files are read straight out of `../Samurai Slasher/js` and evaluated in
 * a `vm` context with a fake DOM, a fake wall clock, a seeded `Math.random`
 * and the PIXI stub. Nothing is patched or rewritten — if the sequel disagrees
 * with this, the sequel is wrong.
 *
 * The original is read-only: this module never writes to that directory.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
export const ORIGINAL_ROOT = path.resolve(here, '../../../Samurai Slasher');

// Load order from the original `index.html` (pixi + util in <head>, then body).
const SOURCE_FILES = [
	'js/lib/util.js',
	'js/globals.js',
	'script.js',
	'js/load.js',
	'js/highscores.js',
	'js/Entity.js',
	'js/Components.js',
	'js/Blueprints.js',
	'js/Systems/helpers.js',
	'js/Systems/input.js',
	'js/Systems/physics.js',
	'js/Systems/mapCollisions.js',
	'js/Systems/enemySpawner.js',
	'js/Systems/enemyBehavior.js',
	'js/Systems/animation.js',
	'js/Systems/damageCollisions.js',
	'js/Systems/crateCollisions.js',
];

function makeElementStub(id) {
	return {
		id,
		width: 176,
		height: 144,
		style: {},
		addEventListener() {},
		removeEventListener() {},
		remove() {},
		appendChild() {},
		getBoundingClientRect: () => ({ left: 0, top: 0, width: 176, height: 144 }),
	};
}

/**
 * @param {object} options
 * @param {FakeEnvironment} options.env shared fake clock + timer queue
 * @param {() => number} options.random seeded generator
 * @param {AssetBundle} options.bundle headless assets (shared with the subject)
 */
export function createOracle({ env, random, bundle }) {
	const canvas = makeElementStub('canvas');
	const listeners = new Map();

	const documentStub = {
		hidden: false,
		body: { style: {}, appendChild() {}, removeChild() {} },
		getElementById: (id) => (id === 'canvas' ? canvas : null),
		createElement: () => makeElementStub('created'),
		addEventListener(type, fn) {
			if (!listeners.has(type)) listeners.set(type, []);
			listeners.get(type).push(fn);
		},
		removeEventListener(type, fn) {
			const list = listeners.get(type);
			if (list) list.splice(list.indexOf(fn), 1);
		},
		querySelector: () => makeElementStub('query'),
	};

	const storage = new Map([['samhighscore', '0']]);
	const localStorageStub = {
		getItem: (key) => (storage.has(key) ? storage.get(key) : null),
		setItem: (key, value) => storage.set(key, String(value)),
		removeItem: (key) => storage.delete(key),
	};

	class AudioStub {
		constructor() {
			this.volume = 1;
			this.loop = false;
		}
		play() {}
		pause() {}
	}

	const pixi = createPixi({ now: () => env.now(), resources: buildLoaderResources(bundle) });

	const context = {
		PIXI: pixi,
		document: documentStub,
		navigator: { userAgent: 'node-oracle', vendor: '' },
		localStorage: localStorageStub,
		Audio: AudioStub,
		performance: { now: () => env.now() },
		setTimeout: (fn, ms) => env.setTimeout(fn, ms),
		clearTimeout: (id) => env.clearTimeout(id),
		setInterval: () => 0,
		clearInterval: () => {},
		requestAnimationFrame: () => 0,
		cancelAnimationFrame: () => {},
		fetch: () => Promise.reject(new Error('network disabled in oracle')),
		console: { log() {}, warn() {}, error() {}, info() {} },
		// script.js relies on the browser exposing elements by id as globals.
		harder: makeElementStub('harder'),
		__seededRandom: random,
		// `window` is the global object, so window-level listeners land here.
		addEventListener(type, fn) {
			if (!listeners.has(type)) listeners.set(type, []);
			listeners.get(type).push(fn);
		},
		removeEventListener(type, fn) {
			const list = listeners.get(type);
			if (list) list.splice(list.indexOf(fn), 1);
		},
	};
	context.window = context;
	context.self = context;
	context.globalThis = context;

	vm.createContext(context);
	// Seed randomness *before* any game code runs so every draw is reproducible.
	vm.runInContext('Math.random = __seededRandom;', context, { filename: 'seed-random.js' });

	for (const relative of SOURCE_FILES) {
		const file = path.join(ORIGINAL_ROOT, relative);
		vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: relative });
	}

	// `window.onload` would have fired here in a browser.
	vm.runInContext('loadSprites(main);', context, { filename: 'boot.js' });

	/**
	 * The original declares `app`, `gameScene`, `ECS`, `Inputs` and friends with
	 * `const`/`let`. Those live in the context's global *lexical* scope and
	 * never become properties of the global object, so they have to be reached
	 * by evaluating an expression rather than by reading `context.x`.
	 */
	const evaluate = (expression, filename = 'eval.js') =>
		vm.runInContext(expression, context, { filename });

	const app = evaluate('app');
	const ecs = evaluate('ECS');
	const inputs = evaluate('Inputs');
	const gameScene = evaluate('gameScene');
	const sharedTicker = pixi.__sharedTicker;

	/**
	 * Discards the title-screen's pending callbacks and rebuilds the arena, so
	 * the comparison starts from the same state the sequel's play scene builds.
	 * Returns the entity id the arena will start from.
	 */
	function startArena() {
		env.clearAllTimers();
		const startId = ecs.idIndex;
		vm.runInContext('restart();', context, { filename: 'start-arena.js' });
		return startId;
	}

	/** Registers a render-time observer at PIXI's own render priority. */
	function onRender(fn) {
		app.ticker.add(fn, UPDATE_PRIORITY.LOW);
	}

	/**
	 * The ticker half of a host frame: the capped application ticker, then the
	 * uncapped shared animation ticker. Callers advance the clock (which fires
	 * this side's `setTimeout` queue) first, so that both runtimes see timers
	 * before tickers, exactly as a browser task queue would deliver them.
	 */
	function tick(now) {
		if (app.ticker.started) app.ticker.update(now);
		if (sharedTicker.started) sharedTicker.update(now);
	}

	/** Convenience for standalone use: advance the clock, then tick. */
	function frame(now) {
		env.advanceTo(now);
		tick(now);
	}

	/**
	 * Scripted mutations, applied identically on both runtimes so scenarios can
	 * reach states that are otherwise gated behind seeded randomness (which
	 * weapon dropped, where the crate landed).
	 */
	function setWeapon(name) {
		vm.runInContext(
			`(() => {
				const player = Object.values(ECS.entities).find(e => e.has("playerController"));
				ECS.Helpers.setPlayerWeapon(ECS.entities, player, ${JSON.stringify(name)});
			})();`,
			context,
			{ filename: 'set-weapon.js' },
		);
	}

	function teleportPlayer(x, y) {
		vm.runInContext(
			`(() => {
				const player = Object.values(ECS.entities).find(e => e.has("playerController"));
				player.position.vec = new Vec2(${x}, ${y});
			})();`,
			context,
			{ filename: 'teleport-player.js' },
		);
	}

	/**
	 * Forces the player into an exact position/velocity. Needed to reach
	 * collision states that ordinary play cannot produce — resting contact with
	 * `velocity.y === 0`, or a hitbox already several pixels inside a wall —
	 * which is where the grounding inequality and the collision margin are
	 * actually decided.
	 */
	function setPlayerState({ x, y, vx, vy }) {
		vm.runInContext(
			`(() => {
				const player = Object.values(ECS.entities).find(e => e.has("playerController"));
				if (${x !== undefined}) player.position.x = ${x};
				if (${y !== undefined}) player.position.y = ${y};
				if (${vx !== undefined}) player.velocity.x = ${vx};
				if (${vy !== undefined}) player.velocity.y = ${vy};
			})();`,
			context,
			{ filename: 'set-player-state.js' },
		);
	}

	function moveCrateTo(x, y) {
		vm.runInContext(
			`(() => {
				const crate = Object.values(ECS.entities).find(e => e.has("collectable"));
				crate.position.vec = new Vec2(${x}, ${y});
			})();`,
			context,
			{ filename: 'move-crate.js' },
		);
	}

	function setInputs({ leftDown = false, rightDown = false, jumpDown = false, attackDown = false }) {
		inputs.leftDown = leftDown;
		inputs.rightDown = rightDown;
		inputs.jumpDown = jumpDown;
		inputs.attackDown = attackDown;
	}

	return {
		context,
		app,
		sharedTicker,
		get entities() {
			return ecs.entities;
		},
		get scene() {
			return gameScene;
		},
		get storage() {
			return storage;
		},
		startArena,
		onRender,
		tick,
		frame,
		setInputs,
		setWeapon,
		teleportPlayer,
		setPlayerState,
		moveCrateTo,
	};
}
