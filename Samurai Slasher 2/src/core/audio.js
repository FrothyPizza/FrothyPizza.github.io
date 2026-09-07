/**
 * Audio service.
 *
 * The original called `sounds.x.play()` straight from gameplay systems. Systems
 * here call `world.audio.play('hit')` instead, so a headless run (tests) can
 * pass a silent implementation and gameplay stays identical either way.
 */

export class SilentAudio {
	play() {}
	startMusic() {}
	stopMusic() {}
	setEnabled() {}
}

export class WebAudio {
	/** @param {Record<string, HTMLAudioElement>} clips */
	constructor(clips, music) {
		this.clips = clips;
		this.music = music;
		this.enabled = true;
		this.musicStarted = false;
	}

	setEnabled(enabled) {
		this.enabled = enabled;
		if (!enabled) this.stopMusic();
	}

	play(name) {
		if (!this.enabled) return;
		const clip = this.clips[name];
		if (!clip) return;
		try {
			clip.currentTime = 0;
			const promise = clip.play();
			if (promise && promise.catch) promise.catch(() => {});
		} catch {
			/* autoplay policy / decode failure — never break gameplay for audio */
		}
	}

	startMusic() {
		if (!this.enabled || !this.music || this.musicStarted) return;
		this.musicStarted = true;
		const promise = this.music.play();
		if (promise && promise.catch) promise.catch(() => {});
	}

	stopMusic() {
		if (!this.music) return;
		this.musicStarted = false;
		try {
			this.music.pause();
		} catch {
			/* ignore */
		}
	}
}
