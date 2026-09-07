/**
 * The original arena, reproduced exactly.
 *
 * Map legend (unchanged from the original `Globals.map`):
 *   `#` solid for everyone
 *   `_` solid for the player only — enemies drop through
 *   `S` crate spawn point (not solid)
 *
 * Every tuning number below is the value the original hard-coded. Changing one
 * changes gameplay, so this file is part of the compatibility contract.
 */
export const classicArena = {
	id: 'arena',
	name: 'CLASSIC ARENA',
	blurb: 'THE ORIGINAL PIPES',
	order: 0,

	tileSize: 8,
	map: [
		'#########    #########',
		'#      ##    ##      #',
		'#                    #',
		'#      SS    SS      #',
		'#     ##########     #',
		'#                    #',
		'#                    #',
		'# SSS            SSS #',
		'######          ######',
		'#                    #',
		'#                    #',
		'#      S S  S S      #',
		'#     ##########     #',
		'#                    #',
		'#  S S S      S S S  #',
		'##########__##########',
	],

	/** Authored art; collision is the map above, which the art was drawn to. */
	background: { type: 'image', key: 'background', zIndex: 100 },

	playerSpawn: { x: 86, y: 66 },

	/** Enemies drop in through the gap in the ceiling. */
	spawner: {
		x: 88,
		y: -4,
		delay: 2000,
		mobileDelay: 2500,
		minDelay: 750,
		decayPerSpawn: 5,
		burstChance: 0.9,
		burstDelay: 400,
		burstDuration: 1000,
		bigEnemyChance: 0.6,
	},

	/** Where an enemy that fell into the pit re-enters, enraged. */
	pipeSpawns: [
		{ x: 64, y: 7 },
		{ x: 108, y: 7 },
	],

	hud: {
		score: { x: 92, y: 60, scale: 2 },
		highScore: { x: 92, y: 76, scale: 1 },
	},

	/** The original clamped anything above this back down. */
	ceiling: -6,
};
