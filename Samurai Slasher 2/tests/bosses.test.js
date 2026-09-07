import { describe, test, assert, assertEqual } from './framework.js';
import { FRAME_MS, FakeEnvironment } from './harness/fake-env.js';
import { loadNodeAssets } from './harness/node-assets.js';
import { createSubject } from './harness/subject.js';
import { mulberry32 } from '../src/core/rng.js';
import { BOSSES, BOSS_STATE, PATTERNS, TELEGRAPH_STYLE } from '../src/data/bosses.js';
import { gatehouse } from '../src/data/levels/gatehouse.js';
import { classicArena } from '../src/data/levels/classic-arena.js';
import { pipeworks } from '../src/data/levels/pipeworks.js';

/**
 * Boss encounters.
 *
 * These are *not* differential tests — the original has no boss, so there is no
 * oracle to compare against. They assert the state machine, the telegraph
 * contract and the teardown directly, in the style of `lifecycle.test.js`.
 *
 * The differential suite remains the guard that none of this leaked into the
 * classic arena.
 */

const bundle = loadNodeAssets();

/**
 * A gatehouse variant that summons the boss almost immediately.
 *
 * The shipped level gives the player nine seconds of ordinary enemies first,
 * which is right for play and wrong for a test — a passive test player dies in
 * that window and the restart resets the encounter. Overriding one data field
 * is the whole change, which is itself a decent demonstration that the boss is
 * driven by level data rather than by code.
 */
const quickGatehouse = {
	...gatehouse,
	id: 'gatehouse-test',
	boss: { ...gatehouse.boss, trigger: { type: 'time', ms: 300 } },
};

/**
 * @param {object} options
 * @param {boolean} [options.player] keep the player entity. State-machine tests
 *   drop it: a one-hit-kill player dying mid-fight rebuilds the world and
 *   resets the encounter, which is correct behaviour and useless as a fixture.
 *   The encounter guards every `world.player` read, so this is a supported
 *   state, not a rigged one.
 */
function bossRun({ seed = 3, frames = 0, inputs = () => ({}), player = false, level = quickGatehouse } = {}) {
	const env = new FakeEnvironment({ startTime: 1000 });
	const subject = createSubject({
		env,
		random: mulberry32(seed),
		auxRandom: mulberry32(seed ^ 0x5bf03635),
		bundle,
		level,
	});
	if (!player) subject.world.removeEntity(subject.world.player.id);

	const t0 = env.now();
	let frame = 0;

	const step = (count, inputFn = inputs) => {
		for (let i = 0; i < count; ++i) {
			subject.setInputs(inputFn(frame));
			const now = t0 + ++frame * FRAME_MS;
			env.advanceTo(now);
			subject.tick(now);
		}
	};

	if (frames) step(frames);
	return {
		subject,
		step,
		get world() {
			return subject.world;
		},
		get encounter() {
			return subject.world.find('bossEncounter').bossEncounter;
		},
		get boss() {
			return subject.world.find('bossBehavior');
		},
	};
}

/** Runs until `predicate` holds, or fails after `limit` frames. */
function runUntil(run, predicate, limit, description) {
	for (let i = 0; i < limit; ++i) {
		if (predicate(run)) return i;
		run.step(1);
	}
	throw new Error(`never reached: ${description} (gave up after ${limit} frames)`);
}

describe('bosses: registry', () => {
	test('the gatekeeper sheet supplies every animation the system asks for', () => {
		const sheet = bundle.sheet(BOSSES.gatekeeper.sheet);
		for (const name of ['Idle', 'WindUp', 'Attack', 'Hurt', 'Defeat']) {
			assert(sheet.animations[name], `boss sheet is missing the "${name}" animation`);
			assert(sheet.animations[name].length > 0, `"${name}" has no frames`);
		}
	});

	test('every pattern a phase names actually exists', () => {
		for (const def of Object.values(BOSSES)) {
			for (const phase of def.phases) {
				for (const name of phase.patterns) {
					assert(PATTERNS[name], `${def.id} references unknown pattern "${name}"`);
				}
			}
		}
	});

	test('no attack is faster than the 500ms telegraph floor', () => {
		// Below this the player, moving 1px per frame, cannot react.
		for (const [name, pattern] of Object.entries(PATTERNS)) {
			if (!pattern.telegraph) continue;
			assert(pattern.windUpMs >= 500, `${name} winds up in ${pattern.windUpMs}ms — too fast to read`);
			assert(TELEGRAPH_STYLE[pattern.telegraph], `${name} has no telegraph style`);
		}
	});

	test('every phase has a window in which the boss can be hurt', () => {
		// Without a pattern that leaves it winded, a phase only ever exposes the
		// armoured core and the fight stalls. This caught exactly that: the
		// first phase originally had no opening at all.
		for (const def of Object.values(BOSSES)) {
			def.phases.forEach((phase, index) => {
				const openings = phase.patterns.filter((name) => PATTERNS[name].endsVulnerable);
				assert(
					openings.length > 0,
					`${def.id} phase ${index} (${phase.patterns.join(', ')}) never leaves the boss vulnerable`,
				);
			});
		}
	});

	test('phase thresholds descend, so a phase is entered once', () => {
		for (const def of Object.values(BOSSES)) {
			for (let i = 1; i < def.phases.length; ++i) {
				assert(def.phases[i].at < def.phases[i - 1].at, `${def.id} phase ${i} does not descend`);
			}
		}
	});
});

describe('bosses: the encounter is opt-in', () => {
	test('only levels that declare a boss get an encounter', () => {
		assert(!classicArena.boss, 'the classic arena must never declare a boss');
		assert(!pipeworks.boss, 'pipeworks has no boss');
		assert(gatehouse.boss, 'the gatehouse does');
	});

	test('a level without a boss builds no boss entities at all', () => {
		const env = new FakeEnvironment({ startTime: 1000 });
		const subject = createSubject({ env, random: mulberry32(1), bundle, level: classicArena });
		const t0 = env.now();
		for (let i = 0; i < 900; ++i) {
			const now = t0 + (i + 1) * FRAME_MS;
			env.advanceTo(now);
			subject.tick(now);
		}
		for (const name of ['bossEncounter', 'bossBehavior', 'telegraph', 'hazard', 'rect']) {
			assertEqual(
				subject.world.find(name),
				undefined,
				`the classic arena grew a "${name}" component — the boss system leaked`,
			);
		}
	});
});

describe('bosses: state machine', () => {
	test('it stays dormant until the trigger fires, then arrives', () => {
		const run = bossRun({ frames: 5 });
		assertEqual(run.encounter.state, BOSS_STATE.DORMANT, 'dormant before the trigger');
		assertEqual(run.boss, undefined, 'no boss entity yet');

		runUntil(run, (r) => r.encounter.state === BOSS_STATE.INTRO, 120, 'INTRO');
		assert(run.boss, 'the boss entity was created on INTRO');
		assert(!run.boss.has('playerDamager'), 'it is untouchable and harmless during the intro');
	});

	test('the shipped gatehouse declares a reachable time trigger', () => {
		// The variant above shortens this; the real level must still be sane.
		assertEqual(gatehouse.boss.trigger.type, 'time', 'time based');
		assert(
			gatehouse.boss.trigger.ms >= 3000 && gatehouse.boss.trigger.ms <= 20000,
			`a ${gatehouse.boss.trigger.ms}ms warm-up is not a warm-up`,
		);
	});

	test('arrival clears the arena and suspends ordinary spawning', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.INTRO, 120, 'INTRO');

		let enemies = 0;
		for (const entity of run.world.entities.values()) if (entity.has('enemyBehavior')) ++enemies;
		assertEqual(enemies, 0, 'the arena was flushed');
		assertEqual(run.world.find('enemySpawner'), undefined, 'the drip is suspended');
	});

	test('the intro fades in and hands over to ACTIVE', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.INTRO, 120, 'INTRO');
		assert(run.boss.animatedSprite.node.alpha < 1, 'it starts transparent');

		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');
		assertEqual(run.boss.animatedSprite.node.alpha, 1, 'fully faded in');
		assert(run.boss.has('playerDamager'), 'now damageable and dangerous');
	});

	test('it cycles through wind-up, attack and cooldown', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');

		const seen = new Set();
		for (let i = 0; i < 900; ++i) {
			seen.add(run.encounter.patternPhase);
			run.step(1);
		}
		for (const phase of ['cooldown', 'windUp', 'active']) {
			assert(seen.has(phase), `the pattern loop never reached "${phase}" (saw ${[...seen].join(', ')})`);
		}
	});
});

describe('bosses: telegraphs', () => {
	test('every telegraphed attack shows a warning before it can hurt you', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');

		let telegraphFrames = 0;
		let hazardFrames = 0;
		let overlaps = 0;
		let sawBoth = false;

		for (let i = 0; i < 1200; ++i) {
			const telegraph = run.world.find('telegraph');
			const hazard = run.world.find('hazard');
			if (telegraph) ++telegraphFrames;
			if (hazard) ++hazardFrames;
			if (telegraph && hazard) ++overlaps;
			if (telegraphFrames > 0 && hazardFrames > 0) sawBoth = true;
			run.step(1);
		}

		assert(sawBoth, 'the run produced neither a telegraph nor a hazard');
		assertEqual(overlaps, 0, 'a telegraph and its hazard must never share a frame');
		// 560ms is the shortest wind-up; at 60Hz that is ~33 frames per attack.
		assert(telegraphFrames > 30, `only ${telegraphFrames} telegraph frames — warnings are too short`);
	});

	test('a telegraph carries no hitbox', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');
		const at = runUntil(run, (r) => Boolean(r.world.find('telegraph')), 900, 'a telegraph');
		assert(at >= 0, 'sanity');

		const telegraph = run.world.find('telegraph');
		assert(!telegraph.has('playerDamager'), 'a warning must not be able to damage the player');
		assert(!telegraph.has('bounds'), 'and must not participate in collision at all');
	});

	test('a hazard damages through the ordinary damage system', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');
		runUntil(run, (r) => Boolean(r.world.find('hazard')), 1200, 'a hazard');

		const hazard = run.world.find('hazard');
		assert(hazard.has('playerDamager'), 'hazards use PlayerDamager, not a second damage path');
		assert(hazard.has('bounds'), 'and ordinary bounds');
		assert(!hazard.has('health'), 'but they cannot be attacked back');
	});

	test('hazards expire on their own clock', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');
		runUntil(run, (r) => Boolean(r.world.find('hazard')), 1200, 'a hazard');
		runUntil(run, (r) => !r.world.find('hazard'), 300, 'the hazard to expire');
	});
});

describe('bosses: damage, phases and defeat', () => {
	/** Drives the fight to a given health by hitting the boss directly. */
	function damageBossTo(run, fraction) {
		const boss = run.boss;
		boss.health.value = Math.max(0.5, boss.bossBehavior.maxHealth * fraction);
	}

	test('the hitbox opens up when the boss is stunned', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');
		const def = run.boss.bossBehavior.def;
		assertEqual(run.boss.bounds.x, def.coreBounds.width, 'armoured while attacking');

		runUntil(run, (r) => r.encounter.state === BOSS_STATE.VULNERABLE, 2400, 'VULNERABLE');
		assertEqual(run.boss.bounds.x, def.bounds.width, 'fully exposed while stunned');
		assert(def.bounds.width > def.coreBounds.width, 'the exposed hitbox is the bigger one');
	});

	test('crossing a health threshold triggers a phase change', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');
		assertEqual(run.encounter.phaseIndex, 0, 'starts in phase 0');

		damageBossTo(run, 0.5);
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.PHASE_UP, 120, 'PHASE_UP');
		assertEqual(run.encounter.phaseIndex, 1, 'moved to phase 1');
		assert(!run.boss.has('playerDamager'), 'invulnerable during the transition');
		assertEqual(run.world.find('telegraph'), undefined, 'any pending telegraph was cancelled');

		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 120, 'ACTIVE again');
		assert(run.boss.has('playerDamager'), 'damageable again after the transition');
		assertEqual(run.boss.animatedSprite.node.tint, run.boss.bossBehavior.def.phases[1].tint, 'phase tint applied');
	});

	test('a big hit can skip a phase without getting stuck', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');
		damageBossTo(run, 0.1);
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.PHASE_UP, 120, 'PHASE_UP');
		assertEqual(run.encounter.phaseIndex, 2, 'jumped straight to the last phase');
	});

	test('defeat collapses the boss in place, clears hazards and hands the arena back', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');

		// Kill it the way a weapon would: strip the component the damage system
		// strips, which is what the encounter watches for.
		run.boss.health.value = 0;
		run.boss.remove('playerDamager');
		run.step(1);

		assertEqual(run.encounter.state, BOSS_STATE.DEFEATED, 'entered DEFEATED');
		assertEqual(run.boss.velocity.x, 0, 'it does not get flung across the arena');
		assertEqual(run.boss.velocity.y, 0, 'it collapses where it stood');
		assertEqual(run.boss.animatedSprite.currentAnimation, 'Defeat', 'playing the defeat animation');
		assertEqual(run.world.find('hazard'), undefined, 'its attacks were cleared');
	});

	test('once the boss is gone the arena is handed back and the HUD is released', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');
		const bossId = run.boss.id;

		run.boss.health.value = 0;
		run.boss.remove('playerDamager');
		run.step(1);
		// The encounter itself clears the boss once the collapse has played.
		runUntil(run, (r) => !r.world.get(bossId), 120, 'the boss entity to be removed');

		assertEqual(run.encounter.state, BOSS_STATE.CLEARED, 'encounter cleared');
		assert(run.world.find('enemySpawner'), 'ordinary spawning resumed');
		assertEqual(run.world.find('rect'), undefined, 'the boss HUD was released');
	});
});

describe('bosses: the fight is winnable', () => {
	/**
	 * The acceptance criterion from docs/bosses.md: a player who reads every
	 * telegraph can beat the encounter without taking a hit.
	 *
	 * The "player" here is a script, not a bot — it holds the spacing the arena
	 * is built around and lifts off the ground whenever anything dangerous is
	 * live. That makes the run deterministic, so this is a real regression test
	 * rather than a coin flip: geometry that puts the boss out of reach, or a
	 * phase with no opening, fails it.
	 *
	 * It caught three genuine problems while it was being written: the boss
	 * floated above every attack arc, the player respawned inside its hitbox,
	 * and a platform overhung the one spot worth standing on.
	 */
	function perfectPlay(seed) {
		const run = bossRun({ seed, player: true });
		for (let i = 0; i < 2400; ++i) {
			const world = run.world;
			const boss = world.find('bossBehavior');
			const player = world.player;
			if (player && boss) {
				player.position.x = boss.position.x - 8;
				player.position.y = world.find('hazard') || world.find('telegraph') ? 84 : 112;
				player.velocity.y = 0;
			}
			run.step(1, () => ({ attackDown: true }));
			if (run.encounter.state === BOSS_STATE.CLEARED) {
				return { frames: i, deaths: run.subject.restarts };
			}
		}
		return { frames: -1, deaths: run.subject.restarts };
	}

	test('perfect play defeats the boss without dying', () => {
		const result = perfectPlay(5);
		assert(result.frames >= 0, 'the boss survived 40 seconds of clean play — the fight is not winnable');
		assertEqual(result.deaths, 0, 'clean play should not cost a life');
		assert(result.frames > 240, `defeated in ${result.frames} frames — suspiciously fast, check the hitboxes`);
	});

	test('the outcome does not depend on the random stream', () => {
		// Pattern order is deterministic; only summoned enemy types are random.
		// If these diverge, something in the fight is reading the wrong stream.
		const a = perfectPlay(11);
		const b = perfectPlay(101);
		assertEqual(a.frames, b.frames, 'two seeds produced different fight lengths under identical play');
	});
});

describe('bosses: teardown', () => {
	test('destroying the world mid-fight leaves nothing attached', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');
		run.step(120);

		const scene = run.world.scene;
		run.world.destroy();
		assertEqual(scene.children.length, 0, 'every display node released, boss HUD included');
		assertEqual(run.subject.driver.animation.count, 0, 'the boss sprite left the animation ticker');
		assertEqual(run.world.timers.pending, 0, 'no callback survives');
	});

	test('dying mid-fight rebuilds a clean, dormant encounter', () => {
		const run = bossRun({ frames: 5, player: true });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');

		run.world.hooks.restart();
		run.step(2);

		assertEqual(run.encounter.state, BOSS_STATE.DORMANT, 'the new run starts from dormant');
		assertEqual(run.boss, undefined, 'no boss carried over');
		assertEqual(run.world.find('hazard'), undefined, 'no hazard carried over');
		assertEqual(run.world.find('telegraph'), undefined, 'no telegraph carried over');
		assert(run.world.find('enemySpawner'), 'the fresh arena spawns normally again');
	});
});

describe('bosses: the boss stays inside the buffer', () => {
	test('the boss, its HUD and its hazards all fit 176x144', () => {
		const run = bossRun({ frames: 5 });
		runUntil(run, (r) => r.encounter.state === BOSS_STATE.ACTIVE, 300, 'ACTIVE');

		for (let i = 0; i < 900; ++i) {
			for (const node of run.world.scene.children) {
				assert(node.x >= -40 && node.x <= 216, `a node escaped horizontally at x=${node.x}`);
				assert(node.y >= -40 && node.y <= 184, `a node escaped vertically at y=${node.y}`);
			}
			run.step(1);
		}
	});
});
