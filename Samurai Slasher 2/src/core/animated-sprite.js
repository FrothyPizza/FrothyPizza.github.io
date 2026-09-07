/**
 * Frame-timing port of PIXI 6.2.2's `AnimatedSprite`.
 *
 * Every attack window, weapon recovery and enemy wing-flap in the original is
 * timed by this algorithm, so it is transcribed rather than re-invented:
 *
 *   - `_currentTime` advances by `animationSpeed * deltaTime` (the sheets carry
 *     per-frame durations, but PIXI only honours those when textures are given
 *     as `{texture, time}` pairs — a `Spritesheet` hands it bare textures, so
 *     `_durations` is null and the JSON `duration` fields are dead data).
 *   - `currentFrame` is `floor(_currentTime) % length`.
 *   - A non-looping animation that runs off the end snaps to the last frame,
 *     *stops* (detaching from the ticker) and fires `onComplete`.
 *   - Assigning `textures` resets to frame 0 and fires `onFrameChange(0)`.
 *
 * `play()` / `stop()` attach and detach from the shared animation ticker, which
 * is why re-setting an animation moves a sprite to the back of the update order.
 */
export class AnimationPlayer {
	/**
	 * @param {Texture[]} textures
	 * @param {{add:Function, remove:Function}} ticker shared animation ticker
	 * @param {number} priority ticker priority (PIXI used UPDATE_PRIORITY.HIGH)
	 */
	constructor(textures, ticker, priority) {
		this._textures = null;
		this._durations = null;
		this._ticker = ticker;
		this._priority = priority;
		this._isConnectedToTicker = false;

		this.animationSpeed = 1;
		this.loop = true;
		this.onComplete = null;
		this.onFrameChange = null;
		this.onLoop = null;

		this._currentTime = 0;
		this._playing = false;
		this._previousFrame = null;

		this._update = (deltaTime) => this.update(deltaTime);

		this.texture = textures[0];
		this.setTextures(textures);
	}

	get textures() {
		return this._textures;
	}

	setTextures(textures) {
		this._textures = textures;
		this._durations = null;
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
		if (!this._isConnectedToTicker) {
			this._ticker.add(this._update, this._priority);
			this._isConnectedToTicker = true;
		}
	}

	stop() {
		if (!this._playing) return;
		this._playing = false;
		if (this._isConnectedToTicker) {
			this._ticker.remove(this._update);
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

	destroy() {
		this.stop();
	}
}
