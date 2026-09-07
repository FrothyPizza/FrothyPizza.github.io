import { describe, test, assert, assertEqual, assertClose } from './framework.js';
import { FrameDriver, TARGET_FPMS, Ticker, UPDATE_PRIORITY } from '../src/core/ticker.js';
import { Ticker as PixiTicker } from './harness/pixi-stub.js';

const FRAME_MS = 1000 / 60;

/**
 * The frame pacing contract: 63fps cap, PIXI's deltaTime scaling, priority
 * ordering, and the hitstop split where gameplay stops but animation does not.
 */
describe('ticker: pacing', () => {
	test('a 60Hz frame yields deltaTime 1.0 through the 63fps cap', () => {
		const ticker = new Ticker();
		ticker.maxFPS = 63;
		ticker.start(0);

		const deltas = [];
		ticker.add((delta) => deltas.push(delta));
		for (let i = 1; i <= 10; ++i) ticker.update(i * FRAME_MS);

		assertEqual(deltas.length, 10, 'every 60Hz frame should clear the 63fps gate');
		for (const delta of deltas) assertClose(delta, 1, 1e-9, 'deltaTime at 60Hz');
	});

	test('maxFPS 63 means a 15.873ms minimum, not minFPS', () => {
		const ticker = new Ticker();
		ticker.maxFPS = 63;
		assertClose(ticker._minElapsedMS, 1000 / 63, 1e-9, 'PIXI clamps maxFPS *up* to minFPS');
	});

	test('frames arriving faster than the cap are dropped, and their time rolls over', () => {
		const ticker = new Ticker();
		ticker.maxFPS = 63;
		ticker.start(0);

		let ticks = 0;
		let lastDelta = 0;
		ticker.add((delta) => {
			++ticks;
			lastDelta = delta;
		});

		ticker.update(8); // under the 15.873ms floor -> skipped
		assertEqual(ticks, 0, 'a too-early frame must not dispatch');
		ticker.update(20);
		assertEqual(ticks, 1, 'the next frame dispatches');
		// lastTime was deliberately not advanced by the skipped frame, so the
		// elapsed time covers the whole 20ms.
		assertClose(lastDelta, 20 * TARGET_FPMS, 1e-9, 'skipped time rolls into the next delta');
	});

	test('the deltaMS clamp matches PIXI (100ms / minFPS 10)', () => {
		const ticker = new Ticker();
		ticker.start(0);
		let delta = 0;
		ticker.add((d) => {
			delta = d;
		});
		ticker.update(5000);
		assertClose(delta, 100 * TARGET_FPMS, 1e-9, 'a long stall is clamped, never replayed');
	});
});

describe('ticker: ordering', () => {
	test('higher priority runs first, ties keep insertion order', () => {
		const ticker = new Ticker();
		const order = [];
		ticker.add(() => order.push('normal-1'), UPDATE_PRIORITY.NORMAL);
		ticker.add(() => order.push('low'), UPDATE_PRIORITY.LOW);
		ticker.add(() => order.push('high'), UPDATE_PRIORITY.HIGH);
		ticker.add(() => order.push('normal-2'), UPDATE_PRIORITY.NORMAL);
		ticker.start(0);
		ticker.update(FRAME_MS);

		assertEqual(order.join(' '), 'high normal-1 normal-2 low', 'systems run before render, as PIXI ordered them');
	});

	/**
	 * `onComplete -> setAnimation` detaches a sprite and re-attaches it at the
	 * back of the HIGH group *during* the animation ticker's own dispatch. What
	 * happens next depends on where the cursor was, and it is why the ticker is
	 * a linked list rather than an array snapshot. Both cases below are asserted
	 * against the independent PIXI transcription, not against intuition.
	 */
	function reAddScenario(Klass, followers) {
		const ticker = new Klass(() => 0);
		let calls = 0;
		const self = () => {
			++calls;
			if (calls === 1) {
				ticker.remove(self);
				ticker.add(self, UPDATE_PRIORITY.HIGH);
			}
		};
		ticker.add(self, UPDATE_PRIORITY.HIGH);
		for (let i = 0; i < followers; ++i) ticker.add(() => {}, UPDATE_PRIORITY.HIGH);
		if (ticker.start.length === 0) ticker.start();
		else ticker.start(0);
		ticker.update(FRAME_MS);
		return calls;
	}

	test('a re-added listener that is still ahead of the cursor runs twice', () => {
		const shipped = reAddScenario(Ticker, 1);
		const pixi = reAddScenario(PixiTicker, 1);
		assertEqual(shipped, pixi, 'shipped ticker must agree with the PIXI transcription');
		assertEqual(shipped, 2, 'with a listener still queued behind it, the re-added listener is reached again');
	});

	test('a re-added sole listener ends the pass, exactly as PIXI does', () => {
		const shipped = reAddScenario(Ticker, 0);
		const pixi = reAddScenario(PixiTicker, 0);
		assertEqual(shipped, pixi, 'shipped ticker must agree with the PIXI transcription');
		assertEqual(shipped, 1, 'removing the last listener nulls the cursor and ends the pass');
	});

	test('shipped ticker and the PIXI transcription dispatch identically', () => {
		const build = (Klass) => {
			const ticker = new Klass(() => 0);
			const order = [];
			ticker.add(() => order.push('n1'), UPDATE_PRIORITY.NORMAL);
			ticker.add(() => order.push('l'), UPDATE_PRIORITY.LOW);
			ticker.add(() => order.push('h'), UPDATE_PRIORITY.HIGH);
			ticker.add(() => order.push('n2'), UPDATE_PRIORITY.NORMAL);
			ticker.maxFPS = 63;
			return { ticker, order };
		};
		const shipped = build(Ticker);
		const pixi = build(PixiTicker);
		shipped.ticker.start(0);
		pixi.ticker.start();

		for (let i = 1; i <= 5; ++i) {
			shipped.ticker.update(i * FRAME_MS);
			pixi.ticker.update(i * FRAME_MS);
		}
		assertEqual(shipped.order.join(' '), pixi.order.join(' '), 'dispatch order');
	});
});

describe('ticker: hitstop', () => {
	test('freezing stops gameplay and rendering but never animation', () => {
		const driver = new FrameDriver({ maxFPS: 63 });
		let gameplay = 0;
		let animation = 0;
		driver.app.add(() => ++gameplay, UPDATE_PRIORITY.NORMAL);
		driver.animation.add(() => ++animation, UPDATE_PRIORITY.HIGH);
		driver.start(0);

		for (let i = 1; i <= 5; ++i) driver.frame(i * FRAME_MS);
		assertEqual(gameplay, 5, 'gameplay ticked');
		assertEqual(animation, 5, 'animation ticked');

		driver.freezeApp();
		for (let i = 6; i <= 15; ++i) driver.frame(i * FRAME_MS);
		assertEqual(gameplay, 5, 'gameplay is frozen during hitstop');
		assertEqual(animation, 15, 'animation keeps running during hitstop — the original did this too');

		driver.unfreezeApp(15 * FRAME_MS);
		for (let i = 16; i <= 20; ++i) driver.frame(i * FRAME_MS);
		assertEqual(gameplay, 10, 'gameplay resumes');
	});

	test('unfreezing rebases the clock instead of replaying the frozen time', () => {
		const driver = new FrameDriver({ maxFPS: 63 });
		let delta = 0;
		driver.app.add((d) => {
			delta = d;
		});
		driver.start(0);
		driver.frame(FRAME_MS);

		driver.freezeApp();
		for (let i = 2; i <= 40; ++i) driver.frame(i * FRAME_MS);
		driver.unfreezeApp(40 * FRAME_MS);
		driver.frame(41 * FRAME_MS);

		assertClose(delta, 1, 1e-9, 'the first frame after hitstop is a normal frame, not a 650ms leap');
	});

	test('the driver runs timers, then gameplay, then animation', () => {
		const driver = new FrameDriver({ maxFPS: 63 });
		const order = [];
		driver.onBeforeFrame = () => order.push('timers');
		driver.app.add(() => order.push('app'), UPDATE_PRIORITY.NORMAL);
		driver.animation.add(() => order.push('anim'), UPDATE_PRIORITY.HIGH);
		driver.start(0);
		driver.frame(FRAME_MS);

		assertEqual(order.join(' '), 'timers app anim', 'browser task-queue order');
	});
});
