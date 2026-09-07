/**
 * Weapon registry.
 *
 * All six original weapons, described as data. Every number is lifted from
 * `Samurai Slasher/js/Blueprints.js`; the factory in `src/factories` turns a
 * record into an entity. Adding a weapon = adding a record here plus its sheet
 * in the asset manifest. See docs/extending.md.
 *
 * Field notes:
 *   `boundsOffsetYCentered`  -> `bounds.offset.y = -bounds.height / 2`
 *   `spriteOffsetYFromHeight`-> `sprite.offset.y = sprite.height / 2 + 4`
 *   `weight`                 -> how many slots the weapon occupies in the
 *                               random-drop bag (order matters: the bag is
 *                               built in declaration order and indexed with a
 *                               single `random()` call, exactly as before).
 */
export const WEAPONS = {
	sword: {
		id: 'sword',
		label: 'SWORD',
		weight: 5,
		sheet: 'sword',
		damage: 1,
		bounds: { width: 23, height: 16, offsetX: 4, offsetYCentered: true },
		sprite: { offsetYFromHeight: true },
	},
	hammer: {
		id: 'hammer',
		label: 'HAMMER',
		weight: 4,
		sheet: 'hammer',
		damage: 4,
		bounds: { width: 16, height: 18, offsetX: 4, offsetYCentered: true },
		sprite: { offsetYFromHeight: true },
	},
	spear: {
		id: 'spear',
		label: 'SPEAR',
		weight: 5,
		sheet: 'spear',
		damage: 1.5,
		bounds: { width: 42, height: 6, offsetX: 4, offsetYCentered: true },
		sprite: { offsetYFromHeight: true },
	},
	shuriken: {
		id: 'shuriken',
		label: 'SHURIKEN',
		weight: 4,
		sheet: 'shuriken',
		damage: 1,
		bounds: { width: 4, height: 4 },
		sprite: { offsetX: -4, offsetY: 2 },
		throwable: { attackDelay: 18 },
		// framesEnabled 0 keeps the held shuriken from ever swinging; the
		// thrown copy raises it to 10000.
		damager: { framesEnabled: 0, enabled: true },
		projectile: 'shuriken',
	},
	cannon: {
		id: 'cannon',
		label: 'CANNON',
		weight: 1,
		sheet: 'cannon',
		damage: 1,
		bounds: { width: 23, height: 16, offsetX: 4, offsetYCentered: true },
		sprite: { offsetYFromHeight: true },
		throwable: { attackDelay: 20 },
		projectile: 'cannonball',
	},
	drill: {
		id: 'drill',
		label: 'DRILL',
		weight: 3,
		sheet: 'drill',
		damage: 4,
		bounds: { width: 10, height: 7, offsetX: -5, offsetY: 4 },
		sprite: { offsetX: -3, offsetY: -1 },
		drill: true,
		damager: { framesEnabled: 1000000000, enabled: true },
	},
};

/**
 * The weighted drop bag, built in declaration order so a seeded `random()`
 * stream picks the same weapons the original picked.
 */
export const WEAPON_BAG = Object.values(WEAPONS).flatMap((weapon) =>
	Array.from({ length: weapon.weight }, () => weapon.id),
);

export function weaponDef(id) {
	const def = WEAPONS[id];
	if (!def) throw new Error(`Unknown weapon "${id}"`);
	return def;
}
