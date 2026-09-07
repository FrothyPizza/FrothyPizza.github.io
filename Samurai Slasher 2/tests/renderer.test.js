import { describe, test, assert, assertEqual } from './framework.js';
import { NATIVE_HEIGHT, NATIVE_WIDTH, computeViewport, hexColor } from '../src/core/renderer.js';
import { BitmapFont, CHAR_HEIGHT, CHAR_WIDTH, GLYPH_ORDER, measureText } from '../src/core/bitmap-font.js';
import { Container, RectNode, SpriteNode, TextNode } from '../src/core/display.js';
import { Texture } from '../src/core/textures.js';

/**
 * Presentation contract: a whole-number upscale of a 176x144 buffer, centred
 * with integer letterbox bars. No fractional scaling, ever — that is what would
 * turn a 1px sprite edge into a 1.5px smear.
 */
describe('renderer: integer scaling and letterboxing', () => {
	test('scale is always a whole number and never below 1', () => {
		const sizes = [
			[176, 144],
			[1920, 1080],
			[1366, 768],
			[390, 844],
			[100, 100],
			[3840, 2160],
			[801, 649],
		];
		for (const [w, h] of sizes) {
			const view = computeViewport(w, h);
			assertEqual(view.scale, Math.floor(view.scale), `scale must be integral at ${w}x${h}`);
			assert(view.scale >= 1, `scale must never drop below 1 at ${w}x${h}`);
		}
	});

	test('the scaled buffer fits the viewport whenever one whole scale fits', () => {
		for (let w = NATIVE_WIDTH; w <= 2200; w += 37) {
			for (let h = NATIVE_HEIGHT; h <= 1400; h += 53) {
				const view = computeViewport(w, h);
				assert(view.width <= w, `overflowed horizontally at ${w}x${h}`);
				assert(view.height <= h, `overflowed vertically at ${w}x${h}`);
			}
		}
	});

	test('it picks the largest whole scale that fits', () => {
		assertEqual(computeViewport(176, 144).scale, 1, 'exact fit');
		assertEqual(computeViewport(351, 287).scale, 1, 'just short of 2x');
		assertEqual(computeViewport(352, 288).scale, 2, 'exactly 2x');
		assertEqual(computeViewport(1920, 1080).scale, 7, '1080p: limited by height (1080/144 = 7.5)');
	});

	test('letterbox offsets are integers and centre the image', () => {
		for (const [w, h] of [
			[1920, 1080],
			[1000, 700],
			[390, 844],
			[177, 145],
		]) {
			const view = computeViewport(w, h);
			assertEqual(view.offsetX, Math.floor(view.offsetX), 'offsetX integral');
			assertEqual(view.offsetY, Math.floor(view.offsetY), 'offsetY integral');
			assert(Math.abs(w - view.width - 2 * view.offsetX) <= 1, `horizontally centred at ${w}x${h}`);
			assert(Math.abs(h - view.height - 2 * view.offsetY) <= 1, `vertically centred at ${w}x${h}`);
		}
	});

	test('a portrait phone viewport still gets a whole scale', () => {
		// 390x844 CSS at dpr 3 -> 1170x2532 device pixels.
		const view = computeViewport(1170, 2532);
		assertEqual(view.scale, 6, '1170/176 = 6.6 -> 6');
		assertEqual(view.width, 176 * 6, 'width');
		assert(view.offsetY > 0, 'tall viewport letterboxes top and bottom');
	});
});

describe('renderer: bitmap font', () => {
	test('glyphs are 4x8 and laid out in atlas order', () => {
		const font = new BitmapFont({ width: 396, height: 8 });
		assertEqual(font.charWidth, CHAR_WIDTH, 'char width');
		assertEqual(font.charHeight, CHAR_HEIGHT, 'char height');
		assertEqual(font.glyph(' ').x, 0, 'space is glyph 0');
		assertEqual(font.glyph('A').x, 4, 'A follows the space');
		assertEqual(font.glyph('B').x, 8, 'B follows A');
		assertEqual(font.glyph('0').x, 53 * 4, 'digits start after the two alphabets');
	});

	test('the glyph table covers exactly the 99 cells in the atlas', () => {
		// font4x8.png is 396px wide at 4px per cell. If this count drifts, the
		// table and the image have gone out of sync and punctuation will shift.
		assertEqual(GLYPH_ORDER.length, 396 / CHAR_WIDTH, 'one entry per atlas cell');
		assertEqual(new Set(GLYPH_ORDER).size, GLYPH_ORDER.length, 'no character claims two cells');
	});

	test('punctuation indices match the atlas, not Echoes’ shifted string', () => {
		// Echoes' map omits #, &, ( and ) which shifts everything after `*`,
		// so its `<`, `=`, `>` land on `(`, `)`, `+`. These are the real cells.
		const font = new BitmapFont({ width: 396, height: 8 });
		const at = (char) => font.glyph(char).x / CHAR_WIDTH;
		assertEqual(at('*'), 75, '* is the last cell Echoes got right');
		assertEqual(at('#'), 76, '# exists in the atlas and is missing from Echoes’ string');
		assertEqual(at('+'), 82, '+');
		assertEqual(at('-'), 83, '-');
		assertEqual(at(':'), 85, ':');
		assertEqual(at('<'), 87, '< — the selection marker depends on this');
		assertEqual(at('='), 88, '=');
		assertEqual(at('>'), 89, '> — the selection marker depends on this');
		assertEqual(at('~'), 98, 'the final cell');
	});

	test('unknown characters fall back to a space rather than breaking layout', () => {
		const font = new BitmapFont({ width: 396, height: 8 });
		assertEqual(font.glyph('é').x, font.glyph(' ').x, 'accented characters fall back');
		assertEqual(font.glyph('あ').x, font.glyph(' ').x, 'non-latin falls back');
	});

	test('dashes alias onto the hyphen instead of vanishing', () => {
		const font = new BitmapFont({ width: 396, height: 8 });
		assertEqual(font.glyph('—').x, font.glyph('-').x, 'em dash');
		assertEqual(font.glyph('–').x, font.glyph('-').x, 'en dash');
	});

	test('measurement matches the advance the renderer uses', () => {
		assertEqual(measureText(''), 0, 'empty string');
		assertEqual(measureText('AB'), 8, 'two 4px glyphs, no tracking');
		assertEqual(measureText('AB', 1), 9, 'tracking is between glyphs only, not after the last');
		assertEqual(measureText('PLAY', 1), 19, 'four glyphs at 4px + three 1px gaps');
	});

	test('a centred label at native centre stays on integer pixels', () => {
		// 176/2 = 88; "PLAY" with 1px tracking is 19 wide, so the left edge
		// lands at 78.5 and must round, not smear.
		const width = measureText('PLAY', 1);
		const left = Math.round(NATIVE_WIDTH / 2 - width / 2);
		assertEqual(left, Math.floor(left), 'left edge is a whole pixel');
		assert(left >= 0 && left + width <= NATIVE_WIDTH, 'the label fits the buffer');
	});
});

describe('renderer: display list', () => {
	function texture(key) {
		return new Texture(key, null, { x: 0, y: 0, w: 8, h: 8 });
	}

	test('children draw back-to-front by zIndex, ties in insertion order', () => {
		const scene = new Container();
		scene.sortableChildren = true;

		const back = new SpriteNode(texture('back'));
		back.zIndex = 100;
		const hud = new SpriteNode(texture('hud'));
		hud.zIndex = -2;
		const a = new SpriteNode(texture('a'));
		const b = new SpriteNode(texture('b'));

		scene.addChild(back);
		scene.addChild(hud);
		scene.addChild(a);
		scene.addChild(b);

		const order = scene.renderList().map((node) => node.texture.key);
		assertEqual(order.join(','), 'hud,a,b,back', 'the map art draws last, over the actors — as in the original');
	});

	test('sorting is stable across repeated renders', () => {
		const scene = new Container();
		scene.sortableChildren = true;
		for (let i = 0; i < 6; ++i) scene.addChild(new SpriteNode(texture(`s${i}`)));
		scene.children[2].zIndex = 5;

		const first = scene.renderList().map((n) => n.texture.key).join(',');
		const second = scene.renderList().map((n) => n.texture.key).join(',');
		assertEqual(first, second, 'render order does not churn between frames');
	});

	test('removeChildren releases parents so nodes can be re-parented', () => {
		const scene = new Container();
		const node = new RectNode(4, 4, '#fff');
		scene.addChild(node);
		assertEqual(node.parent, scene, 'parented');
		scene.removeChildren();
		assertEqual(node.parent, null, 'released');
		assertEqual(scene.children.length, 0, 'emptied');
	});

	test('text nodes carry an integer scale so glyph pixels stay square', () => {
		const node = new TextNode('HI', { scale: 2 });
		assertEqual(node.scale, 2, 'scale is retained');
		assertEqual(node.scale, Math.floor(node.scale), 'and is a whole number');
	});
});

describe('renderer: colour helpers', () => {
	test('tints round-trip to CSS hex', () => {
		assertEqual(hexColor(0xffffff), '#ffffff', 'white');
		assertEqual(hexColor(0xbb8899), '#bb8899', 'the original damage flash');
		assertEqual(hexColor(0x992222), '#992222', 'the enraged-enemy tint');
		assertEqual(hexColor(0x000000), '#000000', 'black pads to six digits');
	});
});
