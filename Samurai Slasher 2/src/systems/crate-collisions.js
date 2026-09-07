import { colliding } from './collision.js';
import { setPlayerWeapon } from '../factories/factories.js';

/**
 * Crate pickup: +1 score, teleport the crate somewhere at least 64px away, and
 * swap the player's weapon for a different random one.
 * Transcribed from `Systems/crateCollisions.js`.
 */
export function crateCollisions(world) {
	for (const player of world.each('playerController', 'position', 'bounds')) {
		for (const crate of world.each('position', 'bounds', 'collectable')) {
			if (!colliding(player, crate)) continue;

			++player.playerController.score;

			const lastPosition = crate.position.vec.copy();
			do {
				crate.position.vec = crate.collectable.getRandomLocation(world.random);
			} while (distance(crate.position.vec, lastPosition) < 64);

			setPlayerWeapon(world, player);

			world.scoreBook.submit(world.level.id, player.playerController.score);
			world.hooks.onScoreChanged(player.playerController.score);

			for (const entity of world.each('text')) {
				if (entity.has('score')) {
					entity.text.value = player.playerController.score;
				}
				// Quirk (preserved): the original tested for a component name
				// that never existed here, so the high-score readout does not
				// refresh mid-run — only when the level is (re)built.
				// See docs/compatibility.md.
			}

			world.audio.play('powerup');
		}
	}
}

function distance(a, b) {
	return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}
