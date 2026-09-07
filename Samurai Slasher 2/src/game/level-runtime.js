import * as C from '../world/components.js';
import { World } from '../world/world.js';
import { Container } from '../core/display.js';
import { crateLocations, levelById } from '../data/levels/index.js';
import { createCrate, createPlayer, createTouchButtons, createWeapon } from '../factories/factories.js';
import { paintLevelBackground } from './tile-art.js';
import { bossDef } from '../data/bosses.js';

/**
 * Builds a playable world for a level definition.
 *
 * This is the sequel's equivalent of the original `restart()`, and it is the
 * *only* place a level's entities are assembled — the play scene, the retry
 * path and the headless differential harness all call it, so what the tests
 * verify is exactly what ships.
 *
 * Construction order matters twice over: entity ids are handed out in this
 * order (and systems iterate in id order), and display children are added in
 * this order (which breaks zIndex ties at render time). Both match the
 * original's `restart()` exactly.
 */
export function createLevelWorld(services, level) {
	const world = new World({
		scene: services.scene || makeScene(),
		animationTicker: services.animationTicker,
		time: services.time,
		timers: services.timers,
		random: services.random,
		auxRandom: services.auxRandom,
		audio: services.audio,
		storage: services.storage,
		assets: services.assets,
		level,
		screen: services.screen,
	});

	world.scoreBook = services.scoreBook;
	world.input = services.input;
	world.touchControls = Boolean(services.touchControls);
	world.crateLocations = crateLocations(level);
	// The differential harness continues the oracle's entity counter so ids
	// line up 1:1; the game itself always starts a level at 0.
	if (services.startEntityId != null) world.seedEntityIds(services.startEntityId);

	populate(world);
	return world;
}

export function makeScene() {
	const scene = new Container();
	scene.sortableChildren = true;
	return scene;
}

/** Resolves a level's background art, painting derived art on first use. */
export function backgroundTexture(world, level) {
	const spec = level.background;
	if (spec.type === 'image') return world.assets.texture(spec.key);

	const cacheKey = `bg:${level.id}`;
	if (world.assets.textures.has(cacheKey)) return world.assets.textures.get(cacheKey);

	const reference = levelById(spec.source);
	const referenceImage = world.assets.image(reference.background.key);
	const texture = paintLevelBackground(level, reference, referenceImage);
	world.assets.textures.set(cacheKey, texture);
	return texture;
}

function populate(world) {
	const level = world.level;

	// 1. The map: art on top (zIndex 100, drawn over the actors) plus the
	//    collision mask everything else is resolved against.
	const map = world.create();
	map.add('sprite', new C.Sprite(backgroundTexture(world, level), world.scene, false));
	map.sprite.node.zIndex = level.background.zIndex;
	map.add('position', new C.Position(0, 0));
	map.add('tileCollisionMask', new C.TileCollisionMask(level.map, level.tileSize));
	world.register(map);

	// 2. The player.
	const player = world.register(createPlayer(world));

	// 3/4. HUD readouts. Drawn behind everything (zIndex -2), as before.
	const score = world.create();
	score.add('score', new C.Score());
	score.add('position', new C.Position(level.hud.score.x, level.hud.score.y));
	score.add('text', new C.Text('0', world.scene, { scale: level.hud.score.scale }));
	world.register(score);

	const highScore = world.create();
	highScore.add('highscore', new C.HighScore());
	highScore.add('position', new C.Position(level.hud.highScore.x, level.hud.highScore.y));
	highScore.add(
		'text',
		new C.Text(`hi:${world.scoreBook.highScore(level.id)}`, world.scene, {
			scale: level.hud.highScore.scale,
		}),
	);
	world.register(highScore);

	// 5. The crate.
	world.register(createCrate(world));

	// 6. The starting weapon, bound to the player.
	const sword = createWeapon(world, 'sword');
	player.add('boundEntity', new C.BoundEntity(sword.id));
	world.register(sword);

	// 7. The spawner.
	const spawner = world.create();
	spawner.add('position', new C.Position(level.spawner.x, level.spawner.y));
	spawner.add(
		'enemySpawner',
		new C.EnemySpawner(world.touchControls ? level.spawner.mobileDelay : level.spawner.delay, world.time),
	);
	world.register(spawner);

	// 8. Touch controls, when the device wants them.
	createTouchButtons(world);

	// 9. The boss encounter controller, only if this level declares one. The
	//    classic arena does not, so no arena entity ever carries a boss
	//    component and `bossSystem` returns on its first line.
	if (level.boss) {
		const encounter = world.create();
		encounter.add('bossEncounter', new C.BossEncounter(bossDef(level.boss.id), level.boss.trigger, world.time));
		world.register(encounter);
	}

	return world;
}
