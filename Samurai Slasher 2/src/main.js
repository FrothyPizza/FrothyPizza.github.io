import { NATIVE_HEIGHT, NATIVE_WIDTH, Renderer } from './core/renderer.js';
import { BitmapFont } from './core/bitmap-font.js';
import { FrameDriver } from './core/ticker.js';
import { TimeSource } from './core/clock.js';
import { InputState, bindKeyboard, bindPointer, detectMobile } from './core/input.js';
import { WebAudio } from './core/audio.js';
import { ScoreBook, createStorage } from './core/storage.js';
import { loadBrowserAssets, loadBrowserSounds } from './core/assets.js';
import { Game } from './game/game.js';

/**
 * Browser entry point.
 *
 * Boots services, shows an in-buffer loading bar while assets stream in, then
 * hands control to the Game. Asset failures are reported inside the pixel
 * buffer rather than thrown: a half-populated `assets/` directory still boots
 * to a usable menu, with placeholders where art is missing.
 */

const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);
renderer.resize();
window.addEventListener('resize', () => renderer.resize());
window.addEventListener('orientationchange', () => renderer.resize());

/** Drawn with fillRect only, so it works before the font atlas has landed. */
function drawBootScreen(done, total, failed) {
	const ctx = renderer.bufferCtx;
	ctx.fillStyle = '#0b0b12';
	ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);

	const barWidth = 96;
	const barX = Math.round((NATIVE_WIDTH - barWidth) / 2);
	const barY = 70;
	ctx.fillStyle = '#3a3a52';
	ctx.fillRect(barX, barY, barWidth, 5);
	ctx.fillStyle = '#57d6d0';
	ctx.fillRect(barX, barY, Math.round((barWidth * done) / Math.max(1, total)), 5);
	if (failed > 0) {
		ctx.fillStyle = '#e2a355';
		ctx.fillRect(barX, barY + 9, barWidth, 1);
	}
	renderer.present();
}

drawBootScreen(0, 1, 0);

const assets = await loadBrowserAssets({
	onProgress: (done, total) => drawBootScreen(done, total, 0),
});

renderer.setFont(new BitmapFont(assets.image('font')));
drawBootScreen(1, 1, assets.errors.length);
if (assets.errors.length > 0) {
	console.warn('[samurai-slasher-2] some assets failed to load:', assets.errors);
}

const time = new TimeSource(() => performance.now());
const driver = new FrameDriver({ maxFPS: 63 });
const input = new InputState();
const touchControls = detectMobile(navigator.userAgent || navigator.vendor || '');

bindKeyboard(input);
bindPointer(input, canvas, renderer);

const { clips, music } = loadBrowserSounds();
const audio = new WebAudio(clips, music);
const storage = createStorage();

const game = new Game({
	renderer,
	assets,
	audio,
	input,
	driver,
	time,
	storage,
	scoreBook: new ScoreBook(storage),
	random: () => Math.random(),
	touchControls,
});

game.showTitle();

const startTime = performance.now();
game.now = startTime;
driver.start(startTime);

requestAnimationFrame(function frame(now) {
	driver.frame(now);
	requestAnimationFrame(frame);
});

// Browsers refuse audio until the player has interacted, so start the music on
// the first real input rather than fighting the policy.
const startMusic = () => {
	if (!input.interacted) return;
	audio.startMusic();
	window.removeEventListener('keydown', startMusic);
	window.removeEventListener('pointerdown', startMusic);
};
window.addEventListener('keydown', startMusic);
window.addEventListener('pointerdown', startMusic);
window.addEventListener('blur', () => audio.stopMusic());
window.addEventListener('focus', () => {
	if (input.interacted) audio.startMusic();
});

export { game, renderer };
