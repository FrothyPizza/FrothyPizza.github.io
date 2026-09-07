/**
 * Enemy registry.
 *
 * All four original enemies as data, indexed by the spawn "type" number the
 * spawner rolls (0..3). Order is load bearing — the spawner's random roll maps
 * directly onto these indices — so new enemies append rather than insert.
 * See docs/extending.md.
 *
 * Every enemy shares the base kit (position, velocity, gravity, map collider,
 * 5x6 bounds, wandering behaviour, 1 HP, touches-the-player damage) and then
 * overrides. `null` means "keep the base value".
 */
export const ENEMIES = [
	{
		id: 'grunt',
		label: 'GRUNT',
		sheet: 'smallEnemy',
	},
	{
		id: 'brute',
		label: 'BRUTE',
		sheet: 'bigEnemy',
		animationSpeed: 0.0666,
		health: 4,
		bounds: { width: 12, height: 12 },
		speed: 0.25,
	},
	{
		id: 'bat',
		label: 'BAT',
		sheet: 'bat',
		health: 1,
		bounds: { width: 6, height: 8 },
		sprite: { offsetX: -2 },
		flying: true,
		gravityY: 0.075,
	},
	{
		id: 'stalker',
		label: 'STALKER',
		sheet: 'tallEnemy',
		animationSpeed: 0.1,
		health: 2,
		bounds: { width: 8, height: 16, offsetX: 1 },
		speed: 0.3333,
	},
];

/**
 * Thresholds the spawner rolls against once it has decided to spawn something
 * other than a grunt. Lives here because the numbers are meaningless without
 * the index order above: `> brute` -> index 1, else `> bat` -> index 2,
 * else index 3.
 */
export const TYPE_ROLL = {
	brute: 0.666,
	bat: 0.5,
};

export function enemyDef(type) {
	return ENEMIES[type] || ENEMIES[0];
}
