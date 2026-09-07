/**
 * Texture / spritesheet model.
 *
 * Mirrors what PIXI 6 actually produced from these asset files, because sprite
 * offsets in the original are computed from `sprite.width` / `sprite.height`,
 * i.e. from frame 0 of whichever animation the sheet happened to list first.
 *
 * Two JSON dialects ship in `assets/images`: Aseprite (array `frames`) and
 * Piskel (object `frames`). Both carry a hand-written top-level `animations`
 * map, which is the only thing PIXI 6's `Spritesheet` reads — it ignores
 * `meta.frameTags` entirely. Getting this wrong silently changes which frame
 * a sprite is "centred" on, so it is reproduced exactly.
 */

export class Texture {
	constructor(key, image, frame) {
		this.key = key;
		this.image = image;
		this.frame = frame; // { x, y, w, h } in source-image pixels
	}

	get width() {
		return this.frame.w;
	}

	get height() {
		return this.frame.h;
	}
}

export class SpriteSheet {
	constructor(key, image, data) {
		this.key = key;
		this.image = image;
		this.data = data;
		this.textures = {};
		this.animations = {};
		this.frameKeys = [];

		this._processFrames();
		this._processAnimations();
	}

	_processFrames() {
		const frames = this.data.frames;
		if (Array.isArray(frames)) {
			// Aseprite array export: frames are addressed by ordinal.
			frames.forEach((entry, index) => {
				const key = String(index);
				this.frameKeys.push(key);
				this.textures[key] = new Texture(`${this.key}#${key}`, this.image, {
					x: entry.frame.x,
					y: entry.frame.y,
					w: entry.frame.w,
					h: entry.frame.h,
				});
			});
			return;
		}
		for (const key of Object.keys(frames)) {
			const entry = frames[key];
			this.frameKeys.push(key);
			this.textures[key] = new Texture(`${this.key}#${key}`, this.image, {
				x: entry.frame.x,
				y: entry.frame.y,
				w: entry.frame.w,
				h: entry.frame.h,
			});
		}
	}

	_processAnimations() {
		const animations = this.data.animations || {};
		for (const name of Object.keys(animations)) {
			this.animations[name] = animations[name].map((frameKey) => {
				const texture = this.textures[frameKey];
				if (!texture) throw new Error(`${this.key}: animation "${name}" references missing frame ${frameKey}`);
				return texture;
			});
		}
	}

	/** The animation PIXI's `Object.entries(sheet.animations)[0]` would pick. */
	get firstAnimationName() {
		return Object.keys(this.animations)[0];
	}
}

/**
 * Aseprite JSON exported with an array `frames` block indexes animations by
 * ordinal string; Piskel exports already use string keys. Both are handled
 * above, so callers only need this helper to validate an asset at load time.
 */
export function assertSheetUsable(sheet) {
	if (!sheet.firstAnimationName) {
		throw new Error(`${sheet.key}: no top-level "animations" block — PIXI would have thrown here too`);
	}
	return sheet;
}
