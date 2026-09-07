/**
 * Pipeworks — the second arena, and the proof that levels are data.
 *
 * Nothing in `src/systems` or `src/factories` knows this file exists: it is
 * picked up purely through the level registry. Its art is *derived* from the
 * map by `src/game/tile-art.js`, which cuts 8x8 pieces out of the original
 * background and re-tiles them by neighbour pattern — so the pipes and the
 * collision grid cannot drift apart, by construction.
 *
 * Same ceiling gap and pipe re-entry points as the arena, so falling and
 * re-spawning read identically; the platform layout, crate spread and spawn
 * cadence are what differ.
 */
export const pipeworks = {
	id: 'pipeworks',
	name: 'PIPEWORKS',
	blurb: 'TIGHTER, FASTER, MEANER',
	order: 1,

	tileSize: 8,
	map: [
		'#########    #########',
		'#      ##    ##      #',
		'#                    #',
		'#   S S        S S   #',
		'#  #####      #####  #',
		'#                    #',
		'#         SS         #',
		'#       ######       #',
		'#                    #',
		'#  S S          S S  #',
		'# #####        ##### #',
		'#                    #',
		'#     S S    S S     #',
		'#    ############    #',
		'#  S S S      S S S  #',
		'##########__##########',
	],

	background: { type: 'tiles', source: 'arena', zIndex: 100 },

	playerSpawn: { x: 86, y: 66 },

	spawner: {
		x: 88,
		y: -4,
		delay: 1700,
		mobileDelay: 2100,
		minDelay: 650,
		decayPerSpawn: 6,
		burstChance: 0.88,
		burstDelay: 380,
		burstDuration: 1000,
		bigEnemyChance: 0.55,
	},

	pipeSpawns: [
		{ x: 64, y: 7 },
		{ x: 108, y: 7 },
	],

	hud: {
		score: { x: 88, y: 44, scale: 2 },
		highScore: { x: 88, y: 60, scale: 1 },
	},

	ceiling: -6,
};
