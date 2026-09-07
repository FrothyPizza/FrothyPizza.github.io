import { Vec2 } from '../core/vec2.js';
import * as C from '../world/components.js';
import { enemyDef } from '../data/enemies.js';
import { WEAPON_BAG, weaponDef } from '../data/weapons.js';
import { TOUCH_BUTTONS } from '../data/buttons.js';

/**
 * Entity factories.
 *
 * Every factory reads a registry record and assembles components; none of them
 * contain per-type `if` ladders. That is the whole point — adding a weapon or
 * an enemy is a data edit (see docs/extending.md), not a factory edit.
 *
 * Component *order* is preserved from the original blueprints, because the
 * RNG stream and several derived offsets depend on it.
 */

export function createPhysicsEntity(world) {
	const entity = world.create();
	entity.add('position', new C.Position());
	entity.add('velocity', new C.Velocity());
	entity.add('gravity', new C.Gravity());
	entity.add('mapCollider', new C.MapCollider());
	return entity;
}

function attachAnimatedSprite(world, entity, sheetKey, centered) {
	return entity.add(
		'animatedSprite',
		new C.AnimatedSprite(world.assets.sheet(sheetKey), world.scene, world.animationTicker, centered),
	);
}

/**
 * @param {number} type index into the enemy registry — the number the spawner
 *   rolls, kept as the wire format so save data / tests stay stable.
 */
export function createEnemy(world, type) {
	const def = enemyDef(type);
	const entity = createPhysicsEntity(world);

	entity.add('bounds', new C.Bounds(5, 6));
	// Consumes one random draw for the initial facing — before the sprite is
	// built, exactly as the original blueprint did.
	entity.add('enemyBehavior', new C.EnemyBehavior(undefined, world.random));
	entity.add('health', new C.Health(1));
	entity.add('playerDamager', new C.PlayerDamager(1));
	attachAnimatedSprite(world, entity, def.sheet, true);

	if (def.animationSpeed != null) entity.animatedSprite.node.animationSpeed = def.animationSpeed;
	if (def.health != null) entity.health.value = def.health;
	if (def.bounds) {
		entity.bounds.vec = new Vec2(def.bounds.width, def.bounds.height);
		if (def.bounds.offsetX != null) entity.bounds.offset.x = def.bounds.offsetX;
		if (def.bounds.offsetY != null) entity.bounds.offset.y = def.bounds.offsetY;
	}
	if (def.sprite) {
		if (def.sprite.offsetX != null) entity.animatedSprite.offset.x = def.sprite.offsetX;
		if (def.sprite.offsetY != null) entity.animatedSprite.offset.y = def.sprite.offsetY;
	}
	if (def.flying) entity.add('flyingEnemy', new C.FlyingEnemy());
	if (def.gravityY != null) entity.gravity.y = def.gravityY;
	// NOTE: assigning speed here leaves `enragedSpeed` at its constructed
	// value (base 0.5 * 2 = 1.0) for every type. That is the original's
	// behaviour and the reason all enraged enemies move at the same pace.
	if (def.speed != null) entity.enemyBehavior.speed = def.speed;

	return entity;
}

export function createPlayer(world) {
	const player = createPhysicsEntity(world);
	attachAnimatedSprite(world, player, 'playerSheet', true);
	player.add('bounds', new C.Bounds(6, 8));
	player.add('playerController', new C.PlayerController(world.time));
	player.add('health', new C.Health(1));
	// `position.vec` is replaced but `position.last` is not — see the
	// first-frame sweep note in docs/compatibility.md.
	player.position.vec = new Vec2(world.level.playerSpawn.x, world.level.playerSpawn.y);
	player.animatedSprite.offset.x = -3;
	return player;
}

export function createWeapon(world, id) {
	const def = weaponDef(id);
	const entity = world.create();

	entity.add('position', new C.Position());
	entity.add('enemyDamager', new C.EnemyDamager(1));
	entity.enemyDamager.enabled = false;
	entity.enemyDamager.name = id;

	entity.add('bounds', new C.Bounds(def.bounds.width, def.bounds.height));
	if (def.damage != null) entity.enemyDamager.damage = def.damage;
	if (def.bounds.offsetX != null) entity.bounds.offset.x = def.bounds.offsetX;
	if (def.bounds.offsetY != null) entity.bounds.offset.y = def.bounds.offsetY;
	if (def.bounds.offsetYCentered) entity.bounds.offset.y = -entity.bounds.y / 2;

	attachAnimatedSprite(world, entity, def.sheet, false);
	const sprite = def.sprite || {};
	if (sprite.offsetYFromHeight) entity.animatedSprite.offset.y = entity.animatedSprite.node.height / 2 + 4;
	if (sprite.offsetX != null) entity.animatedSprite.offset.x = sprite.offsetX;
	if (sprite.offsetY != null) entity.animatedSprite.offset.y = sprite.offsetY;

	if (def.throwable) entity.add('throwable', new C.Throwable(def.throwable.attackDelay));
	if (def.drill) entity.add('drill', new C.Drill());

	if (def.damager) {
		if (def.damager.framesEnabled != null) entity.enemyDamager.framesEnabled = def.damager.framesEnabled;
		if (def.damager.damageDelay != null) entity.enemyDamager.damageDelay = def.damager.damageDelay;
		if (def.damager.enabled != null) entity.enemyDamager.enabled = def.damager.enabled;
	}

	return entity;
}

/** A thrown shuriken: the held weapon, re-dressed as a projectile. */
export function createFlyingShuriken(world, direction, position) {
	const entity = createWeapon(world, 'shuriken');
	entity.add('velocity', new C.Velocity(4 * direction, 0));
	entity.animatedSprite.setAnimation('Attack');
	entity.animatedSprite.offset = new Vec2(0, 0);
	entity.animatedSprite.node.scaleX = direction;
	entity.enemyDamager.framesEnabled = 10000;
	entity.position.vec = position.copy();

	world.timers.after(2000, () => world.removeEntity(entity.id));
	return entity;
}

/** One cannon pellet. `scatter` consumes two random draws, in x then y order. */
export function createCannonball(world, direction, position, scatter) {
	const entity = createWeapon(world, 'shuriken');
	entity.add('velocity', new C.Velocity(3 * direction, -2.5));
	if (scatter) {
		entity.velocity.x += world.random() * 2 - 1;
		entity.velocity.y += world.random() * 2 - 1;
	}
	entity.add('gravity', new C.Gravity());
	entity.animatedSprite.setAnimation('Attack');
	entity.animatedSprite.offset = new Vec2(0, 0);
	entity.animatedSprite.node.scaleX = direction;
	entity.enemyDamager.framesEnabled = 10000;
	entity.position.vec = position.copy();

	world.timers.after(2000, () => world.removeEntity(entity.id));
	return entity;
}

export function createCrate(world) {
	const entity = world.create();
	entity.add('position', new C.Position());
	entity.add('collectable', new C.Collectable(world.crateLocations));
	entity.add('bounds', new C.Bounds(8, 8));
	entity.add('sprite', new C.Sprite(world.assets.texture('crate'), world.scene, false));
	entity.sprite.node.zIndex = -1;
	entity.position.vec = entity.collectable.getRandomLocation(world.random);
	return entity;
}

export function createButton(world, def) {
	const entity = world.create();
	entity.add('position', new C.Position(def.x, def.y));
	entity.add('button', new C.Button(def.type));
	entity.add('bounds', new C.Bounds(def.bounds.width, def.bounds.height));
	entity.bounds.offset.x = def.bounds.offsetX;
	entity.bounds.offset.y = def.bounds.offsetY;
	attachAnimatedSprite(world, entity, def.sheet, false);
	entity.animatedSprite.node.zIndex = 10000;
	return entity;
}

export function createTouchButtons(world) {
	if (!world.touchControls) return [];
	return TOUCH_BUTTONS.map((def) => world.register(createButton(world, def)));
}

// ---------------------------------------------------------------------------
// Boss encounters. Every factory below produces entities carrying components no
// classic-arena entity has, so the existing pipeline steps over all of them.
// ---------------------------------------------------------------------------

/**
 * The boss itself.
 *
 * Deliberately assembled from the *existing* vocabulary: `Health` and
 * `PlayerDamager` make it damageable and dangerous through the ordinary damage
 * system, so there is no second damage path to keep in sync. It carries a
 * `Velocity` (which the death path writes to) but no `MapCollider` and no
 * `Gravity` — the boss system places it, not physics.
 */
export function createBoss(world, def) {
	const entity = world.create();
	entity.add('position', new C.Position(def.spawn.x, def.spawn.y));
	entity.add('velocity', new C.Velocity());
	entity.add('bounds', new C.Bounds(def.coreBounds.width, def.coreBounds.height));
	entity.bounds.offset.x = def.coreBounds.offsetX;
	entity.bounds.offset.y = def.coreBounds.offsetY;
	entity.add('health', new C.Health(def.health));
	entity.add('bossBehavior', new C.BossBehavior(def));
	attachAnimatedSprite(world, entity, def.sheet, false);
	entity.animatedSprite.node.animationSpeed = def.animationSpeed;
	return entity;
}

/** A flat coloured rectangle used for telegraphs, hazards and HUD bars. */
export function createRectEntity(world, { x, y, width, height, color, zIndex, alpha }) {
	const entity = world.create();
	entity.add('position', new C.Position(x, y));
	entity.add('rect', new C.Rect(width, height, color, world.scene, { zIndex, alpha }));
	entity.rect.node.x = x;
	entity.rect.node.y = y;
	return entity;
}

/** A warning marker. Carries no hitbox — that is the whole point. */
export function createTelegraph(world, { kind, ownerId, windUpMs, x, y, width, height, color }) {
	const entity = createRectEntity(world, { x, y, width, height, color, zIndex: 600 });
	entity.add('telegraph', new C.Telegraph(kind, ownerId, windUpMs, world.time));
	return world.register(entity);
}

/**
 * A damaging region with no sprite. `PlayerDamager` + `Bounds` is all the
 * existing damage system needs, so a hazard hurts the player through exactly
 * the same code path an enemy does.
 */
export function createHazard(world, { ownerId, lifetimeMs, x, y, width, height, color, damage = 1 }) {
	const entity = createRectEntity(world, { x, y, width, height, color, zIndex: 620 });
	entity.add('bounds', new C.Bounds(width, height));
	entity.add('playerDamager', new C.PlayerDamager(damage));
	entity.add('hazard', new C.Hazard(ownerId, lifetimeMs, world.time));
	return world.register(entity);
}

/**
 * Swaps the player's weapon. With no name given it draws from the weighted bag
 * until it gets something different from the current weapon — one random draw
 * per attempt, matching the original's rejection loop.
 */
export function setPlayerWeapon(world, player, weaponName) {
	const oldWeapon = world.get(player.boundEntity.id);
	let next = weaponName;
	if (!weaponName) {
		do {
			next = WEAPON_BAG[Math.floor(world.random() * WEAPON_BAG.length)];
		} while (next === oldWeapon.enemyDamager.name);
	}

	world.removeEntity(oldWeapon.id);
	const weapon = createWeapon(world, next);

	world.register(weapon);
	player.boundEntity.id = weapon.id;
	setPlayerDirection(world, player, player.animatedSprite.node.scaleX);
	return weapon;
}

/**
 * Mirrors the player and the held weapon. Flipping a weapon negates its sprite
 * offset, the carry offset, the bounds offset *and* the bounds width — a
 * negative width is how the original expressed a left-facing hitbox, and
 * `colliding()` still understands it.
 */
export function setPlayerDirection(world, player, direction) {
	const weapon = world.get(player.boundEntity.id);
	if (!weapon) return;

	if (weapon.has('drill')) {
		weapon.animatedSprite.offset.x = direction * Math.abs(weapon.animatedSprite.offset.x);
		weapon.animatedSprite.node.scaleX = direction;
		return;
	}

	if (direction === 1) {
		player.animatedSprite.node.scaleX = 1;
		if (weapon.animatedSprite.node.scaleX !== 1) {
			weapon.animatedSprite.node.scaleX = 1;
			weapon.animatedSprite.offset.x = -Math.abs(weapon.animatedSprite.offset.x);
			player.boundEntity.offset.x = Math.abs(player.boundEntity.offset.x);
			weapon.bounds.offset.x = Math.abs(weapon.bounds.offset.x);
			weapon.bounds.x = Math.abs(weapon.bounds.x);
		}
	} else if (direction === -1) {
		player.animatedSprite.node.scaleX = -1;
		if (weapon.animatedSprite.node.scaleX !== -1) {
			weapon.animatedSprite.node.scaleX = -1;
			weapon.animatedSprite.offset.x = Math.abs(weapon.animatedSprite.offset.x);
			player.boundEntity.offset.x = -Math.abs(player.boundEntity.offset.x);
			weapon.bounds.offset.x = -Math.abs(weapon.bounds.offset.x);
			weapon.bounds.x = -Math.abs(weapon.bounds.x);
		}
	}
}
