import { Gravity } from '../world/components.js';
import { colliding } from './collision.js';

const NO_TINT = 0xffffff;
const HURT_TINT = 0xbb8899;

/**
 * Damage resolution, transcribed from `Systems/damageCollisions.js`.
 *
 * Structure preserved on purpose: weapons are resolved in one full pass over
 * every damager before enemies get their pass. That ordering is why you can
 * kill an enemy on the same frame it would have killed you.
 *
 * Timings here are wall-clock (`world.timers`), not frame counts — corpse
 * cleanup at 1000ms, hurt-flash reset at 200ms, drill re-hit at 50ms, respawn
 * at 1600ms and a 250ms hitstop — exactly as the original scheduled them.
 */
export function damageCollisions(world) {
	function check(damager) {
		for (const reciever of world.each('health', 'position', 'bounds')) {
			// A weapon damaging an enemy.
			if (damager.has('enemyDamager') && damager.enemyDamager.enabled && reciever.has('playerDamager')) {
				if (
					colliding(damager, reciever) &&
					!damager.enemyDamager.damagedEntities.find((x) => x === reciever.id)
				) {
					damager.enemyDamager.damagedEntities.push(reciever.id);

					reciever.health.value -= damager.enemyDamager.damage;
					if (reciever.animatedSprite.node.tint === NO_TINT) reciever.animatedSprite.node.tint = HURT_TINT;

					if (reciever.health.value <= 0) {
						reciever.remove('mapCollider');
						reciever.remove('playerDamager');
						if (damager.has('animatedSprite')) {
							reciever.velocity.x = 2.5 * damager.animatedSprite.node.scaleX;
							reciever.animatedSprite.node.zIndex = 1000;
						} else {
							reciever.velocity.x = 2.5 * (world.random() > 0.5 ? -1 : 1);
						}
						reciever.velocity.y = -2.5;
						reciever.animatedSprite.node.loop = false;
						world.timers.after(1000, () => world.removeEntity(reciever.id));
					} else if (reciever.has('animatedSprite')) {
						if (reciever.animatedSprite.node.tint === HURT_TINT) {
							world.timers.after(200, () => {
								reciever.animatedSprite.node.tint = NO_TINT;
							});
						}
					}

					if (damager.has('throwable')) {
						if (damager.enemyDamager.damagedEntities.length > damager.throwable.pierce) {
							damager.remove('enemyDamager');
							damager.velocity.x = -2 * damager.animatedSprite.node.scaleX;
							damager.velocity.y = -2.5;
							damager.animatedSprite.node.zIndex = 1000;
							damager.add('gravity', new Gravity());
						}
					}

					const player = world.player;
					if (damager.has('drill')) {
						if (player) {
							// Pogo: shove the player up until they clear the
							// enemy. The loop is the original's, quirk included
							// (it also fakes `grounded` for one frame).
							player.velocity.y = -2;
							player.mapCollider.grounded = true;
							do {
								player.position.y -= 2;
							} while (colliding(player, reciever));
							world.audio.play('damage');
						}
						world.timers.after(50, () => {
							damager.enemyDamager.damagedEntities = [];
						});
					}
				}
			}

			// An enemy damaging the player.
			if (damager.has('playerDamager') && reciever.has('playerController')) {
				const bound = reciever.has('boundEntity') ? world.get(reciever.boundEntity.id) : undefined;
				if (bound && bound.has('drill') && reciever.velocity.y > 0) {
					// Falling onto an enemy with the drill out: no damage.
				} else if (colliding(damager, reciever)) {
					world.hooks.onRunEnded(reciever.playerController.score);
					reciever.remove('mapCollider');
					reciever.remove('playerController');
					reciever.animatedSprite.setAnimation('Fall');
					reciever.velocity.x = -2 * reciever.animatedSprite.node.scaleX;
					reciever.velocity.y = -2.5;
					reciever.animatedSprite.node.zIndex = 1000;
					reciever.animatedSprite.node.tint = HURT_TINT;
					if (bound) bound.remove('enemyDamager');
					world.audio.play('playerDamage');
					if (bound) bound.animatedSprite.setAnimation('Idle');
					world.timers.after(1600, () => world.hooks.restart());
					world.hooks.freeze(250);
					return;
				}
			}
		}
	}

	for (const damager of world.each('position', 'bounds')) {
		if (damager.has('enemyDamager') && damager.enemyDamager.enabled) {
			++damager.enemyDamager.frames;
			if (damager.enemyDamager.frames > damager.enemyDamager.framesEnabled) {
				damager.enemyDamager.enabled = false;
				damager.enemyDamager.frames = 0;
				damager.enemyDamager.damagedEntities = [];
			}

			check(damager);
		}
	}

	for (const damager of world.each('position', 'bounds')) {
		if (damager.has('playerDamager')) {
			check(damager);
		}
	}
}
