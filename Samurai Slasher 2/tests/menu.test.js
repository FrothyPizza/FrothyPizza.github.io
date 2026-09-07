import { describe, test, assert, assertEqual } from './framework.js';
import { loadNodeAssets } from './harness/node-assets.js';
import { createShell } from './harness/shell.js';
import { MENU_ACTIONS } from '../src/core/input.js';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../src/core/renderer.js';
import { Menu } from '../src/game/ui.js';
import { TitleScene } from '../src/game/scenes/title-scene.js';
import { LevelSelectScene } from '../src/game/scenes/level-select-scene.js';
import { PlayScene } from '../src/game/scenes/play-scene.js';
import { allLevels } from '../src/data/levels/index.js';

const bundle = loadNodeAssets();

/**
 * Menus are part of the game, not a layer on top of it: they are display nodes
 * inside the same 176x144 buffer, driven by the same frame loop. That makes the
 * whole flow testable headlessly, which is what these tests do.
 */
describe('menu: selection model', () => {
	test('navigation wraps in both directions', () => {
		const menu = new Menu([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);
		assertEqual(menu.current.label, 'A', 'starts at the top');
		menu.move(1);
		menu.move(1);
		assertEqual(menu.current.label, 'C', 'moves down');
		menu.move(1);
		assertEqual(menu.current.label, 'A', 'wraps past the bottom');
		menu.move(-1);
		assertEqual(menu.current.label, 'C', 'wraps past the top');
	});

	test('a pointer inside a row selects and activates it', () => {
		const menu = new Menu([{ label: 'A' }, { label: 'B' }]);
		menu.registerRow(0, 60, 12);
		menu.registerRow(1, 72, 12);

		const input = { consume: (a) => a === MENU_ACTIONS.CONFIRM, pointer: { x: 88, y: 75 } };
		const chosen = menu.handle(input);
		assertEqual(chosen.label, 'B', 'the tapped row is chosen');
		assertEqual(input.pointer, null, 'the pointer is consumed so it cannot double-fire');
	});

	test('a pointer outside every row does not activate anything', () => {
		const menu = new Menu([{ label: 'A' }, { label: 'B' }]);
		menu.registerRow(0, 60, 12);
		const input = { consume: (a) => a === MENU_ACTIONS.CONFIRM, pointer: { x: 88, y: 5 } };
		assertEqual(menu.handle(input), null, 'a stray tap is ignored');
	});
});

describe('menu: scene flow', () => {
	test('the game boots into the title screen', () => {
		const shell = createShell({ assets: bundle });
		shell.game.showTitle();
		shell.run(2);

		assert(shell.game.scene instanceof TitleScene, 'title scene is active');
		const labels = shell.labels();
		assert(
			labels.some((l) => l.includes('PLAY')),
			`expected a PLAY entry, saw ${JSON.stringify(labels)}`,
		);
	});

	test('title -> level select -> play -> title round-trips cleanly', () => {
		const shell = createShell({ assets: bundle });
		shell.game.showTitle();
		shell.run(1);

		// Down to LEVELS, confirm.
		shell.press(MENU_ACTIONS.DOWN);
		shell.run(1);
		shell.press(MENU_ACTIONS.CONFIRM);
		shell.run(1);
		assert(shell.game.scene instanceof LevelSelectScene, 'level select opened');

		// Confirm the highlighted level.
		shell.press(MENU_ACTIONS.CONFIRM);
		shell.run(1);
		assert(shell.game.scene instanceof PlayScene, 'a level started');
		assert(shell.game.scene.world, 'the play scene built a world');

		// Pause, then walk down to TITLE and confirm.
		shell.press(MENU_ACTIONS.PAUSE);
		shell.run(1);
		assert(shell.game.scene.paused, 'the game paused');

		for (let i = 0; i < 3; ++i) {
			shell.press(MENU_ACTIONS.DOWN);
			shell.run(1);
		}
		shell.press(MENU_ACTIONS.CONFIRM);
		shell.run(1);
		assert(shell.game.scene instanceof TitleScene, 'returned to the title');
	});

	test('level select lists every registered level with its best score', () => {
		const shell = createShell({ assets: bundle });
		shell.game.scoreBook.submit('arena', 42);
		shell.game.showLevelSelect();
		shell.run(1);

		const labels = shell.labels().join(' | ');
		for (const level of allLevels()) {
			assert(labels.includes(level.name), `"${level.name}" is missing from the level select`);
		}
		assert(labels.includes('BEST 42'), `the arena best score is missing: ${labels}`);
	});

	test('back from level select returns to the title', () => {
		const shell = createShell({ assets: bundle });
		shell.game.showLevelSelect();
		shell.run(1);
		shell.press(MENU_ACTIONS.BACK);
		shell.run(1);
		assert(shell.game.scene instanceof TitleScene, 'BACK returns to the title');
	});

	test('the chosen level is remembered for the next PLAY', () => {
		const shell = createShell({ assets: bundle });
		shell.game.playLevel('pipeworks');
		shell.run(1);
		assertEqual(shell.game.lastLevelId, 'pipeworks', 'stored in memory');
		assertEqual(shell.storage.getItem('ss2:lastLevel'), 'pipeworks', 'and persisted');

		shell.game.showTitle();
		shell.run(1);
		shell.press(MENU_ACTIONS.CONFIRM); // PLAY
		shell.run(1);
		assertEqual(shell.game.scene.level.id, 'pipeworks', 'PLAY resumes the last level');
	});
});

describe('menu: pause', () => {
	function startedGame() {
		const shell = createShell({ assets: bundle });
		shell.game.playLevel('arena');
		shell.run(30);
		return shell;
	}

	test('pausing freezes the simulation clock and the animation ticker', () => {
		const shell = startedGame();
		const scene = shell.game.scene;
		const player = scene.world.player;

		shell.press(MENU_ACTIONS.PAUSE);
		shell.run(1);
		assert(scene.paused, 'paused');
		assert(shell.game.time.paused, 'the clock is frozen, so wall-clock timers stop too');
		assert(!shell.game.driver.animation.started, 'animation is frozen, so the frame looks still');

		const frozen = { x: player.position.x, y: player.position.y };
		shell.run(60);
		assertEqual(player.position.x, frozen.x, 'x did not move while paused');
		assertEqual(player.position.y, frozen.y, 'y did not move while paused');
	});

	test('resuming restarts the clock and the animation ticker', () => {
		const shell = startedGame();
		const scene = shell.game.scene;

		shell.press(MENU_ACTIONS.PAUSE);
		shell.run(1);
		shell.press(MENU_ACTIONS.CONFIRM); // RESUME is first
		shell.run(1);

		assert(!scene.paused, 'resumed');
		assert(!shell.game.time.paused, 'the clock is live again');
		assert(shell.game.driver.animation.started, 'animation resumed');

		const before = scene.world.player.position.y;
		shell.run(30);
		assert(scene.world.player !== undefined, 'the run continues');
		assert(typeof before === 'number', 'sanity');
	});

	test('retry rebuilds the level from scratch', () => {
		const shell = startedGame();
		const scene = shell.game.scene;
		const firstWorld = scene.world;

		shell.press(MENU_ACTIONS.PAUSE);
		shell.run(1);
		shell.press(MENU_ACTIONS.DOWN); // RETRY
		shell.run(1);
		shell.press(MENU_ACTIONS.CONFIRM);
		shell.run(1);

		assert(scene.world !== firstWorld, 'a fresh world was built');
		assert(!scene.paused, 'retry resumes play');
		assertEqual(firstWorld.timers.pending, 0, 'the old run left no callbacks behind');
	});

	test('leaving a level tears its world down', () => {
		const shell = startedGame();
		const scene = shell.game.scene;
		const world = scene.world;
		const sceneGraph = world.scene;

		shell.game.showTitle();
		shell.run(1);

		assertEqual(sceneGraph.children.length, 0, 'display nodes released');
		assertEqual(world.timers.pending, 0, 'callbacks released');
		assertEqual(shell.game.driver.app.count, 2, 'the app ticker still has exactly tick + render');
	});
});

describe('menu: everything stays inside the pixel buffer', () => {
	test('no menu node is positioned outside 176x144', () => {
		const shell = createShell({ assets: bundle });
		const scenes = [() => shell.game.showTitle(), () => shell.game.showLevelSelect(), () => shell.game.playLevel('arena')];

		for (const open of scenes) {
			open();
			shell.run(2);
			const offenders = [];
			const walk = (container) => {
				for (const node of container.renderList()) {
					if (node.children) {
						walk(node);
						continue;
					}
					if (!node.visible) continue;
					if (node.x < -32 || node.x > NATIVE_WIDTH + 32 || node.y < -32 || node.y > NATIVE_HEIGHT + 32) {
						offenders.push(`${node.text ?? 'sprite'} @ (${node.x},${node.y})`);
					}
				}
			};
			walk(shell.game.stage);
			assertEqual(offenders.join(', '), '', `nodes escaped the buffer in ${shell.game.scene.constructor.name}`);
		}
	});

	test('the pause overlay covers the whole buffer', () => {
		const shell = createShell({ assets: bundle });
		shell.game.playLevel('arena');
		shell.run(5);
		shell.press(MENU_ACTIONS.PAUSE);
		shell.run(1);

		const scene = shell.game.scene;
		const backdrop = scene.overlay.children.find((node) => node.rectWidth === NATIVE_WIDTH);
		assert(backdrop, 'the pause overlay has a full-width backdrop');
		assertEqual(backdrop.rectHeight, NATIVE_HEIGHT, 'and it is full height');
		assert(scene.overlay.zIndex > 10000, 'the overlay draws above the touch buttons');
	});
});
