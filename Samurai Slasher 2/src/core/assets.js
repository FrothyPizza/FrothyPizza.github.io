import { SpriteSheet, Texture } from './textures.js';

/**
 * Asset manifest + loading.
 *
 * The manifest is data: adding a weapon, enemy or level means adding rows
 * here (or in the registries that reference these keys), never editing loader
 * code. Loading is deliberately fault tolerant — a missing sprite yields a
 * visible magenta placeholder and a recorded error instead of a blank page,
 * because a half-broken asset directory should still boot into the menu.
 */

// `font` is deliberately first: the loading screen can start printing words as
// soon as it lands, instead of staring at an untyped progress bar.
export const IMAGE_MANIFEST = {
	font: 'assets/fonts/font4x8.png',
	background: 'assets/images/background.png',
	titleScreen: 'assets/images/title-screen.png',
	crate: 'assets/images/crate.png',
	player: 'assets/images/player.png',
};

export const SHEET_MANIFEST = {
	controlsText: 'assets/images/controls-text.json',
	playerSheet: 'assets/images/player-sheet.json',
	smallEnemy: 'assets/images/enemies/small-enemy.json',
	bigEnemy: 'assets/images/enemies/big-enemy.json',
	bat: 'assets/images/enemies/bat.json',
	tallEnemy: 'assets/images/enemies/tall-enemy.json',
	bossGatekeeper: 'assets/images/enemies/boss-gatekeeper.json',
	sword: 'assets/images/weapons/sword.json',
	spear: 'assets/images/weapons/spear.json',
	hammer: 'assets/images/weapons/hammer.json',
	drill: 'assets/images/weapons/drill.json',
	cannon: 'assets/images/weapons/cannon.json',
	shuriken: 'assets/images/weapons/shuriken.json',
	button: 'assets/images/buttons/button.json',
	rightButton: 'assets/images/buttons/right-button.json',
	leftButton: 'assets/images/buttons/left-button.json',
};

export const SOUND_MANIFEST = {
	jump: { src: 'assets/sounds/effects/jump.wav', volume: 0.1 },
	hit: { src: 'assets/sounds/effects/hit.wav', volume: 0.12 },
	damage: { src: 'assets/sounds/effects/damage.wav', volume: 0.1 },
	powerup: { src: 'assets/sounds/effects/powerup.wav', volume: 0.13 },
	playerDamage: { src: 'assets/sounds/effects/playerDamage.wav', volume: 0.3 },
};

export const MUSIC_MANIFEST = { src: 'assets/sounds/music/battle_music_2_long.mp3', volume: 0.2 };

export class AssetBundle {
	constructor() {
		this.images = new Map();
		this.sheets = new Map();
		this.textures = new Map();
		this.errors = [];
	}

	addImage(key, image) {
		this.images.set(key, image);
		this.textures.set(
			key,
			new Texture(key, image, { x: 0, y: 0, w: image.width, h: image.height }),
		);
	}

	addSheet(key, sheet) {
		this.sheets.set(key, sheet);
	}

	image(key) {
		return this.images.get(key) || null;
	}

	texture(key) {
		const texture = this.textures.get(key);
		if (!texture) throw new Error(`Unknown texture "${key}"`);
		return texture;
	}

	sheet(key) {
		const sheet = this.sheets.get(key);
		if (!sheet) throw new Error(`Unknown spritesheet "${key}"`);
		return sheet;
	}

	get ok() {
		return this.errors.length === 0;
	}
}

function placeholderImage(width = 8, height = 8) {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#ff00ff';
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, width / 2, height / 2);
	ctx.fillRect(width / 2, height / 2, width / 2, height / 2);
	return canvas;
}

function loadImage(src) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error(`failed to load image ${src}`));
		image.src = src;
	});
}

async function loadJson(src) {
	const response = await fetch(src);
	if (!response.ok) throw new Error(`failed to load ${src}: HTTP ${response.status}`);
	return response.json();
}

/**
 * Loads everything the game needs. `onProgress(done, total)` drives the
 * in-buffer loading bar. Never rejects: failures land in `bundle.errors`.
 */
export async function loadBrowserAssets({ base = '', onProgress = () => {} } = {}) {
	const bundle = new AssetBundle();
	const imageEntries = Object.entries(IMAGE_MANIFEST);
	const sheetEntries = Object.entries(SHEET_MANIFEST);
	const total = imageEntries.length + sheetEntries.length;
	let done = 0;
	const step = () => onProgress(++done, total);

	for (const [key, path] of imageEntries) {
		try {
			bundle.addImage(key, await loadImage(base + path));
		} catch (error) {
			bundle.errors.push(error.message);
			bundle.addImage(key, placeholderImage());
		}
		step();
	}

	for (const [key, path] of sheetEntries) {
		try {
			const data = await loadJson(base + path);
			const imagePath = path.replace(/[^/]+$/, data.meta.image);
			const image = await loadImage(base + imagePath);
			bundle.addSheet(key, new SpriteSheet(key, image, data));
		} catch (error) {
			bundle.errors.push(error.message);
			bundle.addSheet(
				key,
				new SpriteSheet(key, placeholderImage(), {
					frames: { 0: { frame: { x: 0, y: 0, w: 8, h: 8 } } },
					animations: { Idle: ['0'] },
				}),
			);
		}
		step();
	}

	return bundle;
}

export function loadBrowserSounds() {
	const clips = {};
	for (const [key, entry] of Object.entries(SOUND_MANIFEST)) {
		try {
			const audio = new Audio(entry.src);
			audio.volume = entry.volume;
			clips[key] = audio;
		} catch {
			/* audio is optional */
		}
	}
	let music = null;
	try {
		music = new Audio(MUSIC_MANIFEST.src);
		music.loop = true;
		music.volume = MUSIC_MANIFEST.volume;
	} catch {
		/* music is optional */
	}
	return { clips, music };
}
