import { Texture } from '../core/textures.js';

/**
 * Derives a new level's background art from the authored arena art.
 *
 * The classic arena ships a hand-drawn 176x128 pipe background whose tiles line
 * up 1:1 with its collision map. This module reads that pairing back out: for
 * every solid tile in the arena it records the 4-neighbour pattern and the 8x8
 * source rectangle that was drawn for it, producing a pattern -> art table.
 *
 * A new level then paints itself by looking up each of its own solid tiles.
 * Because the lookup key *is* the collision pattern, art and collision cannot
 * drift apart — which is the failure mode you get from hand-drawing a second
 * background. Unseen patterns fall back to the closest one by Hamming
 * distance, so an unusual layout degrades gracefully instead of leaving holes.
 */

const UP = 1;
const DOWN = 2;
const LEFT = 4;
const RIGHT = 8;

function solidAt(map, x, y) {
	if (y < 0 || y >= map.length) return false;
	const row = map[y];
	if (x < 0 || x >= row.length) return false;
	return row[x] === '#' || row[x] === '_';
}

export function neighbourMask(map, x, y) {
	let mask = 0;
	if (solidAt(map, x, y - 1)) mask |= UP;
	if (solidAt(map, x, y + 1)) mask |= DOWN;
	if (solidAt(map, x - 1, y)) mask |= LEFT;
	if (solidAt(map, x + 1, y)) mask |= RIGHT;
	return mask;
}

/** pattern -> { sx, sy } source tile in the reference background image. */
export function buildTileAtlas(referenceMap, tileSize = 8) {
	const atlas = new Map();
	for (let y = 0; y < referenceMap.length; ++y) {
		for (let x = 0; x < referenceMap[y].length; ++x) {
			const cell = referenceMap[y][x];
			if (cell !== '#' && cell !== '_') continue;
			const mask = neighbourMask(referenceMap, x, y);
			if (!atlas.has(mask)) atlas.set(mask, { sx: x * tileSize, sy: y * tileSize });
		}
	}
	return atlas;
}

function popcount(value) {
	let n = 0;
	while (value) {
		n += value & 1;
		value >>= 1;
	}
	return n;
}

export function lookupTile(atlas, mask) {
	const exact = atlas.get(mask);
	if (exact) return exact;
	let best = null;
	let bestScore = Infinity;
	for (const [candidate, tile] of atlas) {
		const score = popcount(candidate ^ mask);
		if (score < bestScore) {
			bestScore = score;
			best = tile;
		}
	}
	return best;
}

/**
 * Paints `level.map` using art cut from `referenceImage`. Returns a Texture, or
 * `null` when there is no canvas (headless runs never draw).
 */
export function paintLevelBackground(level, referenceLevel, referenceImage) {
	const tileSize = level.tileSize;
	const width = level.map[0].length * tileSize;
	const height = level.map.length * tileSize;

	if (typeof document === 'undefined' || !referenceImage) {
		return new Texture(`bg:${level.id}`, null, { x: 0, y: 0, w: width, h: height });
	}

	const atlas = buildTileAtlas(referenceLevel.map, tileSize);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;

	for (let y = 0; y < level.map.length; ++y) {
		for (let x = 0; x < level.map[y].length; ++x) {
			const cell = level.map[y][x];
			if (cell !== '#' && cell !== '_') continue;
			const tile = lookupTile(atlas, neighbourMask(level.map, x, y));
			if (!tile) continue;
			ctx.drawImage(
				referenceImage,
				tile.sx,
				tile.sy,
				tileSize,
				tileSize,
				x * tileSize,
				y * tileSize,
				tileSize,
				tileSize,
			);
		}
	}

	return new Texture(`bg:${level.id}`, canvas, { x: 0, y: 0, w: width, h: height });
}
