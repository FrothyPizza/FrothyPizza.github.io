import { describe, test, assert, assertNoDifferences } from './framework.js';
import { FRAME_MS, FakeEnvironment } from './harness/fake-env.js';
import { loadNodeAssets } from './harness/node-assets.js';
import { createOracle } from './harness/oracle.js';
import { createSubject } from './harness/subject.js';
import {
	diff,
	snapshotOracleRender,
	snapshotOracleWorld,
	snapshotSubjectRender,
	snapshotSubjectWorld,
} from './harness/snapshot.js';
import { mulberry32 } from '../src/core/rng.js';

/**
 * Differential tests: the original source is the oracle.
 *
 * Both runtimes are booted on the same fake clock, fed the same seeded random
 * stream and the same per-frame input, then compared frame by frame on both
 * simulation state and render output. Nothing here asserts a hand-written
 * expected value for gameplay — the expectation is always "whatever the
 * original just did".
 */

const bundle = loadNodeAssets();

/**
 * Runs one scenario on both runtimes.
 *
 * @param {object} options
 * @param {number} options.frames how many frames to run
 * @param {number} options.seed shared RNG seed
 * @param {(frame:number)=>object} options.inputs per-frame input state
 * @param {(frame:number, side:{setWeapon,teleportPlayer,moveCrateTo})=>void} [options.script]
 *   scripted mutations applied identically to both sides, before the frame
 */
function runScenario({ frames, seed, inputs = () => ({}), script }) {
	const env = new FakeEnvironment({ startTime: 5000 });

	const oracle = createOracle({ env, random: mulberry32(seed), bundle });
	const startId = oracle.startArena();

	const subject = createSubject({ env, random: mulberry32(seed), bundle, startEntityId: startId });

	// Sample at PIXI's own render priority on both sides, so the comparison
	// sees exactly what a frame would have drawn.
	let oracleRender = null;
	let subjectRender = null;
	oracle.onRender(() => {
		oracleRender = snapshotOracleRender(oracle);
	});
	subject.onRender(() => {
		subjectRender = snapshotSubjectRender(subject.scene);
	});

	const problems = [];
	const t0 = env.now();

	/**
	 * Coverage counters. A green parity run only means something if the
	 * scenario actually reached the states it claims to test, so each test
	 * asserts on these rather than trusting its own name.
	 */
	const seen = {
		frames: 0,
		rendered: 0,
		hitstop: 0,
		enemiesSpawned: new Set(),
		enemiesKilled: new Set(),
		bats: 0,
		projectiles: 0,
		weapons: new Set(),
		attacksStarted: 0,
		grounded: 0,
		ceilingBonks: 0,
		wallHits: 0,
		maxScore: 0,
	};
	let lastAnimation = null;

	function observe(world) {
		++seen.frames;
		for (const entity of world.entities.values()) {
			if (entity.has('playerDamager')) seen.enemiesSpawned.add(entity.id);
			if (entity.has('flyingEnemy')) ++seen.bats;
			if (entity.has('throwable') && entity.has('velocity')) ++seen.projectiles;
			if (entity.has('health') && entity.health.value <= 0) seen.enemiesKilled.add(entity.id);
		}
		const player = world.player;
		if (player) {
			seen.maxScore = Math.max(seen.maxScore, player.playerController.score);
			if (player.mapCollider) {
				if (player.mapCollider.grounded) ++seen.grounded;
				if (player.mapCollider.topColliding) ++seen.ceilingBonks;
				if (player.mapCollider.leftColliding || player.mapCollider.rightColliding) ++seen.wallHits;
			}
			const weapon = player.has('boundEntity') ? world.get(player.boundEntity.id) : null;
			if (weapon && weapon.enemyDamager) seen.weapons.add(weapon.enemyDamager.name);
			if (weapon && weapon.animatedSprite) {
				const animation = weapon.animatedSprite.currentAnimation;
				if (animation === 'Attack' && lastAnimation !== 'Attack') ++seen.attacksStarted;
				lastAnimation = animation;
			}
		}
	}

	for (let frame = 0; frame < frames; ++frame) {
		const now = t0 + (frame + 1) * FRAME_MS;
		const state = inputs(frame);

		oracle.setInputs(state);
		subject.setInputs(state);

		if (script) {
			script(frame, oracle);
			script(frame, subject);
		}

		// Browser task-queue order: timers, then tickers, on each side.
		oracleRender = null;
		subjectRender = null;
		env.advanceTo(now);
		oracle.tick(now);
		subject.tick(now);

		const worldProblems = diff(snapshotOracleWorld(oracle), snapshotSubjectWorld(subject.world), `f${frame}.world`);
		problems.push(...worldProblems);

		if ((oracleRender === null) !== (subjectRender === null)) {
			problems.push(`f${frame}.render: one runtime rendered and the other did not (hitstop drift)`);
		} else if (oracleRender && subjectRender) {
			++seen.rendered;
			problems.push(...diff(oracleRender, subjectRender, `f${frame}.render`));
		} else {
			++seen.hitstop;
		}

		observe(subject.world);

		// Bail early: after a divergence every later frame is noise.
		if (problems.length > 0) break;
	}

	seen.restarts = subject.restarts;
	return { problems, seen, oracle, subject, env };
}

function expectParity(options, message) {
	const result = runScenario(options);
	assertNoDifferences(result.problems, message);
	return result.seen;
}

const HOLD = (state) => () => state;

describe('differential: movement and physics', () => {
	test('idle player falls, snaps to the platform and stays put', () => {
		const seen = expectParity({ frames: 240, seed: 1, inputs: HOLD({}) }, 'idle run diverged from the original');
		assert(seen.grounded > 0, 'player never touched the ground — scenario is vacuous');
		assert(seen.rendered === seen.frames, 'every frame should have rendered in an idle run');
	});

	test('running right into the wall matches, including the stale-x quirk', () => {
		const seen = expectParity(
			{ frames: 420, seed: 2, inputs: HOLD({ rightDown: true }) },
			'run-right diverged from the original',
		);
		assert(seen.wallHits > 0, 'player never reached a wall — scenario is vacuous');
	});

	test('running left into the wall matches', () => {
		const seen = expectParity(
			{ frames: 420, seed: 3, inputs: HOLD({ leftDown: true }) },
			'run-left diverged from the original',
		);
		assert(seen.wallHits > 0, 'player never reached a wall — scenario is vacuous');
	});

	test('alternating direction reproduces the weapon flicker frame-for-frame', () => {
		expectParity(
			{
				frames: 300,
				seed: 4,
				inputs: (frame) => (Math.floor(frame / 7) % 2 === 0 ? { rightDown: true } : { leftDown: true }),
			},
			'direction flipping diverged from the original',
		);
	});
});

describe('differential: jumping', () => {
	test('tapped jumps cut velocity exactly as the original does', () => {
		const seen = expectParity(
			{ frames: 360, seed: 5, inputs: (frame) => ({ jumpDown: frame % 40 === 0 }) },
			'tapped jump diverged from the original',
		);
		assert(seen.grounded > 0, 'player never landed, so it never jumped — scenario is vacuous');
	});

	test('held jumps ride the 170ms wall-clock hold window', () => {
		expectParity(
			{ frames: 360, seed: 6, inputs: (frame) => ({ jumpDown: frame % 60 < 25 }) },
			'held jump diverged from the original',
		);
	});

	test('jumping into a ceiling closes the hold window', () => {
		// Under the row-4 platform, holding jump bonks the ceiling every cycle.
		const seen = expectParity(
			{
				frames: 300,
				seed: 7,
				inputs: () => ({ jumpDown: true }),
				script: (frame, side) => {
					if (frame === 0) side.teleportPlayer(86, 60);
				},
			},
			'ceiling bonk diverged from the original',
		);
		assert(seen.ceilingBonks > 0, 'player never hit a ceiling — scenario is vacuous');
	});

	test('jumping while running matches', () => {
		expectParity(
			{ frames: 420, seed: 8, inputs: (frame) => ({ rightDown: true, jumpDown: frame % 35 < 12 }) },
			'run-jump diverged from the original',
		);
	});
});

describe('differential: collision edge cases', () => {
	/**
	 * Ordinary play never produces `velocity.y === 0` at map-collision time —
	 * gravity has always nudged it positive again by then — so the `>= 0` in
	 * the grounding test is unreachable without forcing it. These scenarios
	 * force it, which is what makes the inequality (and the 4px collision
	 * margin below) actually pinned by the suite rather than merely present.
	 */
	test('resting contact with zero vertical velocity grounds the player', () => {
		expectParity(
			{
				frames: 120,
				seed: 60,
				inputs: HOLD({}),
				script: (frame, side) => {
					if (frame < 30) return;
					// One pixel into the row-4 platform (top edge y = 32), with
					// vertical velocity exactly zero.
					side.setPlayerState({ x: 86, y: 25, vy: 0 });
				},
			},
			'zero-velocity grounding diverged from the original',
		);
	});

	test('a hitbox already inside a wall resolves at the original margin', () => {
		expectParity(
			{
				frames: 120,
				seed: 61,
				inputs: HOLD({}),
				script: (frame, side) => {
					if (frame < 20) return;
					// Left wall spans x 0..8; 4.5 sits inside the 4px margin
					// band but outside a 3px one, so the margin is observable.
					side.setPlayerState({ x: 4.5, y: 40, vx: 0 });
				},
			},
			'wall penetration resolution diverged from the original',
		);
	});

	test('deep ceiling penetration resolves identically', () => {
		expectParity(
			{
				frames: 120,
				seed: 62,
				inputs: HOLD({ jumpDown: true }),
				script: (frame, side) => {
					if (frame !== 25) return;
					// Punched up into the underside of the row-4 platform.
					side.setPlayerState({ x: 86, y: 37, vy: -4 });
				},
			},
			'ceiling penetration diverged from the original',
		);
	});
});

describe('differential: weapons', () => {
	const scenarios = [
		['sword', 300],
		['hammer', 300],
		['spear', 300],
		['shuriken', 360],
		['cannon', 420],
		['drill', 360],
	];

	for (const [weapon, frames] of scenarios) {
		test(`${weapon}: attack, recovery and projectiles match`, () => {
			const seen = expectParity(
				{
					frames,
					seed: 20,
					inputs: (frame) => ({ attackDown: frame % 30 < 18, rightDown: frame % 90 < 45 }),
					script: (f, side) => {
						if (f === 1) side.setWeapon(weapon);
					},
				},
				`${weapon} diverged from the original`,
			);
			assert(seen.weapons.has(weapon), `the ${weapon} was never actually equipped`);
			if (weapon === 'shuriken' || weapon === 'cannon') {
				assert(seen.projectiles > 0, `the ${weapon} never fired a projectile`);
			} else if (weapon !== 'drill') {
				assert(seen.attacksStarted > 0, `the ${weapon} never started an attack animation`);
			}
		});
	}

	test('attack held forever still respects animation-length recovery', () => {
		expectParity(
			{ frames: 300, seed: 21, inputs: HOLD({ attackDown: true }) },
			'held attack diverged from the original',
		);
	});
});

describe('differential: enemies', () => {
	test('spawning, wandering, pit re-entry and enrage all match', () => {
		// Long enough for the spawn delay to decay and for a burst window.
		const seen = expectParity(
			{ frames: 900, seed: 30, inputs: HOLD({}) },
			'enemy lifecycle diverged from the original',
		);
		assert(seen.enemiesSpawned.size >= 3, `only ${seen.enemiesSpawned.size} enemies spawned — scenario is thin`);
	});

	test('bat animation-driven hover pulse matches', () => {
		const seen = expectParity({ frames: 900, seed: 33, inputs: HOLD({}) }, 'bat behaviour diverged from the original');
		assert(seen.bats > 0, 'no bat ever spawned with this seed — pick another seed');
	});

	test('killing enemies reproduces knockback, tint and corpse cleanup', () => {
		const seen = expectParity(
			{
				frames: 900,
				seed: 32,
				inputs: (frame) => ({ attackDown: true, rightDown: frame % 120 < 60, leftDown: frame % 120 >= 60 }),
			},
			'combat diverged from the original',
		);
		assert(seen.enemiesKilled.size > 0, 'no enemy was ever killed — scenario is vacuous');
	});
});

describe('differential: crates and weapon swaps', () => {
	test('collecting a crate scores, re-rolls position and swaps weapon identically', () => {
		const seen = expectParity(
			{
				frames: 240,
				seed: 40,
				inputs: HOLD({}),
				script: (frame, side) => {
					// Park a crate on the player's resting tile repeatedly; each
					// pickup burns the same random draws on both sides.
					if (frame > 60 && frame % 45 === 0) side.moveCrateTo(86, 88);
				},
			},
			'crate pickup diverged from the original',
		);
		assert(seen.maxScore > 1, `score only reached ${seen.maxScore} — crates were not collected`);
		assert(seen.weapons.size > 1, 'the weapon never actually changed');
	});
});

describe('differential: death, hitstop and reset', () => {
	test('a full death -> hitstop -> restart cycle matches', () => {
		// The idle player is eventually caught; 1600ms later the arena rebuilds.
		const { problems, seen } = runScenario({ frames: 1500, seed: 50, inputs: HOLD({}) });
		assertNoDifferences(problems, 'death/restart cycle diverged from the original');
		assert(seen.restarts > 0, 'scenario never reached a death — it is not testing what it claims');
		assert(seen.hitstop > 0, 'hitstop never froze a frame, so the freeze path went untested');
	});
});
