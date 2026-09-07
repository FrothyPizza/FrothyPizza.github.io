import { describe, test, assert, assertEqual } from './framework.js';
import { allLevels, crateLocations, defaultLevel, levelById, validateLevel } from '../src/data/levels/index.js';
import { classicArena } from '../src/data/levels/classic-arena.js';
import { pipeworks } from '../src/data/levels/pipeworks.js';
import { buildTileAtlas, lookupTile, neighbourMask, paintLevelBackground } from '../src/game/tile-art.js';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../src/core/renderer.js';
import { WEAPONS, WEAPON_BAG } from '../src/data/weapons.js';
import { ENEMIES } from '../src/data/enemies.js';

/**
 * The registries are the extension surface. These tests are what stops a
 * future level, weapon or enemy from half-loading: every registered level is
 * validated structurally, and its art is checked to line up with its collision
 * map rather than merely to exist.
 */
describe('levels: registry', () => {
	test('every registered level passes structural validation', () => {
		for (const level of allLevels()) {
			const problems = validateLevel(level);
			assertEqual(problems.join('; '), '', `level "${level.id}" is malformed`);
		}
	});

	test('at least two levels are playable and ids are unique', () => {
		const levels = allLevels();
		assert(levels.length >= 2, 'the sequel ships more than one arena');
		const ids = new Set(levels.map((level) => level.id));
		assertEqual(ids.size, levels.length, 'level ids must be unique');
	});

	test('lookup and defaults resolve', () => {
		assertEqual(levelById('arena'), classicArena, 'lookup by id');
		assertEqual(levelById('pipeworks'), pipeworks, 'lookup by id');
		assertEqual(levelById('nope'), undefined, 'unknown ids resolve to undefined');
		assertEqual(defaultLevel().id, 'arena', 'the classic arena is the default');
	});

	test('the classic arena map is byte-identical to the original Globals map', () => {
		// Transcribed from `Samurai Slasher/js/globals.js`; if this ever drifts,
		// every parity guarantee drifts with it.
		const original = [
			'#########    #########',
			'#      ##    ##      #',
			'#                    #',
			'#      SS    SS      #',
			'#     ##########     #',
			'#                    #',
			'#                    #',
			'# SSS            SSS #',
			'######          ######',
			'#                    #',
			'#                    #',
			'#      S S  S S      #',
			'#     ##########     #',
			'#                    #',
			'#  S S S      S S S  #',
			'##########__##########',
		];
		assertEqual(classicArena.map.join('\n'), original.join('\n'), 'classic arena collision map');
	});

	test('every level fits the native buffer', () => {
		for (const level of allLevels()) {
			const width = level.map[0].length * level.tileSize;
			const height = level.map.length * level.tileSize;
			assert(width <= NATIVE_WIDTH, `${level.id} is ${width}px wide, wider than the 176px buffer`);
			assert(height <= NATIVE_HEIGHT, `${level.id} is ${height}px tall, taller than the 144px buffer`);
		}
	});

	test('crate spawn points are derived from the map and land on solid ground', () => {
		for (const level of allLevels()) {
			const locations = crateLocations(level);
			assert(locations.length > 0, `${level.id} has no crate spawns`);
			for (const location of locations) {
				const tx = location.x / level.tileSize;
				const ty = location.y / level.tileSize;
				const below = level.map[ty + 1];
				assert(
					below && (below[tx] === '#' || below[tx] === '_'),
					`${level.id}: crate at tile (${tx},${ty}) has nothing to rest on`,
				);
			}
		}
	});

	test('pipe re-entry points sit inside the map', () => {
		for (const level of allLevels()) {
			for (const spawn of level.pipeSpawns) {
				assert(
					spawn.x >= 0 && spawn.x < NATIVE_WIDTH && spawn.y >= 0 && spawn.y < NATIVE_HEIGHT,
					`${level.id}: pipe spawn (${spawn.x},${spawn.y}) is off-screen`,
				);
			}
		}
	});

	test('HUD readouts sit inside the native buffer', () => {
		for (const level of allLevels()) {
			for (const key of ['score', 'highScore']) {
				const hud = level.hud[key];
				assert(
					hud.x > 0 && hud.x < NATIVE_WIDTH && hud.y > 0 && hud.y < NATIVE_HEIGHT,
					`${level.id}: ${key} readout at (${hud.x},${hud.y}) escapes the buffer`,
				);
			}
		}
	});
});

describe('levels: derived tile art stays aligned with collision', () => {
	test('the arena art yields a tile for every neighbour pattern it uses', () => {
		const atlas = buildTileAtlas(classicArena.map, classicArena.tileSize);
		assert(atlas.size > 0, 'the reference map produced no tiles');

		for (let y = 0; y < classicArena.map.length; ++y) {
			for (let x = 0; x < classicArena.map[y].length; ++x) {
				const cell = classicArena.map[y][x];
				if (cell !== '#' && cell !== '_') continue;
				assert(atlas.has(neighbourMask(classicArena.map, x, y)), `arena tile (${x},${y}) has no art entry`);
			}
		}
	});

	test('every solid tile in a derived level resolves to art, exactly and in place', () => {
		const atlas = buildTileAtlas(classicArena.map, classicArena.tileSize);
		let exact = 0;
		let approximated = 0;

		for (let y = 0; y < pipeworks.map.length; ++y) {
			for (let x = 0; x < pipeworks.map[y].length; ++x) {
				const cell = pipeworks.map[y][x];
				if (cell !== '#' && cell !== '_') continue;
				const mask = neighbourMask(pipeworks.map, x, y);
				const tile = lookupTile(atlas, mask);
				assert(tile, `pipeworks tile (${x},${y}) resolved to no art at all`);
				if (atlas.has(mask)) ++exact;
				else ++approximated;
			}
		}

		// The art is *keyed by* the collision pattern, so alignment is
		// structural. This just keeps the fallback path from silently becoming
		// the main path if someone edits the map into unusual shapes.
		assert(
			exact / (exact + approximated) > 0.9,
			`only ${exact}/${exact + approximated} pipeworks tiles have authored art`,
		);
	});

	test('a derived background is exactly the size of its collision grid', () => {
		// Headless, so paintLevelBackground returns a measured texture rather
		// than a canvas — the dimensions are the point.
		const texture = paintLevelBackground(pipeworks, classicArena, null);
		assertEqual(texture.frame.w, pipeworks.map[0].length * pipeworks.tileSize, 'background width');
		assertEqual(texture.frame.h, pipeworks.map.length * pipeworks.tileSize, 'background height');
	});
});

describe('registries: weapons and enemies', () => {
	test('all six original weapons are registered', () => {
		const expected = ['sword', 'hammer', 'spear', 'shuriken', 'cannon', 'drill'];
		assertEqual(Object.keys(WEAPONS).join(','), expected.join(','), 'weapon set and declaration order');
	});

	test('the drop bag reproduces the original weights and order', () => {
		// From `Samurai Slasher/js/Blueprints.js`:
		//   sword 5, hammer 4, spear 5, shuriken 4, cannon 1, drill 3
		const expected = [
			...Array(5).fill('sword'),
			...Array(4).fill('hammer'),
			...Array(5).fill('spear'),
			...Array(4).fill('shuriken'),
			...Array(1).fill('cannon'),
			...Array(3).fill('drill'),
		];
		assertEqual(WEAPON_BAG.join(','), expected.join(','), 'weighted drop bag');
		assertEqual(WEAPON_BAG.length, 22, 'bag size drives the single random draw');
	});

	test('all four original enemies are registered in spawn-roll order', () => {
		assertEqual(ENEMIES.length, 4, 'enemy count');
		assertEqual(
			ENEMIES.map((enemy) => enemy.sheet).join(','),
			'smallEnemy,bigEnemy,bat,tallEnemy',
			'index order is the spawner wire format and must not be reshuffled',
		);
	});
});
