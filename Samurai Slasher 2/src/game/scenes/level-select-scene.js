import { Scene } from './scene.js';
import { NATIVE_WIDTH } from '../../core/renderer.js';
import { MENU_ACTIONS } from '../../core/input.js';
import { allLevels } from '../../data/levels/index.js';
import { Menu, PALETTE, fullBleed, label, panel, paintSelection } from '../ui.js';

const ROW_HEIGHT = 26;
const FIRST_ROW_Y = 46;

/**
 * Level select. Reads the level registry, so a new level appears here the
 * moment it is registered — no wiring, no layout edits.
 */
export class LevelSelectScene extends Scene {
	constructor(game) {
		super(game);
		this.clearColor = PALETTE.backdrop;
		this.levels = allLevels();
		this.menu = new Menu(this.levels.map((level) => ({ label: level.name, level })));
		const startIndex = this.levels.findIndex((level) => level.id === game.lastLevelId);
		if (startIndex >= 0) this.menu.index = startIndex;
	}

	enter() {
		fullBleed(this.root, PALETTE.backdrop);

		label(this.root, 'SELECT ARENA', {
			x: NATIVE_WIDTH / 2,
			y: 18,
			color: PALETTE.accent,
			scale: 2,
			letterSpacing: 1,
			zIndex: 2,
		});

		this.rows = this.levels.map((level, index) => {
			const y = FIRST_ROW_Y + index * ROW_HEIGHT;
			panel(this.root, 10, y - 10, NATIVE_WIDTH - 20, 21, { zIndex: 1 });
			this.menu.registerRow(index, y - 10, 21);

			const name = label(this.root, level.name, {
				x: NATIVE_WIDTH / 2,
				y: y - 3,
				letterSpacing: 1,
				zIndex: 3,
			});
			const blurb = label(this.root, level.blurb, {
				x: NATIVE_WIDTH / 2,
				y: y + 6,
				color: PALETTE.dim,
				zIndex: 3,
			});
			const best = label(this.root, `BEST ${this.game.scoreBook.highScore(level.id)}`, {
				x: NATIVE_WIDTH - 16,
				y: y - 3,
				anchorX: 1,
				color: PALETTE.warn,
				zIndex: 3,
			});
			return { name, blurb, best };
		});

		label(this.root, 'ENTER PLAY    ESC BACK', {
			x: NATIVE_WIDTH / 2,
			y: 132,
			color: PALETTE.dim,
			letterSpacing: 1,
			zIndex: 3,
		});

		this.paint();
	}

	exit() {
		this.root.removeChildren();
	}

	paint() {
		paintSelection(
			this.rows.map((row) => row.name),
			this.menu,
		);
	}

	update() {
		const input = this.game.input;

		if (input.consume(MENU_ACTIONS.BACK)) {
			this.game.showTitle();
			return;
		}

		const chosen = this.menu.handle(input);
		this.paint();
		if (chosen) this.game.playLevel(chosen.level.id);
	}
}
