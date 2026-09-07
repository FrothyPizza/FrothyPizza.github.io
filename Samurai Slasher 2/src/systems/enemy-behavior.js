import { PipeTraveller } from '../world/components.js';
import { pipeSpawnVectors } from '../data/levels/index.js';

/**
 * Enemy movement, transcribed from `Systems/enemyBehavior.js`.
 *
 * Preserved quirks:
 *   - `enragedSpeed` is computed once at construction from the *base* 0.5, so
 *     every enemy type — however slow — travels at exactly 1.0 px/frame once
 *     enraged.
 *   - Falling off the bottom does not kill an enemy: it gets a `PipeTraveller`
 *     and re-enters through a ceiling pipe, enraged and tinted red, with
 *     `hasTouchedGround` cleared so it drops before it starts walking.
 *   - The bat's upward pulse is driven by the *animation*, via `onFrameChange`
 *     on frame 1 — so its hover cadence follows animation speed, not physics.
 */
export function enemyBehavior(world) {
	for (const entity of world.each('position', 'velocity', 'enemyBehavior', 'mapCollider', 'bounds')) {
		if (entity.has('pipeTraveller')) {
			const spawns = entity.pipeTraveller.spawnLocations;
			entity.position.vec = spawns[Math.floor(world.random() * 2)].copy();
			entity.velocity.y = 0;
			entity.enemyBehavior.speed = entity.enemyBehavior.enragedSpeed;
			entity.animatedSprite.node.tint = 0x992222;
			entity.remove('pipeTraveller');
			entity.enemyBehavior.hasTouchedGround = false;
		}

		if (entity.enemyBehavior.hasTouchedGround) {
			entity.position.x +=
				entity.enemyBehavior.direction *
				entity.enemyBehavior.speed *
				(entity.enemyBehavior.enraged ? entity.enemyBehavior.enragedSpeed : 1);
		}

		if (entity.mapCollider.leftColliding) entity.enemyBehavior.direction = 1;
		if (entity.mapCollider.rightColliding) entity.enemyBehavior.direction = -1;

		if (entity.has('flyingEnemy') && entity.has('animatedSprite')) {
			if (!entity.animatedSprite.node.onFrameChange) {
				entity.animatedSprite.node.onFrameChange = (frame) => {
					if (frame === 1) entity.velocity.y = -entity.flyingEnemy.pulseStrength;
				};
			}
		}

		if (entity.position.y > world.screen.height && !entity.has('pipeTraveller')) {
			entity.add('pipeTraveller', new PipeTraveller(pipeSpawnVectors(world.level)));
			entity.enemyBehavior.enraged = true;
		}

		if (entity.has('sprite')) {
			entity.sprite.node.scaleX = entity.enemyBehavior.direction;
		} else if (entity.has('animatedSprite')) {
			entity.animatedSprite.node.scaleX = entity.enemyBehavior.direction;
		}
	}
}
