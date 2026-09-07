import * as C from '../world/components.js';
import { BOSS_STATE, PATTERNS, TELEGRAPH_STYLE } from '../data/bosses.js';
import { createBoss, createEnemy, createHazard, createRectEntity, createTelegraph } from '../factories/factories.js';
import { pipeSpawnVectors } from '../data/levels/index.js';

// Inlined rather than imported from the shell's palette: a system must not
// depend on `src/game`.
const HUD_INK = '#e2a355';
const HUD_EDGE = '#3a3a52';
const HUD_FILL = '#c0344a';

/**
 * Boss encounters.
 *
 * Appended **after** `animation` — the only position in the pipeline that
 * leaves the original eight systems observing exactly what they observed
 * before. It returns immediately when the level declares no boss, so the
 * classic arena never executes a line of this file.
 *
 * The encounter is a state machine (see docs/bosses.md):
 *
 *   DORMANT → INTRO → ACTIVE ⇄ VULNERABLE → … → DEFEATED → CLEARED
 *                        ↓         ↓
 *                     PHASE_UP ────┘
 *
 * Damage in both directions reuses the ordinary damage system: the boss carries
 * `Health` and `PlayerDamager` like any enemy, and hazards are just bounds with
 * a `PlayerDamager`. Nothing here duplicates `damageCollisions`.
 *
 * All timing is wall-clock, like every other timer in the game.
 */
export function bossSystem(world) {
	const encounter = world.find('bossEncounter');
	if (!encounter) return;

	updateTelegraphs(world);
	updateHazards(world);

	const state = encounter.bossEncounter;
	switch (state.state) {
		case BOSS_STATE.DORMANT:
			tickDormant(world, state);
			break;
		case BOSS_STATE.INTRO:
			tickIntro(world, state);
			break;
		case BOSS_STATE.ACTIVE:
		case BOSS_STATE.VULNERABLE:
			tickFighting(world, state);
			break;
		case BOSS_STATE.PHASE_UP:
			tickPhaseUp(world, state);
			break;
		case BOSS_STATE.DEFEATED:
			tickDefeated(world, state);
			break;
		default:
			break;
	}

	updateHud(world, state);
}

// ------------------------------------------------------------------- states

function tickDormant(world, state) {
	if (!triggered(world, state)) return;
	enter(state, BOSS_STATE.INTRO);

	// The arena belongs to the boss now: stop the drip of ordinary enemies and
	// clear the ones already in play so the fight starts clean.
	suspendSpawning(world, state);
	flushEnemies(world);

	const boss = world.register(createBoss(world, state.def));
	state.bossId = boss.id;
	boss.bossBehavior.invulnerable = true;
	boss.animatedSprite.setAnimation('WindUp');
	boss.animatedSprite.node.alpha = 0;

	buildHud(world, state);
}

function tickIntro(world, state) {
	const boss = world.get(state.bossId);
	if (!boss) return;

	const progress = Math.min(1, state.stateClock.getElapsedTime() / state.def.introMs);
	boss.animatedSprite.node.alpha = progress;
	if (progress < 1) return;

	boss.animatedSprite.node.alpha = 1;
	boss.animatedSprite.setAnimation('Idle');
	// Contact damage and damageability both arrive with `playerDamager`.
	boss.add('playerDamager', new C.PlayerDamager(state.def.contactDamage));
	boss.bossBehavior.invulnerable = false;
	armour(boss, state.def);
	enter(state, BOSS_STATE.ACTIVE);
	beginCooldown(state, 600);
}

function tickFighting(world, state) {
	const boss = world.get(state.bossId);
	if (!boss) {
		enter(state, BOSS_STATE.CLEARED);
		return;
	}

	faceThePlayer(world, boss);

	// Death is resolved by `damageCollisions`, which strips `playerDamager`
	// when health runs out. Reading that is how the encounter learns it won.
	if (!boss.has('playerDamager')) {
		beginDefeat(world, state, boss);
		return;
	}

	if (state.state === BOSS_STATE.VULNERABLE) {
		if (state.stateClock.getElapsedTime() >= state.def.vulnerableMs) {
			armour(boss, state.def);
			boss.animatedSprite.setAnimation('Idle');
			enter(state, BOSS_STATE.ACTIVE);
			beginCooldown(state, 300);
		}
		// A stunned boss does not start new patterns.
		checkPhase(world, state, boss);
		return;
	}

	if (checkPhase(world, state, boss)) return;
	advancePattern(world, state, boss);
}

function tickPhaseUp(world, state) {
	const boss = world.get(state.bossId);
	if (!boss) {
		enter(state, BOSS_STATE.CLEARED);
		return;
	}
	if (state.stateClock.getElapsedTime() < state.def.phaseUpMs) return;

	const phase = state.def.phases[state.phaseIndex];
	boss.animatedSprite.node.tint = phase.tint;
	boss.animatedSprite.node.animationSpeed = state.def.animationSpeed * (phase.speedScale || 1);
	boss.animatedSprite.setAnimation('Idle');
	boss.add('playerDamager', new C.PlayerDamager(state.def.contactDamage));
	boss.bossBehavior.invulnerable = false;
	armour(boss, state.def);
	enter(state, BOSS_STATE.ACTIVE);
	beginCooldown(state, 400);
}

function tickDefeated(world, state) {
	// The encounter owns this, rather than leaning on the corpse-cleanup timer
	// `damageCollisions` schedules — that timer only exists when the boss died
	// through the damage system, and the collapse should look the same however
	// the fight ended.
	if (state.stateClock.getElapsedTime() < state.def.defeatMs) return;

	world.removeEntity(state.bossId);
	enter(state, BOSS_STATE.CLEARED);
	resumeSpawning(world, state);
	clearHud(world, state);
}

// ------------------------------------------------------------------ helpers

function enter(state, next) {
	state.state = next;
	state.stateClock.restart();
}

function triggered(world, state) {
	const trigger = state.trigger || { type: 'time', ms: 8000 };
	if (trigger.type === 'score') {
		const player = world.player;
		return Boolean(player) && player.playerController.score >= trigger.value;
	}
	return state.stateClock.getElapsedTime() >= trigger.ms;
}

/** Attacking: small armoured core. Stunned: the whole body. */
function armour(boss, def) {
	boss.bounds.vec.x = def.coreBounds.width;
	boss.bounds.vec.y = def.coreBounds.height;
	boss.bounds.offset.x = def.coreBounds.offsetX;
	boss.bounds.offset.y = def.coreBounds.offsetY;
}

function expose(boss, def) {
	boss.bounds.vec.x = def.bounds.width;
	boss.bounds.vec.y = def.bounds.height;
	boss.bounds.offset.x = def.bounds.offsetX;
	boss.bounds.offset.y = def.bounds.offsetY;
}

function faceThePlayer(world, boss) {
	const player = world.player;
	if (!player) return;
	boss.animatedSprite.node.scaleX = player.position.x < boss.position.x ? -1 : 1;
}

/** Returns true when a phase transition was started this frame. */
function checkPhase(world, state, boss) {
	const behavior = boss.bossBehavior;
	const fraction = boss.health.value / behavior.maxHealth;
	let target = state.phaseIndex;
	for (let i = state.phaseIndex + 1; i < state.def.phases.length; ++i) {
		if (fraction <= state.def.phases[i].at) target = i;
	}
	if (target === state.phaseIndex) return false;

	state.phaseIndex = target;
	behavior.phase = target;
	behavior.invulnerable = true;
	boss.remove('playerDamager');
	boss.animatedSprite.setAnimation('Hurt');
	cancelPattern(world, state);
	enter(state, BOSS_STATE.PHASE_UP);
	world.audio.play('damage');
	return true;
}

function beginDefeat(world, state, boss) {
	// `damageCollisions` flung it; a boss should collapse where it stood.
	boss.velocity.x = 0;
	boss.velocity.y = 0;
	boss.animatedSprite.setAnimation('Defeat');
	boss.animatedSprite.node.loop = false;
	boss.bossBehavior.invulnerable = true;
	cancelPattern(world, state);
	clearHazards(world);
	enter(state, BOSS_STATE.DEFEATED);
	world.hooks.freeze(250);
	world.audio.play('powerup');
}

// ----------------------------------------------------------------- patterns

function beginCooldown(state, ms) {
	state.patternPhase = 'cooldown';
	state.pattern = { cooldownMs: ms };
	state.patternClock.restart();
}

function cancelPattern(world, state) {
	state.patternPhase = 'idle';
	state.pattern = null;
	for (const entity of Array.from(world.each('telegraph'))) world.removeEntity(entity.id);
}

function advancePattern(world, state, boss) {
	const elapsed = state.patternClock.getElapsedTime();

	if (state.patternPhase === 'cooldown') {
		if (elapsed < state.pattern.cooldownMs) return;
		startPattern(world, state, boss);
		return;
	}

	if (state.patternPhase === 'windUp') {
		if (elapsed < state.pattern.windUpMs) return;
		firePattern(world, state, boss);
		return;
	}

	if (state.patternPhase === 'active') {
		if (elapsed < state.pattern.activeMs) return;
		boss.animatedSprite.setAnimation('Idle');
		if (state.pattern.endsVulnerable) {
			expose(boss, state.def);
			boss.animatedSprite.setAnimation('Hurt');
			enter(state, BOSS_STATE.VULNERABLE);
			state.patternPhase = 'idle';
			return;
		}
		beginCooldown(state, state.pattern.cooldownMs);
	}
}

function startPattern(world, state, boss) {
	const phase = state.def.phases[state.phaseIndex];
	const names = phase.patterns;
	state.patternIndex = (state.patternIndex + 1) % names.length;
	const pattern = PATTERNS[names[state.patternIndex]];
	state.pattern = { name: names[state.patternIndex], ...pattern };
	state.patternPhase = 'windUp';
	state.patternClock.restart();

	boss.animatedSprite.setAnimation('WindUp');

	// Mark where the attack will land, now, so the telegraph is honest: the
	// player can always walk out of it.
	const player = world.player;
	state.markX = player ? Math.round(player.position.x) : 88;
	state.markY = player ? Math.round(player.position.y) : state.def.floorY;

	if (pattern.telegraph) spawnTelegraph(world, state, boss, pattern);
}

function spawnTelegraph(world, state, boss, pattern) {
	const style = TELEGRAPH_STYLE[pattern.telegraph];
	const geometry = hazardGeometry(state, boss, pattern);
	createTelegraph(world, {
		kind: pattern.telegraph,
		ownerId: boss.id,
		windUpMs: pattern.windUpMs,
		x: geometry.x,
		y: geometry.y + Math.round((geometry.height - style.height) / 2),
		width: geometry.width,
		height: style.height,
		color: style.color,
	});
}

function hazardGeometry(state, boss, pattern) {
	const spec = pattern.hazard;
	if (!spec) return { x: 0, y: 0, width: 0, height: 0 };

	const width = spec.width;
	const height = spec.height;
	let x = 0;
	let y = 0;

	if (spec.anchor === 'floor') {
		x = 0;
		y = state.def.floorY + spec.offsetY;
	} else {
		// 'marked': centred on where the player was when the wind-up started.
		x = spec.width >= 176 ? 0 : Math.round(state.markX - width / 2);
		y = state.markY + spec.offsetY;
	}
	return { x, y, width, height };
}

function firePattern(world, state, boss) {
	const pattern = state.pattern;
	state.patternPhase = 'active';
	state.patternClock.restart();
	boss.animatedSprite.setAnimation('Attack');

	// The telegraph is destroyed here, and the hazard is created here — so the
	// warning is gone the moment the danger exists, never overlapping it.
	for (const entity of Array.from(world.each('telegraph'))) world.removeEntity(entity.id);

	if (pattern.summons) {
		summon(world, state, pattern.summons);
		world.audio.play('hit');
		return;
	}

	const geometry = hazardGeometry(state, boss, pattern);
	createHazard(world, {
		ownerId: boss.id,
		lifetimeMs: pattern.activeMs,
		x: geometry.x,
		y: geometry.y,
		width: geometry.width,
		height: geometry.height,
		color: TELEGRAPH_STYLE[pattern.telegraph].color,
	});
	world.audio.play('hit');
}

function summon(world, state, count) {
	const spawns = pipeSpawnVectors(world.level);
	for (let i = 0; i < count; ++i) {
		// Drawn from the auxiliary stream so the main one — which the parity
		// tests drive — is never disturbed.
		const type = Math.floor(world.auxRandom() * 2);
		const enemy = createEnemy(world, type);
		const spawn = spawns[i % spawns.length];
		enemy.position.vec = spawn.copy();
		enemy.velocity.y = 1;
		world.register(enemy);
	}
}

// ------------------------------------------------------- telegraphs/hazards

function updateTelegraphs(world) {
	for (const entity of world.each('telegraph', 'rect')) {
		const telegraph = entity.telegraph;
		const elapsed = telegraph.clock.getElapsedTime();
		const remaining = telegraph.windUpMs - elapsed;
		const style = TELEGRAPH_STYLE[telegraph.kind];

		// Blink through the wind-up, then hold solid for the last 150ms so the
		// commitment point is unmistakable.
		if (remaining <= 150) {
			entity.rect.node.visible = true;
			entity.rect.node.alpha = 1;
		} else {
			const phase = Math.floor(elapsed / style.blinkMs) % 2 === 0;
			entity.rect.node.visible = phase;
			entity.rect.node.alpha = 0.85;
		}
	}
}

function updateHazards(world) {
	for (const entity of Array.from(world.each('hazard'))) {
		if (entity.hazard.clock.getElapsedTime() >= entity.hazard.lifetimeMs) {
			world.removeEntity(entity.id);
		}
	}
}

function clearHazards(world) {
	for (const entity of Array.from(world.each('hazard'))) world.removeEntity(entity.id);
}

// -------------------------------------------------------------- arena state

function suspendSpawning(world, state) {
	const spawner = world.find('enemySpawner');
	if (!spawner) return;
	state.spawnerId = spawner.id;
	state.spawnerDelay = spawner.enemySpawner.spawnDelay;
	spawner.remove('enemySpawner');
}

function resumeSpawning(world, state) {
	if (state.spawnerId === null) return;
	const spawner = world.get(state.spawnerId);
	if (!spawner || spawner.has('enemySpawner')) return;
	spawner.add('enemySpawner', new C.EnemySpawner(state.spawnerDelay, world.time));
}

function flushEnemies(world) {
	for (const entity of Array.from(world.each('enemyBehavior'))) world.removeEntity(entity.id);
}

// ---------------------------------------------------------------------- HUD

const HUD_BAR = { x: 24, y: 12, width: 128, height: 4 };

function buildHud(world, state) {
	const name = world.create();
	name.add('position', new C.Position(88, 6));
	name.add('text', new C.Text(state.def.name, world.scene, { color: HUD_INK, zIndex: 900 }));
	world.register(name);

	const back = createRectEntity(world, {
		x: HUD_BAR.x - 1,
		y: HUD_BAR.y - 1,
		width: HUD_BAR.width + 2,
		height: HUD_BAR.height + 2,
		color: HUD_EDGE,
		zIndex: 900,
	});
	world.register(back);

	const fill = createRectEntity(world, {
		x: HUD_BAR.x,
		y: HUD_BAR.y,
		width: HUD_BAR.width,
		height: HUD_BAR.height,
		color: HUD_FILL,
		zIndex: 901,
	});
	world.register(fill);

	state.hudIds = [name.id, back.id, fill.id];
	state.hudFillId = fill.id;
}

function updateHud(world, state) {
	if (state.hudFillId === undefined) return;
	const fill = world.get(state.hudFillId);
	if (!fill) return;
	const boss = world.get(state.bossId);
	const fraction = boss ? Math.max(0, boss.health.value) / boss.bossBehavior.maxHealth : 0;
	fill.rect.node.rectWidth = Math.max(0, Math.round(HUD_BAR.width * fraction));
}

function clearHud(world, state) {
	for (const id of state.hudIds) world.removeEntity(id);
	state.hudIds = [];
	state.hudFillId = undefined;
}
