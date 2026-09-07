import { Scene } from './scene.js';
import { Container } from '../../core/display.js';
import { NATIVE_WIDTH } from '../../core/renderer.js';
import { MENU_ACTIONS } from '../../core/input.js';
import { TimerService } from '../../core/timers.js';
import { runSystems } from '../../systems/index.js';
import { createLevelWorld, makeScene } from '../level-runtime.js';
import { Menu, PALETTE, label, panel, paintSelection, rect } from '../ui.js';

const PLAY_CLEAR_COLOR = '#b2b2b2';

/**
 * The playable scene.
 *
 * Gameplay itself is untouched: `runSystems(world)` runs the original pipeline
 * on the original schedule. Everything this scene adds — pause, retry, the
 * touch pause button — sits strictly outside that call, and pausing works by
 * halting the *clock* rather than by skipping frames, so nothing inside the
 * simulation can tell that time stopped.
 */
export class PlayScene extends Scene {
	constructor(game, level) {
		super(game);
		this.level = level;
		this.clearColor = PLAY_CLEAR_COLOR;

		this.worldLayer = new Container();
		this.worldLayer.sortableChildren = true;
		this.worldLayer.zIndex = 0;
		this.root.addChild(this.worldLayer);

		this.overlay = new Container();
		this.overlay.sortableChildren = true;
		this.overlay.zIndex = 20000;
		this.overlay.visible = false;
		this.root.addChild(this.overlay);

		this.timers = new TimerService(game.time);
		this.world = null;
		this.paused = false;

		this.menu = new Menu([
			{ label: 'RESUME', action: 'resume' },
			{ label: 'RETRY', action: 'retry' },
			{ label: 'LEVELS', action: 'levels' },
			{ label: 'TITLE', action: 'title' },
		]);
	}

	enter() {
		this.buildOverlay();
		this.buildWorld();
	}

	exit() {
		this.teardownWorld();
		this.timers.clearAll();
		this.root.removeChildren();
	}

	// ---------------------------------------------------------------- world

	buildWorld() {
		const game = this.game;
		const scene = makeScene();
		this.worldLayer.addChild(scene);

		this.world = createLevelWorld(
			{
				scene,
				animationTicker: game.driver.animation,
				time: game.time,
				timers: this.timers,
				random: game.random,
				auxRandom: game.random,
				audio: game.audio,
				storage: game.storage,
				assets: game.assets,
				screen: game.screen,
				scoreBook: game.scoreBook,
				input: game.input,
				touchControls: game.touchControls,
			},
			this.level,
		);

		this.world.hooks = {
			freeze: (ms) => this.game.freeze(ms),
			restart: () => this.restart(),
			onRunEnded: (score) => this.game.scoreBook.submit(this.level.id, score),
			onScoreChanged: () => {},
		};
	}

	teardownWorld() {
		if (!this.world) return;
		const scene = this.world.scene;
		this.world.destroy();
		this.worldLayer.removeChild(scene);
		this.world = null;
	}

	/** The original's death -> respawn cycle, minus the stale timers. */
	restart() {
		this.teardownWorld();
		this.timers.clearAll();
		this.buildWorld();
	}

	// ---------------------------------------------------------------- frame

	pumpTimers() {
		this.timers.update();
	}

	update() {
		const input = this.game.input;

		if (this.paused) {
			this.updatePauseMenu(input);
			return;
		}

		if (input.consume(MENU_ACTIONS.PAUSE) || this.tappedPauseButton(input)) {
			this.pause();
			return;
		}
		input.pointer = null;

		runSystems(this.world);
	}

	tappedPauseButton(input) {
		if (!this.game.touchControls || !input.pointer) return false;
		const point = input.pointer;
		return point.x >= NATIVE_WIDTH - 20 && point.x <= NATIVE_WIDTH && point.y >= 0 && point.y <= 16;
	}

	// ---------------------------------------------------------------- pause

	pause() {
		if (this.paused) return;
		this.paused = true;
		this.overlay.visible = true;
		this.menu.index = 0;
		paintSelection(this.pauseNodes, this.menu);
		// Freezing the clock freezes every gameplay stopwatch and every
		// pending wall-clock callback together, so nothing catches up in a
		// burst when play resumes.
		this.game.time.pause();
		this.game.driver.animation.stop();
		this.game.input.clearHeld();
		this.game.input.pointer = null;
	}

	resume() {
		if (!this.paused) return;
		this.paused = false;
		this.overlay.visible = false;
		this.game.time.resume();
		this.game.driver.animation.start(this.game.now);
		this.game.input.pointer = null;
	}

	updatePauseMenu(input) {
		if (input.consume(MENU_ACTIONS.BACK)) {
			this.resume();
			return;
		}
		const chosen = this.menu.handle(input);
		paintSelection(this.pauseNodes, this.menu);
		if (!chosen) return;

		if (chosen.action === 'resume') {
			this.resume();
		} else if (chosen.action === 'retry') {
			this.resume();
			this.restart();
		} else if (chosen.action === 'levels') {
			this.resume();
			this.game.showLevelSelect();
		} else if (chosen.action === 'title') {
			this.resume();
			this.game.showTitle();
		}
	}

	buildOverlay() {
		rect(this.overlay, 0, 0, NATIVE_WIDTH, 144, '#000000', { alpha: 0.65, zIndex: 0 });
		panel(this.overlay, 28, 28, 120, 88, { zIndex: 1 });

		label(this.overlay, 'PAUSED', {
			x: NATIVE_WIDTH / 2,
			y: 42,
			color: PALETTE.accent,
			scale: 2,
			letterSpacing: 1,
			zIndex: 3,
		});
		label(this.overlay, this.level.name, {
			x: NATIVE_WIDTH / 2,
			y: 58,
			color: PALETTE.dim,
			zIndex: 3,
		});

		this.pauseNodes = this.menu.items.map((item, index) => {
			const y = 72 + index * 11;
			this.menu.registerRow(index, y - 5, 11);
			return label(this.overlay, item.label, {
				x: NATIVE_WIDTH / 2,
				y,
				letterSpacing: 1,
				zIndex: 3,
			});
		});

		if (this.game.touchControls) {
			label(this.root, 'II', {
				x: NATIVE_WIDTH - 10,
				y: 8,
				color: PALETTE.ink,
				letterSpacing: 1,
				zIndex: 15000,
			});
		}

		paintSelection(this.pauseNodes, this.menu);
	}
}
