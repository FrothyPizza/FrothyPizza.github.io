import { AnimationPlayer } from './animated-sprite.js';
import { UPDATE_PRIORITY } from './ticker.js';

/**
 * Minimal retained scene graph with PIXI-compatible semantics for the subset
 * the game uses: `x`/`y`, `anchor`, `scale`, `zIndex`, `tint`, `visible`, and
 * a `sortableChildren` container.
 *
 * It holds *no* canvas state — nodes are plain data. That is what lets the
 * whole simulation, including render ordering and sprite placement, run and be
 * asserted in Node without a DOM.
 */

export const NO_TINT = 0xffffff;

export class DisplayNode {
	constructor() {
		this.x = 0;
		this.y = 0;
		this.scaleX = 1;
		this.scaleY = 1;
		this.anchorX = 0;
		this.anchorY = 0;
		this.zIndex = 0;
		this.visible = true;
		this.alpha = 1;
		this.tint = NO_TINT;
		this.parent = null;
	}

	get width() {
		return 0;
	}

	get height() {
		return 0;
	}
}

export class SpriteNode extends DisplayNode {
	constructor(texture) {
		super();
		this.texture = texture;
	}

	get width() {
		return Math.abs(this.scaleX) * this.texture.width;
	}

	get height() {
		return Math.abs(this.scaleY) * this.texture.height;
	}
}

export class AnimatedSpriteNode extends DisplayNode {
	/**
	 * @param {Texture[]} textures
	 * @param {Ticker} animationTicker the never-stopped, uncapped ticker
	 */
	constructor(textures, animationTicker) {
		super();
		this.player = new AnimationPlayer(textures, animationTicker, UPDATE_PRIORITY.HIGH);
	}

	get texture() {
		return this.player.texture;
	}

	get width() {
		return Math.abs(this.scaleX) * this.texture.width;
	}

	get height() {
		return Math.abs(this.scaleY) * this.texture.height;
	}

	get animationSpeed() {
		return this.player.animationSpeed;
	}

	set animationSpeed(value) {
		this.player.animationSpeed = value;
	}

	get loop() {
		return this.player.loop;
	}

	set loop(value) {
		this.player.loop = value;
	}

	get onComplete() {
		return this.player.onComplete;
	}

	set onComplete(fn) {
		this.player.onComplete = fn;
	}

	get onFrameChange() {
		return this.player.onFrameChange;
	}

	set onFrameChange(fn) {
		this.player.onFrameChange = fn;
	}

	get currentFrame() {
		return this.player.currentFrame;
	}

	play() {
		this.player.play();
	}

	stop() {
		this.player.stop();
	}

	setTextures(textures) {
		this.player.setTextures(textures);
	}
}

/** Bitmap text. There is no DOM/browser-font text anywhere in this game. */
export class TextNode extends DisplayNode {
	constructor(text, { color = '#ffffff', anchorX = 0.5, anchorY = 0.5, letterSpacing = 0, scale = 1 } = {}) {
		super();
		this.text = String(text);
		this.color = color;
		this.anchorX = anchorX;
		this.anchorY = anchorY;
		this.letterSpacing = letterSpacing;
		/** Integer glyph magnification — keeps every glyph pixel square. */
		this.scale = scale;
	}
}

/** A solid rectangle, used for menu panels and letterbox-safe HUD plates. */
export class RectNode extends DisplayNode {
	constructor(width, height, color) {
		super();
		this.rectWidth = width;
		this.rectHeight = height;
		this.color = color;
	}

	get width() {
		return this.rectWidth;
	}

	get height() {
		return this.rectHeight;
	}
}

export class Container extends DisplayNode {
	constructor() {
		super();
		this.children = [];
		this.sortableChildren = false;
		this.sortDirty = false;
	}

	addChild(child) {
		if (child.parent) child.parent.removeChild(child);
		child.parent = this;
		this.sortDirty = true;
		this.children.push(child);
		return child;
	}

	removeChild(child) {
		const index = this.children.indexOf(child);
		if (index === -1) return null;
		this.children.splice(index, 1);
		child.parent = null;
		return child;
	}

	removeChildren() {
		for (const child of this.children) child.parent = null;
		this.children.length = 0;
	}

	/**
	 * PIXI sorts by `zIndex` with ties broken by the child's current index,
	 * i.e. a stable sort over the existing array. `Array.prototype.sort` has
	 * been stable since ES2019, so this is the same ordering.
	 */
	sortChildren() {
		if (!this.sortableChildren) return this.children;
		let required = false;
		for (const child of this.children) {
			if (child.zIndex !== 0) {
				required = true;
				break;
			}
		}
		if (required && this.children.length > 1) {
			this.children.sort((a, b) => a.zIndex - b.zIndex);
		}
		this.sortDirty = false;
		return this.children;
	}

	/** Draw order: back to front. */
	renderList() {
		this.sortChildren();
		return this.children;
	}
}
