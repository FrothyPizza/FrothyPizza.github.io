import { AnimatedSpriteNode, Container, NO_TINT, RectNode, SpriteNode, TextNode } from './display.js';

export const NATIVE_WIDTH = 176;
export const NATIVE_HEIGHT = 144;

/**
 * Canvas2D renderer for the 176x144 native buffer.
 *
 * Contract:
 *   - Everything visible — gameplay, HUD, menus, text, touch buttons — is
 *     drawn into a 176x144 backing buffer. Nothing is layered in the DOM.
 *   - The buffer is blitted to the display canvas at an *integer* scale with
 *     nearest-neighbour filtering and integer letterbox offsets, so a source
 *     pixel is always an exact square block of device pixels.
 *   - Sprite placement uses whatever coordinates the simulation produced;
 *     rounding is only ever applied where the original applied it (the physics
 *     system rounds sprite x/y; bitmap glyphs floor, as Echoes did).
 */
export class Renderer {
	constructor(canvas, { letterboxColor = '#000000', backgroundColor = '#b2b2b2' } = {}) {
		this.canvas = canvas;
		this.letterboxColor = letterboxColor;
		this.backgroundColor = backgroundColor;

		this.buffer = document.createElement('canvas');
		this.buffer.width = NATIVE_WIDTH;
		this.buffer.height = NATIVE_HEIGHT;
		this.bufferCtx = this.buffer.getContext('2d', { alpha: false });
		this.bufferCtx.imageSmoothingEnabled = false;

		this.ctx = canvas.getContext('2d', { alpha: false });
		this.ctx.imageSmoothingEnabled = false;

		this.font = null;
		this._tintCache = new Map();
		this.viewport = { scale: 1, offsetX: 0, offsetY: 0, width: NATIVE_WIDTH, height: NATIVE_HEIGHT };
	}

	setFont(font) {
		this.font = font;
	}

	/** Recomputes the integer upscale + letterbox for the current window. */
	resize() {
		const dpr = window.devicePixelRatio || 1;
		const cssWidth = Math.max(1, Math.floor(window.innerWidth));
		const cssHeight = Math.max(1, Math.floor(window.innerHeight));
		const deviceWidth = Math.max(1, Math.floor(cssWidth * dpr));
		const deviceHeight = Math.max(1, Math.floor(cssHeight * dpr));

		if (this.canvas.width !== deviceWidth || this.canvas.height !== deviceHeight) {
			this.canvas.width = deviceWidth;
			this.canvas.height = deviceHeight;
			this.ctx.imageSmoothingEnabled = false;
		}
		this.canvas.style.width = `${cssWidth}px`;
		this.canvas.style.height = `${cssHeight}px`;

		this.viewport = computeViewport(deviceWidth, deviceHeight);
	}

	/** Device-pixel point -> native buffer point (for touch/pointer input). */
	toNative(clientX, clientY) {
		const rect = this.canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		const deviceX = (clientX - rect.left) * dpr;
		const deviceY = (clientY - rect.top) * dpr;
		const { scale, offsetX, offsetY } = this.viewport;
		return {
			x: (deviceX - offsetX) / scale,
			y: (deviceY - offsetY) / scale,
		};
	}

	render(stage, clearColor) {
		const ctx = this.bufferCtx;
		ctx.globalAlpha = 1;
		ctx.fillStyle = clearColor || this.backgroundColor;
		ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);
		this._drawContainer(ctx, stage);
		this.present();
	}

	present() {
		const { scale, offsetX, offsetY } = this.viewport;
		const ctx = this.ctx;
		ctx.imageSmoothingEnabled = false;
		ctx.fillStyle = this.letterboxColor;
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.drawImage(
			this.buffer,
			0,
			0,
			NATIVE_WIDTH,
			NATIVE_HEIGHT,
			offsetX,
			offsetY,
			NATIVE_WIDTH * scale,
			NATIVE_HEIGHT * scale,
		);
	}

	_drawContainer(ctx, container) {
		if (!container.visible) return;
		for (const node of container.renderList()) {
			this._drawNode(ctx, node);
		}
	}

	_drawNode(ctx, node) {
		if (!node.visible || node.alpha <= 0) return;
		if (node instanceof Container) {
			this._drawContainer(ctx, node);
			return;
		}
		if (node instanceof RectNode) {
			ctx.globalAlpha = node.alpha;
			ctx.fillStyle = node.color;
			ctx.fillRect(
				Math.round(node.x - node.anchorX * node.rectWidth),
				Math.round(node.y - node.anchorY * node.rectHeight),
				node.rectWidth,
				node.rectHeight,
			);
			ctx.globalAlpha = 1;
			return;
		}
		if (node instanceof TextNode) {
			this._drawText(ctx, node);
			return;
		}
		if (node instanceof SpriteNode || node instanceof AnimatedSpriteNode) {
			this._drawSprite(ctx, node);
		}
	}

	_drawSprite(ctx, node) {
		const texture = node.texture;
		if (!texture || !texture.image) return;
		const w = texture.frame.w;
		const h = texture.frame.h;
		const source = node.tint === NO_TINT ? texture.image : this._tinted(texture, node.tint);
		const sx = node.tint === NO_TINT ? texture.frame.x : 0;
		const sy = node.tint === NO_TINT ? texture.frame.y : 0;

		ctx.globalAlpha = node.alpha;
		ctx.save();
		ctx.translate(node.x, node.y);
		if (node.scaleX !== 1 || node.scaleY !== 1) ctx.scale(node.scaleX, node.scaleY);
		ctx.drawImage(source, sx, sy, w, h, -node.anchorX * w, -node.anchorY * h, w, h);
		ctx.restore();
		ctx.globalAlpha = 1;
	}

	/** PIXI's `tint` is a multiply; reproduce it on an offscreen, cached. */
	_tinted(texture, tint) {
		const key = `${texture.key}:${tint}`;
		const cached = this._tintCache.get(key);
		if (cached) return cached;

		const w = texture.frame.w;
		const h = texture.frame.h;
		const off = document.createElement('canvas');
		off.width = w;
		off.height = h;
		const c = off.getContext('2d');
		c.imageSmoothingEnabled = false;
		c.drawImage(texture.image, texture.frame.x, texture.frame.y, w, h, 0, 0, w, h);
		c.globalCompositeOperation = 'multiply';
		c.fillStyle = hexColor(tint);
		c.fillRect(0, 0, w, h);
		// Restore the original alpha mask that `multiply` flattened.
		c.globalCompositeOperation = 'destination-in';
		c.drawImage(texture.image, texture.frame.x, texture.frame.y, w, h, 0, 0, w, h);
		c.globalCompositeOperation = 'source-over';

		this._tintCache.set(key, off);
		return off;
	}

	_drawText(ctx, node) {
		const font = this.font;
		if (!font || !font.image) return;
		const scale = node.scale || 1;
		const advance = (font.charWidth + node.letterSpacing) * scale;
		const width = font.measure(node.text, node.letterSpacing) * scale;
		// Anchor on an integer boundary so glyph pixels stay square.
		let cursor = Math.round(node.x - node.anchorX * width);
		const y = Math.round(node.y - node.anchorY * font.charHeight * scale);

		const source = node.color === '#ffffff' ? font.image : this._tintedFont(font, node.color);
		ctx.globalAlpha = node.alpha;
		for (const char of node.text) {
			const glyph = font.glyph(char);
			ctx.drawImage(
				source,
				glyph.x,
				glyph.y,
				glyph.width,
				glyph.height,
				Math.floor(cursor),
				Math.floor(y),
				glyph.width * scale,
				glyph.height * scale,
			);
			cursor += advance;
		}
		ctx.globalAlpha = 1;
	}

	_tintedFont(font, color) {
		const key = `font:${color}`;
		const cached = this._tintCache.get(key);
		if (cached) return cached;
		const off = document.createElement('canvas');
		off.width = font.image.width;
		off.height = font.image.height;
		const c = off.getContext('2d');
		c.imageSmoothingEnabled = false;
		c.drawImage(font.image, 0, 0);
		c.globalCompositeOperation = 'source-in';
		c.fillStyle = color;
		c.fillRect(0, 0, off.width, off.height);
		c.globalCompositeOperation = 'source-over';
		this._tintCache.set(key, off);
		return off;
	}
}

/** Pure, so the scaling rule is unit-testable without a DOM. */
export function computeViewport(deviceWidth, deviceHeight) {
	const scale = Math.max(1, Math.floor(Math.min(deviceWidth / NATIVE_WIDTH, deviceHeight / NATIVE_HEIGHT)));
	const width = NATIVE_WIDTH * scale;
	const height = NATIVE_HEIGHT * scale;
	return {
		scale,
		width,
		height,
		offsetX: Math.floor((deviceWidth - width) / 2),
		offsetY: Math.floor((deviceHeight - height) / 2),
	};
}

export function hexColor(value) {
	return `#${value.toString(16).padStart(6, '0')}`;
}
