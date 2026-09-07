import { FrameDriver } from '../../src/core/ticker.js';
import { TimeSource } from '../../src/core/clock.js';
import { InputState } from '../../src/core/input.js';
import { SilentAudio } from '../../src/core/audio.js';
import { MemoryStorage, ScoreBook } from '../../src/core/storage.js';
import { Game } from '../../src/game/game.js';
import { FRAME_MS, FakeEnvironment } from './fake-env.js';

/**
 * A headless Game.
 *
 * The scenes draw into display nodes, never into a canvas, so the whole menu
 * flow — title, level select, pause, retry — can be driven and asserted in
 * Node. The only stub is the renderer, which records what it was asked to draw
 * instead of drawing it.
 */
export function createShell({ assets, env = new FakeEnvironment({ startTime: 1000 }), random = () => 0.5, touchControls = false } = {}) {
	const renders = [];
	const renderer = {
		font: null,
		setFont() {},
		resize() {},
		toNative: (x, y) => ({ x, y }),
		render(stage, clearColor) {
			renders.push({ clearColor, children: stage.children.length });
		},
	};

	const time = new TimeSource(() => env.now());
	const driver = new FrameDriver({ maxFPS: 63 });
	const input = new InputState();
	const storage = new MemoryStorage();

	const game = new Game({
		renderer,
		assets,
		audio: new SilentAudio(),
		input,
		driver,
		time,
		storage,
		scoreBook: new ScoreBook(storage),
		random,
		touchControls,
	});

	const t0 = env.now();
	let frame = 0;
	game.now = t0;
	driver.start(t0);

	return {
		game,
		env,
		input,
		storage,
		renderer,
		renders,
		/** Runs `count` frames of the whole shell (timers, systems, render). */
		run(count = 1) {
			for (let i = 0; i < count; ++i) {
				const now = t0 + ++frame * FRAME_MS;
				env.advanceTo(now);
				driver.frame(now);
			}
		},
		/** Queues a menu action for the next frame, the way a keypress would. */
		press(action) {
			input.press(action);
		},
		/** The labels currently on screen, in draw order. */
		labels() {
			const out = [];
			const walk = (container) => {
				for (const node of container.renderList()) {
					if (node.children) walk(node);
					else if (node.text !== undefined && node.visible) out.push(node.text);
				}
			};
			walk(game.stage);
			return out;
		},
	};
}
