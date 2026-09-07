import { createCannonball, createFlyingShuriken, setPlayerDirection } from '../factories/factories.js';

/**
 * Player control, transcribed from `Systems/input.js`.
 *
 * Kept exactly:
 *   - Movement is a direct position write of `speed` px per frame, applied
 *     *after* collision resolution — that is why you can push into a wall.
 *   - The jump hold window is wall-clock (170ms) and re-applies full jump
 *     velocity every frame it is open; releasing early multiplies the current
 *     velocity by 0.7 exactly once. Bonking a ceiling closes the window by
 *     pushing the timer 10s into the past.
 *   - Attacks are gated on the weapon's animation, not a cooldown counter, so
 *     recovery == animation length. Throwables use a frame counter instead.
 *   - The `hideshow` flicker: when the player turns around, the weapon sprite
 *     is hidden for exactly one rendered frame. It was a hack around a
 *     one-frame stale transform; reproduced because it is visible.
 */
export function playerInput(world) {
	const input = world.input;

	if (world.touchControls) readTouchButtons(world, input);

	for (const entity of world.each('position', 'playerController')) {
		const speed = entity.playerController.speed;

		// The original had a keyboard-only branch for entities without a map
		// collider. Nothing the game builds reaches it (death removes the
		// controller and the collider together), so it is intentionally absent.
		if (!entity.has('mapCollider') || !entity.has('velocity')) continue;

		const sprite = entity.sprite || entity.animatedSprite;

		let boundEntity = null;
		if (entity.has('boundEntity')) {
			const candidate = world.get(entity.boundEntity.id);
			if (candidate && candidate.has('animatedSprite')) boundEntity = candidate;
		}
		if (!boundEntity) continue;

		const hideshow = () => {
			boundEntity.animatedSprite.node.visible = false;
			world.timers.after(0, () => {
				boundEntity.animatedSprite.node.visible = true;
			});
		};
		const lastScale = boundEntity.animatedSprite.node.scaleX;

		if (input.rightDown) {
			entity.position.x += speed;
			sprite.node.scaleX = 1;
		}
		if (input.leftDown) {
			entity.position.x -= speed;
			sprite.node.scaleX = -1;
		}
		setPlayerDirection(world, entity, sprite.node.scaleX);

		if (lastScale !== boundEntity.animatedSprite.node.scaleX) hideshow();

		if (boundEntity.has('throwable')) ++boundEntity.throwable.framesSinceLastAttack;

		if (input.attackDown && boundEntity.has('throwable')) {
			if (boundEntity.throwable.framesSinceLastAttack > boundEntity.throwable.attackDelay) {
				if (boundEntity.enemyDamager.name === 'cannon') {
					playAttackAnimation(boundEntity);
					for (let i = 0; i < 5; ++i) {
						const ball = createCannonball(world, sprite.node.scaleX, entity.position.vec, true);
						ball.position.y += 2;
						world.register(ball);
					}
				} else {
					const shuriken = createFlyingShuriken(world, sprite.node.scaleX, entity.position.vec);
					shuriken.position.y += 2;
					world.register(shuriken);
				}
				boundEntity.throwable.framesSinceLastAttack = 0;
				world.audio.play('hit');
			}
		} else if (input.attackDown && boundEntity.animatedSprite.currentAnimation !== 'Attack') {
			boundEntity.animatedSprite.setAnimation('Attack');
			boundEntity.animatedSprite.node.animationSpeed = 0.2;
			boundEntity.animatedSprite.node.loop = false;
			if (boundEntity.enemyDamager.damageDelay > 0) {
				world.timers.after(boundEntity.enemyDamager.damageDelay, () => {
					boundEntity.enemyDamager.enabled = true;
					world.audio.play('hit');
				});
			} else {
				boundEntity.enemyDamager.enabled = true;
				world.audio.play('hit');
			}

			boundEntity.animatedSprite.node.onComplete = () => {
				boundEntity.animatedSprite.setAnimation('Idle');
				boundEntity.animatedSprite.node.animationSpeed = 0.1;
				boundEntity.animatedSprite.node.loop = true;
				boundEntity.animatedSprite.node.onComplete = () => {};
			};
		}

		if (entity.mapCollider.grounded && input.jumpDown) {
			entity.velocity.y = -entity.playerController.jumpSpeed;
			entity.playerController.jumpHoldTimer.restart();
			world.audio.play('jump');
		}

		if (
			entity.playerController.jumpHoldTimer.getElapsedTime() < entity.playerController.maxJumpHoldTime &&
			input.jumpDown
		) {
			entity.velocity.y = -entity.playerController.jumpSpeed;
			entity.playerController.hasCutJumpVelocity = true;
			if (entity.mapCollider.topColliding) {
				entity.playerController.hasCutJumpVelocity = true;
				entity.playerController.jumpHoldTimer.add(10000);
			}
		} else if (!entity.playerController.hasCutJumpVelocity) {
			entity.playerController.jumpHoldTimer.add(10000);
			entity.velocity.y *= entity.playerController.jumpReleaseMultiplier;
			entity.playerController.hasCutJumpVelocity = true;
		}
	}
}

function playAttackAnimation(weapon) {
	weapon.animatedSprite.setAnimation('Attack');
	weapon.animatedSprite.node.animationSpeed = 0.2;
	weapon.animatedSprite.node.loop = false;
	weapon.animatedSprite.node.onComplete = () => {
		weapon.animatedSprite.setAnimation('Idle');
		weapon.animatedSprite.node.animationSpeed = 0.1;
		weapon.animatedSprite.node.loop = true;
		weapon.animatedSprite.node.onComplete = () => {};
	};
}

/**
 * Touch buttons are entities inside the pixel buffer; hit-testing happens in
 * native 176x144 space and writes straight into the same four booleans the
 * keyboard writes.
 */
function readTouchButtons(world, input) {
	for (const entity of world.each('button')) {
		entity.button.pressed = false;
		for (let i = 0; i < input.touches.length; ++i) {
			const touch = input.touches[i];
			const x = entity.position.x + entity.bounds.offset.x;
			const y = entity.position.y + entity.bounds.offset.y;
			if (touch.x > x && touch.x < x + entity.bounds.x && touch.y > y && touch.y < y + entity.bounds.y) {
				entity.button.pressed = true;
			}
		}

		entity.animatedSprite.setAnimation(entity.button.pressed ? 'Pressed' : 'Idle');

		if (entity.button.type === 'jump') input.jumpDown = entity.button.pressed;
		else if (entity.button.type === 'attack') input.attackDown = entity.button.pressed;
		else if (entity.button.type === 'left') input.leftDown = entity.button.pressed;
		else if (entity.button.type === 'right') input.rightDown = entity.button.pressed;
	}
}
