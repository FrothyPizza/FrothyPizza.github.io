import { describe, test, assert, assertEqual } from './framework.js';
import { AnimationPlayer } from '../src/core/animated-sprite.js';
import { Ticker as ShippedTicker, UPDATE_PRIORITY } from '../src/core/ticker.js';
import { AnimatedSprite as PixiAnimatedSprite, Ticker as PixiTicker } from './harness/pixi-stub.js';
import { Texture } from '../src/core/textures.js';
import { mulberry32 } from '../src/core/rng.js';

/**
 * Cross-checks the shipped animation/ticker port against the independent
 * transcription of PIXI 6.2.2 in the test harness.
 *
 * The differential suite exercises these indirectly, but only along the paths
 * the game happens to take. This suite hammers them directly with randomised
 * speeds, loop flags and mid-playback animation swaps, so a latent difference
 * in (say) negative playback or the non-looping snap surfaces here rather than
 * two refactors from now.
 */

function textures(count) {
	return Array.from({ length: count }, (_, i) => new Texture(`t${i}`, null, { x: i, y: 0, w: 4, h: 4 }));
}

describe('animation: shipped port vs PIXI transcription', () => {
	test('frame advance, looping and wrap match over 2000 randomised steps', () => {
		const random = mulberry32(99);

		for (let trial = 0; trial < 40; ++trial) {
			const frameCount = 1 + Math.floor(random() * 8);
			const speed = random() * 0.6 - 0.15; // includes negative playback
			const loop = random() > 0.35;

			const shippedTicker = new ShippedTicker();
			const pixiTicker = new PixiTicker(() => 0);
			pixiTicker.started = true;
			pixiTicker._requestId = 1;

			const shipped = new AnimationPlayer(textures(frameCount), shippedTicker, UPDATE_PRIORITY.HIGH);
			const pixi = new PixiAnimatedSprite(textures(frameCount));
			// Detach from the module-level shared ticker; this test steps by hand.
			pixi._autoUpdate = false;

			shipped.animationSpeed = speed;
			pixi.animationSpeed = speed;
			shipped.loop = loop;
			pixi.loop = loop;

			let shippedCompletes = 0;
			let pixiCompletes = 0;
			shipped.onComplete = () => ++shippedCompletes;
			pixi.onComplete = () => ++pixiCompletes;

			const shippedFrames = [];
			const pixiFrames = [];
			shipped.onFrameChange = (f) => shippedFrames.push(f);
			pixi.onFrameChange = (f) => pixiFrames.push(f);

			shipped.play();
			pixi.play();

			for (let step = 0; step < 50; ++step) {
				const delta = 0.5 + random() * 1.5;
				shipped.update(delta);
				pixi.update(delta);

				assertEqual(
					shipped.currentFrame,
					pixi.currentFrame,
					`trial ${trial} step ${step}: currentFrame (frames=${frameCount} speed=${speed} loop=${loop})`,
				);
				assertEqual(
					Number(shipped._currentTime.toFixed(10)),
					Number(pixi._currentTime.toFixed(10)),
					`trial ${trial} step ${step}: _currentTime`,
				);
				assertEqual(shipped.playing, pixi.playing, `trial ${trial} step ${step}: playing`);
			}

			assertEqual(shippedCompletes, pixiCompletes, `trial ${trial}: onComplete count`);
			assertEqual(shippedFrames.join(','), pixiFrames.join(','), `trial ${trial}: onFrameChange sequence`);
		}
	});

	test('swapping textures mid-playback resets identically', () => {
		const shippedTicker = new ShippedTicker();
		const pixiTicker = new PixiTicker(() => 0);
		pixiTicker.started = true;
		pixiTicker._requestId = 1;

		const shipped = new AnimationPlayer(textures(5), shippedTicker, UPDATE_PRIORITY.HIGH);
		const pixi = new PixiAnimatedSprite(textures(5));
		pixi._autoUpdate = false;

		shipped.animationSpeed = 0.2;
		pixi.animationSpeed = 0.2;
		shipped.play();
		pixi.play();

		for (let step = 0; step < 30; ++step) {
			if (step === 11) {
				// What `setAnimation` does: stop, reassign, play.
				shipped.stop();
				shipped.setTextures(textures(3));
				shipped.play();
				pixi.stop();
				pixi.textures = textures(3);
				pixi.play();
			}
			shipped.update(1);
			pixi.update(1);
			assertEqual(shipped.currentFrame, pixi.currentFrame, `step ${step}: currentFrame`);
			assertEqual(shipped._currentTime, pixi._currentTime, `step ${step}: _currentTime`);
		}
	});

	test('a non-looping animation snaps to the last frame and stops', () => {
		const ticker = new ShippedTicker();
		const player = new AnimationPlayer(textures(4), ticker, UPDATE_PRIORITY.HIGH);
		player.animationSpeed = 0.2;
		player.loop = false;

		let completed = 0;
		player.onComplete = () => ++completed;
		player.play();

		for (let i = 0; i < 40; ++i) player.update(1);

		assertEqual(completed, 1, 'onComplete should fire exactly once');
		assertEqual(player.currentFrame, 3, 'should rest on the final frame');
		assert(!player.playing, 'a finished non-looping animation must detach from the ticker');
	});
});

describe('animation: ticker attachment', () => {
	test('play/stop attach and detach from the shared ticker', () => {
		const ticker = new ShippedTicker();
		const player = new AnimationPlayer(textures(3), ticker, UPDATE_PRIORITY.HIGH);

		assertEqual(ticker.count, 0, 'a fresh player must not be attached');
		player.play();
		assertEqual(ticker.count, 1, 'play() attaches');
		player.play();
		assertEqual(ticker.count, 1, 'play() is idempotent');
		player.stop();
		assertEqual(ticker.count, 0, 'stop() detaches');
	});

	test('re-attaching moves the listener to the back of its priority group', () => {
		const ticker = new ShippedTicker();
		const order = [];
		const a = () => order.push('a');
		const b = () => order.push('b');

		ticker.add(a, UPDATE_PRIORITY.HIGH);
		ticker.add(b, UPDATE_PRIORITY.HIGH);
		ticker.start(0);
		ticker.update(100);
		assertEqual(order.join(''), 'ab', 'insertion order first time');

		order.length = 0;
		ticker.remove(a);
		ticker.add(a, UPDATE_PRIORITY.HIGH);
		ticker.update(200);
		assertEqual(order.join(''), 'ba', 're-added listener goes to the back');
	});
});
