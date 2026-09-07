import { mapCollisions } from './map-collisions.js';
import { damageCollisions } from './damage-collisions.js';
import { crateCollisions } from './crate-collisions.js';
import { enemySpawner } from './enemy-spawner.js';
import { physics } from './physics.js';
import { playerInput } from './player-input.js';
import { enemyBehavior } from './enemy-behavior.js';
import { animation } from './animation.js';
import { bossSystem } from './boss.js';

/**
 * The system pipeline, in the exact order the original registered it.
 *
 *   map collision -> damage collision -> crate collision -> spawn
 *   -> physics -> input -> enemy behaviour -> animation
 *
 * This order is not incidental. Collision resolution runs *before* the input
 * that moves the player and before the integration that moves everyone, which
 * is why the collision flags a system sees are always one frame old. Reordering
 * anything here changes the feel of the game.
 */
export const SYSTEM_PIPELINE = Object.freeze([
	{ name: 'mapCollisions', run: mapCollisions },
	{ name: 'damageCollisions', run: damageCollisions },
	{ name: 'crateCollisions', run: crateCollisions },
	{ name: 'enemySpawner', run: enemySpawner },
	{ name: 'physics', run: physics },
	{ name: 'playerInput', run: playerInput },
	{ name: 'enemyBehavior', run: enemyBehavior },
	{ name: 'animation', run: animation },
	// Appended, never inserted: everything above observes exactly what it
	// observed in the original. `bossSystem` returns immediately unless the
	// level declares a boss, so the classic arena never enters it.
	{ name: 'bossSystem', run: bossSystem },
]);

export function runSystems(world) {
	for (let i = 0; i < SYSTEM_PIPELINE.length; ++i) SYSTEM_PIPELINE[i].run(world);
}

export {
	mapCollisions,
	damageCollisions,
	crateCollisions,
	enemySpawner,
	physics,
	playerInput,
	enemyBehavior,
	animation,
	bossSystem,
};
