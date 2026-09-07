import { Vec2 } from '../../core/vec2.js';
import { classicArena } from './classic-arena.js';
import { pipeworks } from './pipeworks.js';
import { gatehouse } from './gatehouse.js';

/**
 * Level registry. The menu, the play scene and the score book all read from
 * here; nothing else needs to change to add a level. See docs/extending.md.
 */
const LEVELS = [classicArena, pipeworks, gatehouse].sort((a, b) => a.order - b.order);
const BY_ID = new Map(LEVELS.map((level) => [level.id, level]));

export function allLevels() {
	return LEVELS.slice();
}

export function levelById(id) {
	return BY_ID.get(id);
}

export function defaultLevel() {
	return LEVELS[0];
}

/** Crate spawn points, derived from the `S` cells exactly as `Globals` did. */
export function crateLocations(level) {
	const locations = [];
	for (let y = 0; y < level.map.length; ++y) {
		for (let x = 0; x < level.map[y].length; ++x) {
			if (level.map[y][x] === 'S') locations.push(new Vec2(x * level.tileSize, y * level.tileSize));
		}
	}
	return locations;
}

export function pipeSpawnVectors(level) {
	return level.pipeSpawns.map((p) => new Vec2(p.x, p.y));
}

/**
 * Validates a level definition. Run by the tests over every registered level,
 * so a malformed new level fails loudly instead of half-loading.
 */
export function validateLevel(level) {
	const problems = [];
	if (!level.id) problems.push('missing id');
	if (!Array.isArray(level.map) || level.map.length === 0) problems.push('missing map');
	else {
		const width = level.map[0].length;
		level.map.forEach((row, y) => {
			if (row.length !== width) problems.push(`row ${y} is ${row.length} wide, expected ${width}`);
			for (const cell of row) {
				if (!'# _S'.includes(cell)) problems.push(`row ${y} has unknown cell "${cell}"`);
			}
		});
	}
	if (crateLocations(level).length === 0) problems.push('no crate spawn points (S)');
	if (!level.pipeSpawns || level.pipeSpawns.length === 0) problems.push('no pipe spawn points');
	if (!level.spawner) problems.push('no spawner definition');
	if (!level.hud || !level.hud.score || !level.hud.highScore) problems.push('incomplete hud definition');
	return problems;
}
