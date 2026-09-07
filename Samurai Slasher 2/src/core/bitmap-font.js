/**
 * 4x8 bitmap font, reused from Echoes
 * (`Echoes/js/scene/scene.js` + `Echoes/assets/fonts/font4x8.png`, copied to
 * `assets/fonts/font4x8.png`).
 *
 * Everything the game prints — HUD, menus, level select, pause — goes through
 * here. There is no DOM or browser-font text anywhere, which is what keeps the
 * whole frame inside the 176x144 pixel buffer.
 *
 * The glyph order below is read off the shipped atlas, not copied from Echoes'
 * `createBitmapFontMap`. Echoes' character string is correct through index 75
 * (`*`) and then diverges: it omits `#`, `&`, `(` and `)`, which shifts every
 * later glyph, so `<`, `=` and `>` render as `(`, `)` and `+`. Echoes never
 * printed those characters so it never noticed. The atlas is 396px wide — 99
 * cells — which matches this table exactly.
 */

export const CHAR_WIDTH = 4;
export const CHAR_HEIGHT = 8;

/**
 * Cell index -> character, in atlas order. An explicit array rather than a
 * string so the six quote-family glyphs can each keep their own cell instead
 * of collapsing onto one another.
 */
export const GLYPH_ORDER = [
	' ',
	...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	...'abcdefghijklmnopqrstuvwxyz',
	...'0123456789',
	'.',
	',',
	'‘', // left single quote
	'’', // right single quote
	'“', // left double quote
	'”', // right double quote
	'"',
	"'",
	'?',
	'!',
	'@',
	'_',
	'*',
	'#',
	'$',
	'%',
	'&',
	'(',
	')',
	'+',
	'-',
	'/',
	':',
	';',
	'<',
	'=',
	'>',
	'[',
	'\\',
	']',
	'^',
	'`',
	'{',
	'|',
	'}',
	'~',
];

/** Characters with no cell of their own, mapped to the closest one that has. */
const ALIASES = {
	'–': '-', // en dash
	'—': '-', // em dash
	'·': '.',
	';': ';',
};

export class BitmapFont {
	constructor(image) {
		this.image = image;
		this.charWidth = CHAR_WIDTH;
		this.charHeight = CHAR_HEIGHT;
		this.glyphs = {};
		GLYPH_ORDER.forEach((char, index) => {
			this.glyphs[char] = { x: index * CHAR_WIDTH, y: 0, width: CHAR_WIDTH, height: CHAR_HEIGHT };
		});
		for (const [from, to] of Object.entries(ALIASES)) {
			if (this.glyphs[to]) this.glyphs[from] = this.glyphs[to];
		}
		this.fallback = this.glyphs[' '];
	}

	/** Unknown characters render as a space rather than tearing the layout. */
	glyph(char) {
		return this.glyphs[char] || this.fallback;
	}

	measure(text, letterSpacing = 0) {
		return measureText(text, letterSpacing);
	}
}

/** Layout-only measurement, usable without an image (tests, headless runs). */
export function measureText(text, letterSpacing = 0) {
	if (!text || text.length === 0) return 0;
	return text.length * (CHAR_WIDTH + letterSpacing) - letterSpacing;
}
