/**
 * Input.
 *
 * Gameplay bindings are byte-for-byte the original's: ArrowLeft/j, ArrowRight/k,
 * z/d to jump, x/f to attack. The systems read the same four booleans the
 * original `Inputs` object exposed, so held-vs-tapped behaviour (notably the
 * jump-hold window) is unchanged.
 *
 * Menu navigation is edge-triggered and lives beside — never inside — the
 * gameplay booleans, so a menu keypress can never leak into a simulation frame.
 */

export const MENU_ACTIONS = {
	UP: 'up',
	DOWN: 'down',
	CONFIRM: 'confirm',
	BACK: 'back',
	PAUSE: 'pause',
};

export class InputState {
	constructor() {
		this.leftDown = false;
		this.rightDown = false;
		this.jumpDown = false;
		this.attackDown = false;

		/** Edge-triggered menu actions, drained once per frame. */
		this.pressed = new Set();
		/** Native-space touch points, refreshed by the host each frame. */
		this.touches = [];
		/** Last tap position in native space, consumed by whichever menu reads it. */
		this.pointer = null;
		/** True once the player has produced any input (used to start music). */
		this.interacted = false;
	}

	press(action) {
		this.pressed.add(action);
	}

	consume(action) {
		if (!this.pressed.has(action)) return false;
		this.pressed.delete(action);
		return true;
	}

	/**
	 * Edge state lives for exactly one frame. The pointer is cleared here too:
	 * a tap that no menu claimed must not be waiting around to hijack the next
	 * keyboard confirm.
	 */
	endFrame() {
		this.pressed.clear();
		this.pointer = null;
	}

	clearHeld() {
		this.leftDown = false;
		this.rightDown = false;
		this.jumpDown = false;
		this.attackDown = false;
	}
}

const LEFT_KEYS = new Set(['ArrowLeft', 'j', 'a', 'A', 'J']);
const RIGHT_KEYS = new Set(['ArrowRight', 'k', 'l', 'K', 'L']);
const JUMP_KEYS = new Set(['z', 'd', 'Z', 'D']);
const ATTACK_KEYS = new Set(['x', 'f', 'X', 'F']);
const UP_KEYS = new Set(['ArrowUp', 'w', 'W']);
const DOWN_KEYS = new Set(['ArrowDown', 's', 'S']);
const CONFIRM_KEYS = new Set(['Enter', ' ', 'z', 'Z', 'x', 'X']);
const BACK_KEYS = new Set(['Escape', 'Backspace']);
const PAUSE_KEYS = new Set(['Escape', 'p', 'P']);

/**
 * Attaches DOM listeners to an `InputState`. Returns a disposer so a page can
 * tear the game down without leaking handlers.
 */
export function bindKeyboard(input, target = document) {
	const onKeyDown = (event) => {
		input.interacted = true;
		if (LEFT_KEYS.has(event.key)) input.leftDown = true;
		if (RIGHT_KEYS.has(event.key)) input.rightDown = true;
		if (JUMP_KEYS.has(event.key)) input.jumpDown = true;
		if (ATTACK_KEYS.has(event.key)) input.attackDown = true;

		if (event.repeat) return;
		if (UP_KEYS.has(event.key)) input.press(MENU_ACTIONS.UP);
		if (DOWN_KEYS.has(event.key)) input.press(MENU_ACTIONS.DOWN);
		if (CONFIRM_KEYS.has(event.key)) input.press(MENU_ACTIONS.CONFIRM);
		if (BACK_KEYS.has(event.key)) input.press(MENU_ACTIONS.BACK);
		if (PAUSE_KEYS.has(event.key)) input.press(MENU_ACTIONS.PAUSE);

		if (event.key === ' ' || event.key.startsWith('Arrow')) event.preventDefault();
	};

	const onKeyUp = (event) => {
		if (LEFT_KEYS.has(event.key)) input.leftDown = false;
		if (RIGHT_KEYS.has(event.key)) input.rightDown = false;
		if (JUMP_KEYS.has(event.key)) input.jumpDown = false;
		if (ATTACK_KEYS.has(event.key)) input.attackDown = false;
	};

	const onVisibility = () => {
		if (document.hidden) input.clearHeld();
	};

	target.addEventListener('keydown', onKeyDown);
	target.addEventListener('keyup', onKeyUp);
	document.addEventListener('visibilitychange', onVisibility);
	window.addEventListener('blur', () => input.clearHeld());

	return () => {
		target.removeEventListener('keydown', onKeyDown);
		target.removeEventListener('keyup', onKeyUp);
		document.removeEventListener('visibilitychange', onVisibility);
	};
}

/**
 * Touch/pointer support. Points are converted into native 176x144 space by the
 * renderer so the on-screen buttons — which are drawn *inside* the pixel
 * buffer — can be hit-tested in their own coordinate system.
 */
export function bindPointer(input, canvas, renderer) {
	const update = (event) => {
		input.interacted = true;
		const points = [];
		const list = event.touches !== undefined ? event.touches : [event];
		for (let i = 0; i < list.length; ++i) {
			const touch = list[i];
			points.push(renderer.toNative(touch.clientX, touch.clientY));
		}
		input.touches = points;
	};

	const onTouchEnd = (event) => {
		update(event);
		if (input.touches.length === 0) input.press(MENU_ACTIONS.CONFIRM);
	};

	canvas.addEventListener('touchstart', update, { passive: true });
	canvas.addEventListener('touchmove', update, { passive: true });
	canvas.addEventListener('touchend', onTouchEnd, { passive: true });
	canvas.addEventListener('touchcancel', update, { passive: true });
	canvas.addEventListener('pointerdown', (event) => {
		input.interacted = true;
		input.pointer = renderer.toNative(event.clientX, event.clientY);
		input.press(MENU_ACTIONS.CONFIRM);
	});

	return () => {
		canvas.removeEventListener('touchstart', update);
		canvas.removeEventListener('touchmove', update);
		canvas.removeEventListener('touchend', onTouchEnd);
		canvas.removeEventListener('touchcancel', update);
	};
}

/** Same UA sniff the original shipped, kept so mobile behaviour is unchanged. */
export function detectMobile(userAgent = '') {
	return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
		userAgent,
	);
}
