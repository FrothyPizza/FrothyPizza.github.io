import { Container } from '../core/display.js';
import { UPDATE_PRIORITY } from '../core/ticker.js';
import { TimerService } from '../core/timers.js';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../core/renderer.js';
import { defaultLevel, levelById } from '../data/levels/index.js';
import { TitleScene } from './scenes/title-scene.js';
import { LevelSelectScene } from './scenes/level-select-scene.js';
import { PlayScene } from './scenes/play-scene.js';

const LAST_LEVEL_KEY = 'ss2:lastLevel';

/**
 * Application shell: owns the services, the scene stack and the two tickers.
 *
 * The frame shape is the original's, preserved deliberately:
 *   wall-clock timers -> application ticker (systems at NORMAL, render at LOW)
 *   -> animation ticker (uncapped, never stopped by hitstop).
 */
export class Game {
	constructor({ renderer, assets, audio, input, driver, time, storage, scoreBook, random, touchControls }) {
		this.renderer = renderer;
		this.assets = assets;
		this.audio = audio;
		this.input = input;
		this.driver = driver;
		this.time = time;
		this.storage = storage;
		this.scoreBook = scoreBook;
		this.random = random;
		this.touchControls = Boolean(touchControls);
		this.screen = { width: NATIVE_WIDTH, height: NATIVE_HEIGHT };

		/** Timers that belong to the shell (hitstop), not to a level. */
		this.uiTimers = new TimerService(time);

		this.stage = new Container();
		this.stage.sortableChildren = true;
		this.scene = null;
		this.now = 0;

		const stored = storage.getItem(LAST_LEVEL_KEY);
		this.lastLevelId = stored && levelById(stored) ? stored : defaultLevel().id;

		driver.onBeforeFrame = (now) => {
			this.now = now;
			this.uiTimers.update();
			if (this.scene) this.scene.pumpTimers();
		};
		driver.app.add(() => this.tick(), UPDATE_PRIORITY.NORMAL);
		driver.app.add(() => this.render(), UPDATE_PRIORITY.LOW);
	}

	// ---------------------------------------------------------------- scenes

	setScene(scene) {
		if (this.scene) {
			this.scene.exit();
			this.stage.removeChild(this.scene.root);
		}
		this.scene = scene;
		this.stage.addChild(scene.root);
		scene.enter();
	}

	showTitle() {
		this.setScene(new TitleScene(this));
	}

	showLevelSelect() {
		this.setScene(new LevelSelectScene(this));
	}

	playLevel(levelId) {
		const level = levelById(levelId) || defaultLevel();
		this.lastLevelId = level.id;
		try {
			this.storage.setItem(LAST_LEVEL_KEY, level.id);
		} catch {
			/* storage is a convenience, never a requirement */
		}
		this.setScene(new PlayScene(this, level));
		this.audio.startMusic();
	}

	// ----------------------------------------------------------------- frame

	tick() {
		if (this.scene) this.scene.update();
		this.input.endFrame();
	}

	render() {
		this.renderer.render(this.stage, this.scene ? this.scene.clearColor : '#000000');
	}

	/**
	 * Hitstop. Stops gameplay *and* rendering for `ms` while leaving the
	 * animation ticker running — exactly what the original's `freeze()` did by
	 * stopping only `app.ticker`.
	 */
	freeze(ms) {
		this.driver.freezeApp();
		this.uiTimers.after(ms, () => this.driver.unfreezeApp(this.now));
	}
}
