/**
 * Player animation state, transcribed from `Systems/animation.js`.
 *
 * Quirk (preserved): the original tested `!entity.grounded` — a property that
 * lives on `entity.mapCollider`, not on the entity — so the guard was always
 * true and the animation is chosen purely from vertical velocity. Reading the
 * real flag would change which animation plays on slopes of the frame, so the
 * dead guard is simply dropped rather than "fixed".
 */
export function animation(world) {
	for (const entity of world.each('animatedSprite')) {
		if (!entity.has('position', 'playerController')) continue;
		if (!entity.has('velocity')) continue;

		const moving = entity.position.last.x !== entity.position.x;

		if (entity.velocity.y > 1) {
			entity.animatedSprite.setAnimation('Fall');
		} else if (entity.velocity.y < -1) {
			entity.animatedSprite.setAnimation('Jump');
		} else if (moving) {
			entity.animatedSprite.setAnimation('Run');
		} else {
			entity.animatedSprite.setAnimation('Idle');
		}
	}
}
