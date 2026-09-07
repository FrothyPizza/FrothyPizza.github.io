import { Container } from '../../core/display.js';
import { PALETTE } from '../ui.js';

/**
 * Scene contract.
 *
 * A scene owns a display sub-tree and, optionally, a world. The Game swaps
 * scenes; `exit()` is guaranteed to run, which is where every scene drops its
 * timers and listeners. Nothing in a scene reaches for a global.
 */
export class Scene {
	constructor(game) {
		this.game = game;
		this.root = new Container();
		this.root.sortableChildren = true;
		this.clearColor = PALETTE.backdrop;
	}

	enter() {}

	exit() {}

	/** Called once per application tick (63fps cap, hitstop-aware). */
	update() {}

	/** Called before every frame, hitstop or not — wall-clock timers live here. */
	pumpTimers() {}
}
