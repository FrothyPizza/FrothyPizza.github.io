import { createEnemy } from '../factories/factories.js';
import { TYPE_ROLL } from '../data/enemies.js';

/**
 * Wall-clock enemy spawning, transcribed from `Systems/enemySpawner.js`.
 *
 * The cadence tightens by `decayPerSpawn` every spawn down to `minDelay`, and
 * a lucky roll drops `tempSpawnDelay` to `burstDelay` for `burstDuration` ms —
 * the "wave" that makes the arena spike. All of it is level data now
 * (`level.spawner`), with the arena carrying the original numbers.
 *
 * The RNG call *order* is part of the contract: burst-type roll (guarded by
 * the short-circuit on `tempSpawnDelay === spawnDelay`), then up to two type
 * rolls, then the burst roll, then the enemy's own facing roll inside the
 * factory. The differential tests drive both runtimes from one seeded stream,
 * so any reordering shows up immediately.
 */
export function enemySpawner(world) {
	const tuning = world.level.spawner;

	for (const entity of world.each('position', 'enemySpawner')) {
		const spawner = entity.enemySpawner;

		if (
			spawner.spawnTimer.getElapsedTime() > spawner.spawnDelay ||
			spawner.spawnTimer.getElapsedTime() > spawner.tempSpawnDelay
		) {
			spawner.spawnTimer.restart();

			if (spawner.spawnDelay > tuning.minDelay) {
				spawner.spawnDelay -= tuning.decayPerSpawn;
				spawner.tempSpawnDelay -= tuning.decayPerSpawn;
			}

			let type = 0;
			if (spawner.tempSpawnDelay === spawner.spawnDelay && world.random() > tuning.bigEnemyChance) {
				if (world.random() > TYPE_ROLL.brute) type = 1;
				else if (world.random() > TYPE_ROLL.bat) type = 2;
				else type = 3;
			}

			if (world.random() > tuning.burstChance) {
				spawner.tempSpawnDelay = tuning.burstDelay;
				world.timers.after(tuning.burstDuration, () => {
					spawner.tempSpawnDelay = spawner.spawnDelay;
				});
			}

			const enemy = createEnemy(world, type);
			enemy.position.vec = entity.position.vec.copy();
			enemy.velocity.y = 1;
			world.register(enemy);
		}
	}
}
