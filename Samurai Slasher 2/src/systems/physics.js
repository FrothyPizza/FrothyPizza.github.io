/**
 * Integration and sprite placement, transcribed from `Systems/physics.js`.
 *
 * There is no delta time here and there must not be: velocity is added once
 * per tick, gravity once per tick, and `position.y` is rounded to a whole
 * pixel every tick while `position.x` is left fractional. That asymmetry is
 * what the original's collision sweep is calibrated against.
 *
 * Render sampling order is also preserved: sprite x/y are written from the
 * *previous* frame's position at the top of the loop, before this frame's
 * integration — so what you see is always one integration behind the
 * simulation, and a bound weapon is placed from the player's pre-gravity
 * position.
 */
export function physics(world) {
	for (const entity of world.each()) {
		if (entity.has('position')) {
			if (entity.has('sprite')) {
				entity.sprite.node.x = Math.round(entity.position.x - entity.sprite.offset.x);
				entity.sprite.node.y = Math.round(entity.position.y - entity.sprite.offset.y);
			}
			if (entity.has('animatedSprite')) {
				entity.animatedSprite.node.x = Math.round(entity.position.x - entity.animatedSprite.offset.x);
				entity.animatedSprite.node.y = Math.round(entity.position.y - entity.animatedSprite.offset.y);
			}
			if (entity.has('text')) {
				// Text is intentionally *not* rounded, matching the original.
				entity.text.node.x = entity.position.x;
				entity.text.node.y = entity.position.y;
			}
		}
		if (!entity.has('position', 'velocity')) continue;

		if (entity.has('boundEntity')) {
			const bound = world.get(entity.boundEntity.id);
			if (bound) {
				bound.position.x = entity.position.x + entity.boundEntity.offset.x + entity.bounds.x / 2;
				bound.position.y = entity.position.y + entity.boundEntity.offset.y + entity.bounds.y / 2;
			}
		}

		entity.position.last = entity.position.vec.copy();
		entity.position.vec.add(entity.velocity.vec);

		if (entity.has('gravity')) {
			entity.velocity.vec.add(entity.gravity.vec);
			if (entity.velocity.y > entity.gravity.maxGravity) entity.velocity.y = entity.gravity.maxGravity;
		}

		entity.position.y = Math.round(entity.position.y);
	}
}
