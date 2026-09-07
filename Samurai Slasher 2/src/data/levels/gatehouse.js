/**
 * The Gatehouse — the boss arena.
 *
 * Deliberately plainer than the other two: a wide floor, two flanking ledges
 * and a high perch. At 176x144 a boss fight needs room to read telegraphs and
 * somewhere to retreat to, not more platforming.
 *
 * The only thing that makes this a boss level is the `boss` key. Everything
 * else — spawner, crates, pipes, HUD — is the same data every level carries,
 * and the same systems consume it.
 */
export const gatehouse = {
	id: 'gatehouse',
	name: 'THE GATEHOUSE',
	blurb: 'SOMETHING IS AWAKE',
	order: 2,

	tileSize: 8,
	/**
	 * Two tiers of side ledges to retreat to, and a completely clear centre.
	 *
	 * The clear centre is the point. An earlier version put platforms over the
	 * middle of the floor, which meant the only spot where the player's sword
	 * reaches the boss was underneath an overhang — you could not jump the
	 * floor sweep from the one place worth standing. Everything overhead is now
	 * pushed to the sides.
	 */
	map: [
		'#########    #########',
		'#      ##    ##      #',
		'#                    #',
		'#                    #',
		'#  S             S   #',
		'# ####          #### #',
		'#                    #',
		'#                    #',
		'#   S           S    #',
		'#  ####        ####  #',
		'#                    #',
		'#                    #',
		'#                    #',
		'#                    #',
		'#  S S S      S S S  #',
		'##########__##########',
	],

	background: { type: 'tiles', source: 'arena', zIndex: 100 },

	/**
	 * Deliberately not the centre spawn the other arenas use: the boss stands
	 * mid-arena, and a centre spawn drops the player straight through its
	 * hitbox on every respawn. Starting on the left ledge gives you a moment to
	 * look at the thing before you commit.
	 */
	playerSpawn: { x: 24, y: 66 },

	/**
	 * A slower drip than the other arenas: the enemies here are the warm-up,
	 * and the boss suspends them entirely once it arrives.
	 */
	spawner: {
		x: 88,
		y: -4,
		delay: 2400,
		mobileDelay: 2800,
		minDelay: 1200,
		decayPerSpawn: 4,
		burstChance: 0.95,
		burstDelay: 700,
		burstDuration: 1000,
		bigEnemyChance: 0.7,
	},

	pipeSpawns: [
		{ x: 64, y: 7 },
		{ x: 108, y: 7 },
	],

	hud: {
		score: { x: 88, y: 60, scale: 2 },
		highScore: { x: 88, y: 76, scale: 1 },
	},

	ceiling: -6,

	/** Opt-in. Levels without this key never execute a line of the boss system. */
	boss: {
		id: 'gatekeeper',
		trigger: { type: 'time', ms: 9000 },
	},
};
