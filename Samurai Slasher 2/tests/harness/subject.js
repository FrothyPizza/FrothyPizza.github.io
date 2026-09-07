import { TimeSource } from '../../src/core/clock.js';
import { TimerService } from '../../src/core/timers.js';
import { FrameDriver, UPDATE_PRIORITY } from '../../src/core/ticker.js';
import { InputState } from '../../src/core/input.js';
import { SilentAudio } from '../../src/core/audio.js';
import { MemoryStorage, ScoreBook } from '../../src/core/storage.js';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../../src/core/renderer.js';
import { runSystems } from '../../src/systems/index.js';
import { createLevelWorld, makeScene } from '../../src/game/level-runtime.js';
import { classicArena } from '../../src/data/levels/classic-arena.js';
import { setPlayerWeapon } from '../../src/factories/factories.js';
import { Vec2 } from '../../src/core/vec2.js';

/**
 * The new runtime, headless, wired to the same fake clock as the oracle.
 *
 * This deliberately uses the shipped `createLevelWorld` + `runSystems` — the
 * exact code the browser runs — rather than a test-only reimplementation, so a
 * green differential run says something about the game and not about the
 * harness.
 */
export function createSubject({
	env,
	random,
	auxRandom,
	bundle,
	level = classicArena,
	startEntityId = 0,
	touchControls = false,
}) {
	const time = new TimeSource(() => env.now());
	const uiTimers = new TimerService(time);
	const driver = new FrameDriver({ maxFPS: 63 });
	const input = new InputState();
	const audio = new SilentAudio();
	const storage = new MemoryStorage();
	const scoreBook = new ScoreBook(storage);
	const screen = { width: NATIVE_WIDTH, height: NATIVE_HEIGHT };

	let world = null;
	let worldTimers = null;
	let now = env.now();
	let restarts = 0;

	function build(startId) {
		worldTimers = new TimerService(time);
		world = createLevelWorld(
			{
				scene: makeScene(),
				animationTicker: driver.animation,
				time,
				timers: worldTimers,
				random,
				auxRandom,
				audio,
				storage,
				assets: bundle,
				screen,
				scoreBook,
				input,
				touchControls,
				startEntityId: startId,
			},
			level,
		);

		world.hooks = {
			freeze: (ms) => {
				driver.freezeApp();
				uiTimers.after(ms, () => driver.unfreezeApp(now));
			},
			restart: () => {
				++restarts;
				// The oracle's `restart()` keeps counting ids up; match it so
				// entity ids stay comparable across a death.
				const nextId = world.nextId;
				world.destroy();
				worldTimers.clearAll();
				build(nextId);
			},
			onRunEnded: (score) => scoreBook.submit(level.id, score),
			onScoreChanged: () => {},
		};
	}

	build(startEntityId);

	driver.onBeforeFrame = (frameNow) => {
		now = frameNow;
		uiTimers.update();
		worldTimers.update();
	};
	driver.app.add(() => runSystems(world), UPDATE_PRIORITY.NORMAL);
	driver.start(env.now());

	return {
		get world() {
			return world;
		},
		get scene() {
			return world.scene;
		},
		get restarts() {
			return restarts;
		},
		get pendingTimers() {
			return worldTimers.pending + uiTimers.pending;
		},
		driver,
		input,
		storage,
		scoreBook,
		time,

		/** Registers a render-time observer where the real renderer sits. */
		onRender(fn) {
			driver.app.add(fn, UPDATE_PRIORITY.LOW);
		},

		/** Timers first, then tickers — same shape as the oracle's frame. */
		tick(frameNow) {
			driver.frame(frameNow);
		},

		setInputs({ leftDown = false, rightDown = false, jumpDown = false, attackDown = false }) {
			input.leftDown = leftDown;
			input.rightDown = rightDown;
			input.jumpDown = jumpDown;
			input.attackDown = attackDown;
		},

		/** Mirrors of the oracle's scripted mutations — see oracle.js. */
		setWeapon(name) {
			setPlayerWeapon(world, world.player, name);
		},

		teleportPlayer(x, y) {
			world.player.position.vec = new Vec2(x, y);
		},

		setPlayerState({ x, y, vx, vy }) {
			const player = world.player;
			if (x !== undefined) player.position.x = x;
			if (y !== undefined) player.position.y = y;
			if (vx !== undefined) player.velocity.x = vx;
			if (vy !== undefined) player.velocity.y = vy;
		},

		moveCrateTo(x, y) {
			world.find('collectable').position.vec = new Vec2(x, y);
		},
	};
}
