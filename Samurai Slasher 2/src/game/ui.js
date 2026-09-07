import { RectNode, TextNode } from '../core/display.js';
import { measureText } from '../core/bitmap-font.js';
import { MENU_ACTIONS } from '../core/input.js';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from '../core/renderer.js';

/**
 * In-buffer UI primitives.
 *
 * Everything here produces display nodes that live inside the 176x144 buffer
 * and are drawn with the 4x8 bitmap font, so menus scale with the game rather
 * than floating above it as DOM text.
 */

export const PALETTE = {
	ink: '#e8e6df',
	dim: '#7b7f96',
	accent: '#57d6d0',
	warn: '#e2a355',
	panel: '#12121c',
	panelEdge: '#3a3a52',
	backdrop: '#000000',
};

/** Menu glyphs get one extra pixel of tracking; 4px type needs the air. */
export const MENU_TRACKING = 1;

export function label(container, text, options = {}) {
	const node = new TextNode(text, {
		color: options.color || PALETTE.ink,
		anchorX: options.anchorX != null ? options.anchorX : 0.5,
		anchorY: options.anchorY != null ? options.anchorY : 0.5,
		letterSpacing: options.letterSpacing || 0,
		scale: options.scale || 1,
	});
	node.x = options.x || 0;
	node.y = options.y || 0;
	node.zIndex = options.zIndex || 0;
	container.addChild(node);
	return node;
}

export function rect(container, x, y, width, height, color, options = {}) {
	const node = new RectNode(width, height, color);
	node.x = x;
	node.y = y;
	node.anchorX = options.anchorX != null ? options.anchorX : 0;
	node.anchorY = options.anchorY != null ? options.anchorY : 0;
	node.alpha = options.alpha != null ? options.alpha : 1;
	node.zIndex = options.zIndex || 0;
	container.addChild(node);
	return node;
}

export function fullBleed(container, color, zIndex = -1000) {
	return rect(container, 0, 0, NATIVE_WIDTH, NATIVE_HEIGHT, color, { zIndex });
}

/** A framed panel: one-pixel edge, flat fill. */
export function panel(container, x, y, width, height, options = {}) {
	const zIndex = options.zIndex || 0;
	rect(container, x - 1, y - 1, width + 2, height + 2, options.edge || PALETTE.panelEdge, { zIndex });
	rect(container, x, y, width, height, options.fill || PALETTE.panel, { zIndex: zIndex + 1 });
}

/**
 * Keyboard/touch menu.
 *
 * Owns selection state only; the scene owns the nodes. `hitTest` lets a touch
 * pick a row directly, so the same menu works on a phone without a second
 * code path.
 */
export class Menu {
	constructor(items) {
		this.items = items;
		this.index = 0;
		this.rows = [];
	}

	get current() {
		return this.items[this.index];
	}

	move(delta) {
		if (this.items.length === 0) return;
		this.index = (this.index + delta + this.items.length) % this.items.length;
	}

	/** Registers a row's vertical extent so pointers can select it. */
	registerRow(index, y, height) {
		this.rows[index] = { y, height };
	}

	hitTest(point) {
		for (let i = 0; i < this.rows.length; ++i) {
			const row = this.rows[i];
			if (!row) continue;
			if (point.y >= row.y && point.y < row.y + row.height) return i;
		}
		return -1;
	}

	/**
	 * Drains one frame of input. Returns the activated item, or null.
	 * A pointer tap selects the row under it and activates in one go.
	 */
	handle(input) {
		if (input.consume(MENU_ACTIONS.UP)) this.move(-1);
		if (input.consume(MENU_ACTIONS.DOWN)) this.move(1);

		let confirmed = input.consume(MENU_ACTIONS.CONFIRM);
		if (confirmed && input.pointer) {
			const hit = this.hitTest(input.pointer);
			if (hit >= 0) this.index = hit;
			else confirmed = false;
			input.pointer = null;
		}
		return confirmed ? this.current : null;
	}
}

/** Lays out a vertical menu and returns the label nodes, in item order. */
export function layoutMenu(container, menu, options = {}) {
	const x = options.x != null ? options.x : NATIVE_WIDTH / 2;
	const top = options.y != null ? options.y : 96;
	const lineHeight = options.lineHeight || 12;
	const scale = options.scale || 1;
	const zIndex = options.zIndex || 0;

	return menu.items.map((item, index) => {
		const y = top + index * lineHeight;
		menu.registerRow(index, y - lineHeight / 2, lineHeight);
		const node = label(container, item.label, {
			x,
			y,
			scale,
			zIndex,
			letterSpacing: MENU_TRACKING,
		});
		return node;
	});
}

/** Repaints selection state: the chosen row is accented and marked. */
export function paintSelection(nodes, menu, options = {}) {
	const selected = options.selected || PALETTE.accent;
	const idle = options.idle || PALETTE.dim;
	nodes.forEach((node, index) => {
		const isSelected = index === menu.index;
		node.color = isSelected ? selected : idle;
		node.text = isSelected ? `>${menu.items[index].label}<` : menu.items[index].label;
	});
}

export function textWidth(text, letterSpacing = 0, scale = 1) {
	return measureText(text, letterSpacing) * scale;
}
