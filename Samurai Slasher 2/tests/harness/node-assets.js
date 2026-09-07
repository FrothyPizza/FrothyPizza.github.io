import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AssetBundle, IMAGE_MANIFEST, SHEET_MANIFEST } from '../../src/core/assets.js';
import { SpriteSheet, Texture } from '../../src/core/textures.js';

/**
 * Headless asset loading.
 *
 * Reads the real JSON spritesheets and the real PNG headers from disk, so the
 * frame rectangles and image dimensions that drive sprite offsets are the
 * shipped ones — not stand-ins. Pixel data is never decoded because nothing
 * headless draws; `image` carries only `width`/`height`.
 *
 * The *same* Texture objects are handed to both the VM oracle and the new
 * runtime, so a render-order comparison can match on texture identity.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
export const GAME_ROOT = path.resolve(here, '../..');

/** Reads width/height out of a PNG IHDR chunk. */
export function readPngSize(file) {
	const header = Buffer.alloc(24);
	const fd = fs.openSync(file, 'r');
	try {
		fs.readSync(fd, header, 0, 24, 0);
	} finally {
		fs.closeSync(fd);
	}
	if (header.toString('latin1', 1, 4) !== 'PNG') throw new Error(`not a PNG: ${file}`);
	return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

function headlessImage(file) {
	const { width, height } = readPngSize(file);
	return { width, height, src: file, headless: true };
}

/**
 * Builds the asset bundle plus a PIXI-shaped `resources` map for the oracle.
 * The keys in `resources` are the names the original's `load.js` registers.
 */
export function loadNodeAssets() {
	const bundle = new AssetBundle();

	for (const [key, relative] of Object.entries(IMAGE_MANIFEST)) {
		bundle.addImage(key, headlessImage(path.join(GAME_ROOT, relative)));
	}

	for (const [key, relative] of Object.entries(SHEET_MANIFEST)) {
		const jsonPath = path.join(GAME_ROOT, relative);
		const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
		const imagePath = path.join(path.dirname(jsonPath), data.meta.image);
		bundle.addSheet(key, new SpriteSheet(key, headlessImage(imagePath), data));
	}

	return bundle;
}

/**
 * The original's `app.loader.resources` shape, backed by the same textures.
 * Names come from `Samurai Slasher/js/load.js`.
 */
export function buildLoaderResources(bundle) {
	return {
		player: { texture: bundle.texture('player') },
		background: { texture: bundle.texture('background') },
		titleScreen: { texture: bundle.texture('titleScreen') },
		crate: { texture: bundle.texture('crate') },
		controlsText: { spritesheet: bundle.sheet('controlsText') },
		smallEnemySpritesheet: { spritesheet: bundle.sheet('smallEnemy') },
		bigEnemySpritesheet: { spritesheet: bundle.sheet('bigEnemy') },
		batSpritesheet: { spritesheet: bundle.sheet('bat') },
		tallEnemySpritesheet: { spritesheet: bundle.sheet('tallEnemy') },
		playerSpritesheet: { spritesheet: bundle.sheet('playerSheet') },
		swordSpritesheet: { spritesheet: bundle.sheet('sword') },
		spearSpritesheet: { spritesheet: bundle.sheet('spear') },
		hammerSpritesheet: { spritesheet: bundle.sheet('hammer') },
		drillSpritesheet: { spritesheet: bundle.sheet('drill') },
		cannonSpritesheet: { spritesheet: bundle.sheet('cannon') },
		shurikenSpritesheet: { spritesheet: bundle.sheet('shuriken') },
		buttonSpritesheet: { spritesheet: bundle.sheet('button') },
		rightButtonSpritesheet: { spritesheet: bundle.sheet('rightButton') },
		leftButtonSpritesheet: { spritesheet: bundle.sheet('leftButton') },
	};
}

export { Texture };
