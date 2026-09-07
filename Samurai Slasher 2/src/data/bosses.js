/**
 * Boss registry.
 *
 * A boss is not a big enemy — it is a phase machine that takes over the arena
 * for a while. The states, patterns and telegraph timings live here as data;
 * `src/systems/boss.js` is the only code that reads them.
 *
 * Everything in this file is opt-in per level (`level.boss`). Levels without a
 * `boss` key never touch any of it, which is what keeps the classic arena
 * byte-identical to the original. See docs/bosses.md.
 */

export const BOSS_STATE = {
	DORMANT: 'dormant',
	INTRO: 'intro',
	ACTIVE: 'active',
	VULNERABLE: 'vulnerable',
	PHASE_UP: 'phaseUp',
	DEFEATED: 'defeated',
	CLEARED: 'cleared',
};

/**
 * Attack patterns.
 *
 * `windUpMs` is the telegraph window and is never below 500ms — at 176x144 the
 * player is 6x8 pixels and moves 1px per frame, so anything faster reads as
 * unfair. The hazard is created the frame *after* the telegraph is destroyed,
 * so the two never share a frame.
 */
export const PATTERNS = {
	/** A low bar sweeping the whole arena floor. Jump it. */
	sweep: {
		telegraph: 'sweep',
		windUpMs: 560,
		activeMs: 700,
		cooldownMs: 900,
		hazard: { width: 176, height: 6, anchor: 'floor', offsetY: -6 },
		// Every phase must contain at least one pattern that leaves the boss
		// winded, or that phase has no window in which it can be hurt. Phase
		// one only has this one — see the registry test that enforces it.
		endsVulnerable: true,
	},
	/** A shockwave under wherever the player was standing. Move. */
	slam: {
		telegraph: 'slam',
		windUpMs: 700,
		activeMs: 260,
		cooldownMs: 1300,
		hazard: { width: 30, height: 10, anchor: 'marked', offsetY: 0 },
		endsVulnerable: true,
	},
	/** A horizontal beam at chest height, aimed where the player was. Duck under it or get above it. */
	beam: {
		telegraph: 'beam',
		windUpMs: 900,
		activeMs: 900,
		cooldownMs: 1500,
		hazard: { width: 176, height: 4, anchor: 'marked', offsetY: 0 },
		endsVulnerable: true,
	},
	/** Calls in ordinary enemies through the level's pipe openings. */
	summon: {
		telegraph: null,
		windUpMs: 320,
		activeMs: 60,
		cooldownMs: 2100,
		summons: 2,
	},
};

export const BOSSES = {
	gatekeeper: {
		id: 'gatekeeper',
		name: 'THE GATEKEEPER',
		sheet: 'bossGatekeeper',

		// This is a one-hit-death game: a long boss is tonally wrong, because a
		// single mistake costs you the whole fight. Twelve is roughly a dozen
		// clean swings — punchy enough to match the arena's rhythm.
		health: 12,
		contactDamage: 1,
		animationSpeed: 0.12,

		/**
		 * Where it materialises, and the floor line its sweeps ride on.
		 *
		 * `y` is derived from the player's actual reach, not chosen by eye.
		 * Standing on the floor the player's box is y 112-120 and the sword
		 * sweeps y 108-124; `colliding()` uses strict inequalities, so boxes that
		 * merely touch do not register. At y=92 the armoured core spans 100-112
		 * and the exposed body 93-119 — both genuinely overlap the sword arc,
		 * and the sprite's feet land exactly on the floor line at 120.
		 *
		 * Horizontally the body spans x 76-100 and the core x 83-93, while the
		 * sword reaches from player.x+7 to player.x+30. So the player can stand
		 * clear of the boss's own hitbox and still land hits — the fight is
		 * about spacing, not about hugging.
		 */
		spawn: { x: 72, y: 92 },
		floorY: 120,

		/** Full body — the hitbox while stunned. */
		bounds: { width: 24, height: 26, offsetX: 4, offsetY: 1 },
		/** Armoured core — the hitbox while it is attacking. */
		coreBounds: { width: 10, height: 12, offsetX: 11, offsetY: 8 },

		introMs: 1500,
		phaseUpMs: 700,
		vulnerableMs: 1100,
		/** How long the collapse plays before the arena is handed back. */
		defeatMs: 900,

		/**
		 * Phases are entered when health drops to or below `at` (a fraction of
		 * max). Listed highest first.
		 */
		phases: [
			{ at: 1.0, patterns: ['sweep', 'summon'], tint: 0xffffff },
			{ at: 0.6, patterns: ['sweep', 'slam', 'summon'], tint: 0xffcccc, speedScale: 1.25 },
			{ at: 0.3, patterns: ['slam', 'beam', 'sweep'], tint: 0xff9999, speedScale: 1.5 },
		],
	},
};

export function bossDef(id) {
	const def = BOSSES[id];
	if (!def) throw new Error(`Unknown boss "${id}"`);
	return def;
}

/** Telegraph appearance. Colour is never the only cue — shape and position change too. */
export const TELEGRAPH_STYLE = {
	sweep: { color: '#57d6d0', height: 2, blinkMs: 160 },
	slam: { color: '#e2a355', height: 3, blinkMs: 140 },
	beam: { color: '#ff6b8a', height: 1, blinkMs: 120 },
};
