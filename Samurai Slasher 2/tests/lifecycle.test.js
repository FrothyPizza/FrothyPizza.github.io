import { describe, test, assert, assertEqual } from './framework.js';
import { FRAME_MS, FakeEnvironment } from './harness/fake-env.js';
import { loadNodeAssets } from './harness/node-assets.js';
import { createSubject } from './harness/subject.js';
import { createOracle } from './harness/oracle.js';
import { mulberry32 } from '../src/core/rng.js';
import { pipeworks } from '../src/data/levels/pipeworks.js';

/**
 * Lifecycle: the defects the refactor was allowed to fix.
 *
 * The original leaked in three ways — every `AnimatedSprite` stayed attached to
 * PIXI's shared ticker forever, every `setTimeout` survived a restart, and a
 * dead run's callbacks could mutate the next one. None of that is observable
 * during a live run (which is why the differential suite still passes), but all
 * of it is observable after teardown, which is what these tests check.
 */

const bundle = loadNodeAssets();

function run(subject, env, frames, inputs = () => ({})) {
	const t0 = env.now();
	for (let i = 0; i < frames; ++i) {
		const now = t0 + (i + 1) * FRAME_MS;
		subject.setInputs(inputs(i));
		env.advanceTo(now);
		subject.tick(now);
	}
}

describe('lifecycle: teardown', () => {
	test('destroying a world detaches every sprite from the animation ticker', () => {
		const env = new FakeEnvironment({ startTime: 1000 });
		const subject = createSubject({ env, random: mulberry32(7), bundle });
		run(subject, env, 300);

		const attachedDuringPlay = subject.driver.animation.count;
		assert(attachedDuringPlay > 0, 'sprites should be attached while playing');

		subject.world.destroy();
		assertEqual(subject.driver.animation.count, 0, 'no sprite may outlive its world on the shared ticker');
	});

	test('destroying a world empties its display list', () => {
		const env = new FakeEnvironment({ startTime: 1000 });
		const subject = createSubject({ env, random: mulberry32(8), bundle });
		run(subject, env, 300);

		assert(subject.scene.children.length > 0, 'scene should be populated');
		const scene = subject.scene;
		subject.world.destroy();
		assertEqual(scene.children.length, 0, 'every display node is released');
	});

	test('destroying a world cancels its pending callbacks', () => {
		const env = new FakeEnvironment({ startTime: 1000 });
		const subject = createSubject({ env, random: mulberry32(9), bundle });
		// Long enough for corpse-cleanup and projectile-expiry timers to queue.
		run(subject, env, 600, () => ({ attackDown: true }));

		subject.world.destroy();
		assertEqual(subject.world.timers.pending, 0, 'no callback survives teardown');
	});

	test('a restart does not let the previous run mutate the new one', () => {
		const env = new FakeEnvironment({ startTime: 1000 });
		const subject = createSubject({ env, random: mulberry32(10), bundle });
		run(subject, env, 1500);
		assert(subject.restarts > 0, 'the run must actually have died for this to mean anything');

		const world = subject.world;
		const player = world.player;
		assert(player, 'the rebuilt world has a live player');

		// Drain a couple of seconds. Anything the dead run left behind would
		// land in this window.
		const before = subject.world.entities.size;
		run(subject, env, 120);
		assert(
			subject.world.player !== undefined,
			'a stale restart callback must not have torn down the fresh run',
		);
		assert(subject.world.entities.size >= before - 6, 'entity population stayed sane after the restart');
	});
});

describe('lifecycle: the original leaked where the sequel does not', () => {
	test('the original keeps sprites on the shared ticker after a restart; the sequel does not', () => {
		const env = new FakeEnvironment({ startTime: 1000 });
		const oracle = createOracle({ env, random: mulberry32(11), bundle });
		oracle.startArena();
		const t0 = env.now();
		for (let i = 0; i < 300; ++i) {
			const now = t0 + (i + 1) * FRAME_MS;
			env.advanceTo(now);
			oracle.tick(now);
		}
		const before = oracle.sharedTicker.count;

		// The original's restart clears entities but never detaches sprites.
		oracle.startArena();
		const after = oracle.sharedTicker.count;
		assert(after > before, `original leaks sprites across restart (${before} -> ${after})`);

		const env2 = new FakeEnvironment({ startTime: 1000 });
		const subject = createSubject({ env: env2, random: mulberry32(11), bundle });
		run(subject, env2, 300);
		subject.world.hooks.restart();

		// The precise property: after a restart the shared ticker holds exactly
		// the sprites the live world owns — no orphans from the dead run.
		let live = 0;
		for (const entity of subject.world.entities.values()) if (entity.has('animatedSprite')) ++live;
		assertEqual(
			subject.driver.animation.count,
			live,
			'the sequel leaves no orphaned sprites attached after a restart',
		);
	});
});

describe('lifecycle: a second level runs on the same machinery', () => {
	test('pipeworks builds, runs and tears down cleanly', () => {
		const env = new FakeEnvironment({ startTime: 1000 });
		const subject = createSubject({ env, random: mulberry32(12), bundle, level: pipeworks });

		assertEqual(subject.world.level.id, 'pipeworks', 'the level registry drove the build');
		run(subject, env, 600, (frame) => ({ rightDown: frame % 60 < 30, jumpDown: frame % 40 < 8 }));

		const player = subject.world.player;
		assert(player, 'player survived 600 frames of pipeworks');
		assert(
			player.position.y > 0 && player.position.y < 200,
			`player stayed inside the arena (y=${player.position.y})`,
		);

		let enemies = 0;
		for (const entity of subject.world.entities.values()) if (entity.has('playerDamager')) ++enemies;
		assert(enemies > 0, 'the second level spawns enemies through the shared spawner');

		subject.world.destroy();
		assertEqual(subject.driver.animation.count, 0, 'teardown is level-agnostic');
	});
});
