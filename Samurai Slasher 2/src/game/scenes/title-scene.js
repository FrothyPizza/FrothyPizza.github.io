import { Scene } from './scene.js';
import { AnimatedSpriteNode, SpriteNode } from '../../core/display.js';
import { NATIVE_WIDTH } from '../../core/renderer.js';
import { MENU_ACTIONS } from '../../core/input.js';
import { Menu, PALETTE, fullBleed, label, layoutMenu, paintSelection } from '../ui.js';

/**
 * Layout constants for the title card. The art is 172x128 with the logo on
 * rows 38-93, leaving a clear band above and below once it is placed at y=4.
 */
const ART_TOP = 4;
const IDLER_X = 24;
const IDLER_Y = 114;

/**
 * Title screen.
 *
 * The original's title art with the original's idling samurai standing on it,
 * plus a three-item menu — all inside the 176x144 buffer. The idlers run on
 * the shared animation ticker like every other animated sprite, so the menu
 * exercises the real renderer rather than a parallel one.
 */
export class TitleScene extends Scene {
	constructor(game) {
		super(game);
		this.clearColor = PALETTE.backdrop;
		this.menu = new Menu([
			{ label: 'PLAY', action: 'play' },
			{ label: 'LEVELS', action: 'levels' },
			{ label: 'CONTROLS', action: 'controls' },
		]);
		this.showingControls = false;
		this.idlers = [];
	}

	enter() {
		const assets = this.game.assets;
		fullBleed(this.root, PALETTE.backdrop);

		// The title card is 172x128 of framed art: a cyan border, a black
		// interior, and the logo occupying rows 38-93. Everything else is
		// placed into the two empty bands above and below it, so nothing ever
		// sits on top of the lettering.
		const art = new SpriteNode(assets.texture('titleScreen'));
		art.x = Math.round((NATIVE_WIDTH - art.texture.width) / 2);
		art.y = ART_TOP;
		art.zIndex = 1;
		this.root.addChild(art);
		this.art = art;

		// The sequel mark, in the upper band.
		this.mark = label(this.root, 'II', {
			x: NATIVE_WIDTH / 2,
			y: ART_TOP + 19,
			color: PALETTE.warn,
			scale: 3,
			letterSpacing: 1,
			zIndex: 4,
		});

		// The samurai idles in the lower band, sword out, at the same carry
		// offset the play scene uses.
		this.sword = this.spawnIdler(assets, 'sword', IDLER_X + 3, IDLER_Y - 8, 2);
		this.samurai = this.spawnIdler(assets, 'playerSheet', IDLER_X + 3, IDLER_Y, 3);
		this.samurai.anchorX = 0.5;

		this.menuNodes = layoutMenu(this.root, this.menu, { y: 104, lineHeight: 10, zIndex: 4 });
		this.hint = label(this.root, 'ARROWS + ENTER', {
			x: NATIVE_WIDTH / 2,
			y: 138,
			color: PALETTE.dim,
			letterSpacing: 1,
			zIndex: 4,
		});

		this.controlsPanel = null;
		paintSelection(this.menuNodes, this.menu);
	}

	spawnIdler(assets, sheetKey, x, y, zIndex) {
		const sheet = assets.sheet(sheetKey);
		const node = new AnimatedSpriteNode(sheet.animations[sheet.firstAnimationName], this.game.driver.animation);
		node.animationSpeed = 0.1;
		node.x = x;
		node.y = y;
		node.zIndex = zIndex;
		node.play();
		this.root.addChild(node);
		this.idlers.push(node);
		return node;
	}

	exit() {
		// Detach the idlers from the shared animation ticker. Leaving sprites
		// attached forever was the original's leak.
		for (const node of this.idlers) node.stop();
		this.idlers.length = 0;
		this.root.removeChildren();
	}

	update() {
		const input = this.game.input;

		if (this.showingControls) {
			if (
				input.consume(MENU_ACTIONS.CONFIRM) ||
				input.consume(MENU_ACTIONS.BACK) ||
				input.consume(MENU_ACTIONS.PAUSE)
			) {
				this.hideControls();
			}
			input.pointer = null;
			return;
		}

		const chosen = this.menu.handle(input);
		paintSelection(this.menuNodes, this.menu);
		if (!chosen) return;

		if (chosen.action === 'play') this.game.playLevel(this.game.lastLevelId);
		else if (chosen.action === 'levels') this.game.showLevelSelect();
		else if (chosen.action === 'controls') this.showControls();
	}

	showControls() {
		this.showingControls = true;
		const lines = [
			'MOVE      ARROWS',
			'JUMP      Z OR D',
			'ATTACK    X OR F',
			'PAUSE     ESC',
			'',
			'GRAB CRATES TO SCORE',
			'AND SWAP WEAPONS',
		];
		this.controlsPanel = [
			label(this.root, 'CONTROLS', {
				x: NATIVE_WIDTH / 2,
				y: 24,
				color: PALETTE.accent,
				scale: 2,
				letterSpacing: 1,
				zIndex: 20,
			}),
		];
		lines.forEach((line, index) => {
			this.controlsPanel.push(
				label(this.root, line, {
					x: NATIVE_WIDTH / 2,
					y: 48 + index * 11,
					color: index >= 5 ? PALETTE.warn : PALETTE.ink,
					letterSpacing: 1,
					zIndex: 20,
				}),
			);
		});
		this.controlsPanel.push(
			label(this.root, 'ANY KEY TO GO BACK', {
				x: NATIVE_WIDTH / 2,
				y: 134,
				color: PALETTE.dim,
				letterSpacing: 1,
				zIndex: 20,
			}),
		);
		this.setMainVisible(false);
	}

	hideControls() {
		this.showingControls = false;
		for (const node of this.controlsPanel || []) this.root.removeChild(node);
		this.controlsPanel = null;
		this.setMainVisible(true);
	}

	/** The controls page replaces the title card rather than covering it. */
	setMainVisible(visible) {
		for (const node of this.menuNodes) node.visible = visible;
		this.hint.visible = visible;
		this.mark.visible = visible;
		this.art.visible = visible;
		for (const node of this.idlers) node.visible = visible;
	}
}
