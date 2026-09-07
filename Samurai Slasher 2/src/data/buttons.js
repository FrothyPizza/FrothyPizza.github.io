/**
 * On-screen touch controls. They are entities drawn *inside* the 176x144
 * buffer at zIndex 10000 — never DOM overlays — and hit-tested in native
 * pixel space, exactly as the original did.
 */
export const TOUCH_BUTTONS = [
	{ type: 'jump', sheet: 'button', x: 120, y: 117, bounds: { width: 40, height: 40, offsetX: -12, offsetY: -12 } },
	{ type: 'attack', sheet: 'button', x: 152, y: 100, bounds: { width: 40, height: 40, offsetX: -12, offsetY: -12 } },
	{ type: 'right', sheet: 'rightButton', x: 44, y: 117, bounds: { width: 40, height: 40, offsetX: -6, offsetY: -12 } },
	{ type: 'left', sheet: 'leftButton', x: 10, y: 117, bounds: { width: 40, height: 40, offsetX: -12, offsetY: -12 } },
];
