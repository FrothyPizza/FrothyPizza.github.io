import { Texture } from '../../src/core/textures.js';

/**
 * A minimal PIXI 6.2.2 for the VM oracle.
 *
 * The original game cannot run in Node — `pixi.min.js` needs a canvas and a
 * WebGL context. This module supplies just enough of PIXI for the *unmodified*
 * original sources to execute, and the parts that affect observable behaviour
 * are transcribed straight from the bundled `js/lib/pixi.min.js` rather than
 * re-derived. The minified originals are quoted next to each so the
 * transcription can be audited.
 *
 * It is intentionally written independently of `src/core/*`, so that
 * `tests/animation-parity.test.js` — which cross-checks the shipped
 * `AnimationPlayer` and `Ticker` against these — has real signal instead of
 * comparing a module to itself.
 *
 * Only `Texture` is shared, because a texture is inert data and sharing it
 * lets the differential snapshot compare render output by texture identity.
 */

export const TARGET_FPMS = 0.06;

export const UPDATE_PRIORITY = {
	INTERACTION: 50,
	HIGH: 25,
	NORMAL: 0,
	LOW: -25,
	UTILITY: -50,
};

// ---------------------------------------------------------------- Ticker

// From pixi.min.js: TickerListener.emit/connect/destroy. The linked list (not
// an array) is what lets a listener remove and re-add itself mid-dispatch and
// be visited again in the same pass.
class TickerListener {
	constructor(fn, priority) {
		this.fn = fn;
		this.priority = priority;
		this.next = null;
		this.previous = null;
		this._destroyed = false;
	}

	match(fn) {
		return this.fn === fn;
	}

	emit(deltaTime) {
		if (this.fn) this.fn(deltaTime);
		const redirect = this.next;
		if (this._destroyed) this.next = null;
		return redirect;
	}

	connect(previous) {
		this.previous = previous;
		if (previous.next) previous.next.previous = this;
		this.next = previous.next;
		previous.next = this;
	}

	destroy(hard = false) {
		this._destroyed = true;
		this.fn = null;
		if (this.previous) this.previous.next = this.next;
		if (this.next) this.next.previous = this.previous;
		const redirect = this.next;
		this.next = hard ? null : redirect;
		this.previous = null;
		return redirect;
	}
}

export class Ticker {
	constructor(now = () => 0) {
		this._head = new TickerListener(null, Infinity);
		this._now = now;
		this.autoStart = false;
		this.started = false;
		this.speed = 1;
		this.deltaTime = 1;
		this.deltaMS = 1 / TARGET_FPMS;
		this.elapsedMS = 1 / TARGET_FPMS;
		this.lastTime = -1;
		this.minFPS = 10;
		this._maxElapsedMS = 100;
		this._minElapsedMS = 0;
		this._lastFrame = -1;
		// Stands in for PIXI's pending requestAnimationFrame handle. It gates
		// the clock rebase in `_requestIfNeeded`, so it is not cosmetic: without
		// it, every `AnimatedSprite.play()` would rebase the shared ticker and
		// silently skip that frame's animation dispatch.
		this._requestId = null;
	}

	// set:function(t){if(0===t)this._minElapsedMS=0;else{var e=Math.max(this.minFPS,t);this._minElapsedMS=1/(e/1e3)}}
	set maxFPS(fps) {
		if (fps === 0) this._minElapsedMS = 0;
		else this._minElapsedMS = 1 / (Math.max(this.minFPS, fps) / 1000);
	}

	get maxFPS() {
		return this._minElapsedMS ? Math.round(1000 / this._minElapsedMS) : 0;
	}

	// _addListener: insert before the first strictly-lower priority; ties keep
	// insertion order.
	add(fn, priority = UPDATE_PRIORITY.NORMAL) {
		const listener = new TickerListener(fn, priority);
		let current = this._head.next;
		let previous = this._head;
		if (!current) {
			listener.connect(previous);
		} else {
			while (current) {
				if (listener.priority > current.priority) {
					listener.connect(previous);
					break;
				}
				previous = current;
				current = current.next;
			}
			if (!listener.previous) listener.connect(previous);
		}
		this._startIfPossible();
		return this;
	}

	remove(fn) {
		let listener = this._head.next;
		while (listener) listener = listener.match(fn) ? listener.destroy() : listener.next;
		if (!this._head.next) this._cancelIfNeeded();
		return this;
	}

	get count() {
		let n = 0;
		for (let l = this._head.next; l; l = l.next) ++n;
		return n;
	}

	_startIfPossible() {
		if (this.started) this._requestIfNeeded();
		else if (this.autoStart) this.start();
	}

	// _requestIfNeeded rebases lastTime/_lastFrame to "now" only when the
	// ticker actually (re)acquires an animation frame — which is how a hitstop
	// stop/start avoids producing one giant delta, while a mid-run
	// add/remove leaves the clock alone.
	_requestIfNeeded() {
		if (this._requestId === null && this._head.next) {
			this.lastTime = this._now();
			this._lastFrame = this.lastTime;
			this._requestId = 1;
		}
	}

	_cancelIfNeeded() {
		if (this._requestId !== null) this._requestId = null;
	}

	start() {
		if (this.started) return;
		this.started = true;
		this._requestIfNeeded();
	}

	stop() {
		if (!this.started) return;
		this.started = false;
		this._cancelIfNeeded();
	}

	update(currentTime) {
		let elapsedMS;
		if (currentTime > this.lastTime) {
			elapsedMS = this.elapsedMS = currentTime - this.lastTime;
			if (elapsedMS > this._maxElapsedMS) elapsedMS = this._maxElapsedMS;
			elapsedMS *= this.speed;
			if (this._minElapsedMS) {
				const delta = (currentTime - this._lastFrame) | 0;
				if (delta < this._minElapsedMS) return; // lastTime deliberately not updated
				this._lastFrame = currentTime - (delta % this._minElapsedMS);
			}
			this.deltaMS = elapsedMS;
			this.deltaTime = this.deltaMS * TARGET_FPMS;
			let listener = this._head.next;
			while (listener) listener = listener.emit(this.deltaTime);
			if (!this._head.next) this._cancelIfNeeded();
		} else {
			this.deltaTime = this.deltaMS = this.elapsedMS = 0;
		}
		this.lastTime = currentTime;
	}
}

// --------------------------------------------------------------- Display

class DisplayObject {
	constructor() {
		this.x = 0;
		this.y = 0;
		this.scale = { x: 1, y: 1 };
		this.anchor = { x: 0, y: 0 };
		this._zIndex = 0;
		this.visible = true;
		this.alpha = 1;
		this.tint = 0xffffff;
		this.parent = null;
		this._lastSortedIndex = 0;
	}

	get zIndex() {
		return this._zIndex;
	}

	set zIndex(value) {
		this._zIndex = value;
		if (this.parent) this.parent.sortDirty = true;
	}
}

export class Container extends DisplayObject {
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

	// sortChildren: stamp _lastSortedIndex, then sort by (zIndex,
	// _lastSortedIndex) — i.e. a stable sort over the current array.
	sortChildren() {
		let required = false;
		for (let i = 0; i < this.children.length; ++i) {
			this.children[i]._lastSortedIndex = i;
			if (!required && this.children[i].zIndex !== 0) required = true;
		}
		if (required && this.children.length > 1) {
			this.children.sort((a, b) =>
				a.zIndex === b.zIndex ? a._lastSortedIndex - b._lastSortedIndex : a.zIndex - b.zIndex,
			);
		}
		this.sortDirty = false;
		return this.children;
	}

	/** What a render pass would draw, back to front. */
	renderList() {
		if (this.sortableChildren && this.sortDirty) this.sortChildren();
		return this.children;
	}
}

export class Sprite extends DisplayObject {
	constructor(texture) {
		super();
		this.texture = texture;
	}

	get width() {
		return Math.abs(this.scale.x) * this.texture.width;
	}

	get height() {
		return Math.abs(this.scale.y) * this.texture.height;
	}
}

/**
 * AnimatedSprite, transcribed from pixi.min.js.
 *
 *   update: r.prototype.update=function(t){if(this._playing){var e=this.animationSpeed*t,
 *     r=this.currentFrame; if(null!==this._durations){...} else this._currentTime+=e;
 *     this._currentTime<0&&!this.loop?(this.gotoAndStop(0),this.onComplete&&this.onComplete()):
 *     this._currentTime>=this._textures.length&&!this.loop?(this.gotoAndStop(this._textures.length-1),
 *     this.onComplete&&this.onComplete()):r!==this.currentFrame&&(...,this.updateTexture())}}
 *
 * `_durations` is null for spritesheet-sourced textures, so the per-frame
 * `duration` fields in the JSON are dead data — animation advances purely on
 * `animationSpeed * deltaTime`.
 */
export class AnimatedSprite extends Sprite {
	constructor(textures, autoUpdate = true) {
		super(textures[0] instanceof Texture ? textures[0] : textures[0].texture);
		this._textures = null;
		this._durations = null;
		this._autoUpdate = autoUpdate;
		this._isConnectedToTicker = false;
		this.animationSpeed = 1;
		this.loop = true;
		this.updateAnchor = false;
		this.onComplete = null;
		this.onFrameChange = null;
		this.onLoop = null;
		this._currentTime = 0;
		this._playing = false;
		this._previousFrame = null;
		this._update = (deltaTime) => this.update(deltaTime);
		this.textures = textures;
	}

	get textures() {
		return this._textures;
	}

	set textures(value) {
		if (value[0] instanceof Texture) {
			this._textures = value;
			this._durations = null;
		} else {
			this._textures = [];
			this._durations = [];
			for (let i = 0; i < value.length; i++) {
				this._textures.push(value[i].texture);
				this._durations.push(value[i].time);
			}
		}
		this._previousFrame = null;
		this.gotoAndStop(0);
		this.updateTexture();
	}

	get currentFrame() {
		let frame = Math.floor(this._currentTime) % this._textures.length;
		if (frame < 0) frame += this._textures.length;
		return frame;
	}

	get playing() {
		return this._playing;
	}

	play() {
		if (this._playing) return;
		this._playing = true;
		if (this._autoUpdate && !this._isConnectedToTicker) {
			AnimatedSprite.sharedTicker.add(this._update, UPDATE_PRIORITY.HIGH);
			this._isConnectedToTicker = true;
		}
	}

	stop() {
		if (!this._playing) return;
		this._playing = false;
		if (this._autoUpdate && this._isConnectedToTicker) {
			AnimatedSprite.sharedTicker.remove(this._update);
			this._isConnectedToTicker = false;
		}
	}

	gotoAndStop(frameNumber) {
		this.stop();
		const previousFrame = this.currentFrame;
		this._currentTime = frameNumber;
		if (previousFrame !== this.currentFrame) this.updateTexture();
	}

	gotoAndPlay(frameNumber) {
		const previousFrame = this.currentFrame;
		this._currentTime = frameNumber;
		if (previousFrame !== this.currentFrame) this.updateTexture();
		this.play();
	}

	updateTexture() {
		const currentFrame = this.currentFrame;
		if (this._previousFrame === currentFrame) return;
		this._previousFrame = currentFrame;
		this.texture = this._textures[currentFrame];
		if (this.onFrameChange) this.onFrameChange(this.currentFrame);
	}

	update(deltaTime) {
		if (!this._playing) return;
		const elapsed = this.animationSpeed * deltaTime;
		const previousFrame = this.currentFrame;

		this._currentTime += elapsed;

		if (this._currentTime < 0 && !this.loop) {
			this.gotoAndStop(0);
			if (this.onComplete) this.onComplete();
		} else if (this._currentTime >= this._textures.length && !this.loop) {
			this.gotoAndStop(this._textures.length - 1);
			if (this.onComplete) this.onComplete();
		} else if (previousFrame !== this.currentFrame) {
			if (this.loop && this.onLoop) {
				if (this.animationSpeed > 0 && this.currentFrame < previousFrame) this.onLoop();
				else if (this.animationSpeed < 0 && this.currentFrame > previousFrame) this.onLoop();
			}
			this.updateTexture();
		}
	}
}

export class Text extends DisplayObject {
	constructor(text, style) {
		super();
		this.text = text;
		this.style = style;
	}
}

// ------------------------------------------------------------ Application

class Loader {
	constructor(resources) {
		this.resources = {};
		this._available = resources;
		this._queued = [];
	}

	add(name, url) {
		this._queued.push({ name, url });
		return this;
	}

	load(callback) {
		for (const entry of this._queued) {
			const resource = this._available[entry.name];
			if (!resource) throw new Error(`oracle loader: no headless resource for "${entry.name}"`);
			this.resources[entry.name] = resource;
		}
		this._queued.length = 0;
		if (callback) callback();
		return this;
	}
}

/**
 * Builds a `PIXI` namespace object for a VM context.
 *
 * `sharedTicker` is the ticker every AnimatedSprite attaches to — separate
 * from the application ticker, uncapped, and never stopped by hitstop. That
 * split is the original's, and reproducing it is required for animation
 * timing to match.
 */
export function createPixi({ now, resources }) {
	const sharedTicker = new Ticker(now);
	sharedTicker.autoStart = true;
	AnimatedSprite.sharedTicker = sharedTicker;

	class Application {
		constructor(options = {}) {
			this.view = options.view || {};
			this.stage = new Container();
			this.ticker = new Ticker(now);
			this.ticker.start();
			this.loader = new Loader(resources);
			this.renderer = {
				width: options.width || 800,
				height: options.height || 600,
				backgroundColor: 0x000000,
			};
		}
	}

	return {
		Application,
		Container,
		Sprite,
		AnimatedSprite,
		Text,
		Texture,
		Ticker,
		UPDATE_PRIORITY,
		SCALE_MODES: { NEAREST: 0, LINEAR: 1 },
		settings: { SCALE_MODE: 0, TARGET_FPMS },
		__sharedTicker: sharedTicker,
	};
}
