/**
 * Regenerates the Games-page icon for Samurai Slasher 2.
 *
 *   node "Samurai Slasher 2/tools/make-icon.js"
 *
 * The icon is composed from the game's own shipped art — the title logo, the
 * idling samurai and the 4x8 bitmap font — at a whole-number scale, so it looks
 * like a frame of the game rather than a separate illustration. Re-run it if
 * the title art or the font ever change.
 *
 * Writes: images/game-icons/slasher_2_icon.png (344x256)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blit, createImage, decodePng, encodePng } from './png.js';
import { CHAR_HEIGHT, CHAR_WIDTH, GLYPH_ORDER } from '../src/core/bitmap-font.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const gameRoot = path.resolve(here, '..');
const repoRoot = path.resolve(gameRoot, '..');

// The icon is literally the title screen at 2x: 176x144 native -> 352x288.
const SCALE = 2;
const WIDTH = 176 * SCALE;
const HEIGHT = 144 * SCALE;
const BACKDROP = [8, 8, 14, 255];
const ACCENT = [226, 163, 85];
const DIM = [123, 127, 150];

// Mirrors src/game/scenes/title-scene.js so the icon matches what players see.
const ART_TOP = 4;
const IDLER_X = 24;
const IDLER_Y = 114;

// The glyph table is the game's own, so the icon and the game always agree.
const GLYPH_INDEX = new Map(GLYPH_ORDER.map((char, index) => [char, index]));
const GLYPH_WIDTH = CHAR_WIDTH;
const GLYPH_HEIGHT = CHAR_HEIGHT;

const read = (relative) => decodePng(fs.readFileSync(path.join(gameRoot, relative)));

const title = read('assets/images/title-screen.png');
const font = read('assets/fonts/font4x8.png');
const player = read('assets/images/player.png');
const sword = read('assets/images/weapons/sword.png');

const icon = createImage(WIDTH, HEIGHT, BACKDROP);

// The framed title card, centred horizontally, at the scene's own offset.
const artX = Math.round((176 - title.width) / 2);
blit(icon, title, { scale: SCALE, dx: artX * SCALE, dy: ART_TOP * SCALE });

/** Draws a centred bitmap-font string in native coordinates. */
function drawText(text, centreX, centreY, scale, tint) {
	const advance = (GLYPH_WIDTH + 1) * scale;
	const width = text.length * advance - scale;
	let cursor = Math.round(centreX - width / 2);
	const top = Math.round(centreY - (GLYPH_HEIGHT * scale) / 2);
	for (const char of text) {
		const index = GLYPH_INDEX.get(char) ?? 0;
		blit(icon, font, {
			sx: index * GLYPH_WIDTH,
			sy: 0,
			sw: GLYPH_WIDTH,
			sh: GLYPH_HEIGHT,
			scale: scale * SCALE,
			dx: cursor * SCALE,
			dy: top * SCALE,
			tint,
		});
		cursor += advance;
	}
}

// The sequel mark, in the empty band above the logo.
drawText('II', 176 / 2, ART_TOP + 19, 3, ACCENT);

// The samurai idling in the lower band with the sword out, at the same carry
// offset the play scene uses (sword 8px above, 3px right of the player origin).
blit(icon, sword, {
	sx: 0,
	sy: 0,
	sw: 28,
	sh: sword.height,
	scale: SCALE,
	dx: (IDLER_X + 3) * SCALE,
	dy: (IDLER_Y - 8) * SCALE,
});
blit(icon, player, {
	sx: 8,
	sy: 0,
	sw: 8,
	sh: 8,
	scale: SCALE,
	dx: (IDLER_X + 3 - 4) * SCALE,
	dy: IDLER_Y * SCALE,
});

// The menu, exactly as the title scene lays it out.
['>PLAY<', 'LEVELS', 'CONTROLS'].forEach((item, index) => {
	drawText(item, 176 / 2, 104 + index * 10, 1, index === 0 ? [87, 214, 208] : DIM);
});
drawText('ARROWS + ENTER', 176 / 2, 138, 1, DIM);

const outputPath = path.join(repoRoot, 'images', 'game-icons', 'slasher_2_icon.png');
fs.writeFileSync(outputPath, encodePng(icon));
console.log(`wrote ${path.relative(repoRoot, outputPath)} (${WIDTH}x${HEIGHT})`);
