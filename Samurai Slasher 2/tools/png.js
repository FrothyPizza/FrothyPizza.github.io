import zlib from 'node:zlib';

/**
 * Minimal 8-bit RGBA PNG codec.
 *
 * Just enough to read the game's own art and write a new image from it, with
 * no dependencies — the project installs nothing. Only what this repo's PNGs
 * actually use is supported: bit depth 8, colour type 6 (RGBA), no interlace.
 */

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
	const table = new Int32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c;
	}
	return table;
})();

function crc32(buffer) {
	let c = -1;
	for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
	return (c ^ -1) >>> 0;
}

/** @returns {{width:number, height:number, data:Buffer}} RGBA, 4 bytes/pixel. */
export function decodePng(buffer) {
	if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error('not a PNG');

	let offset = 8;
	let width = 0;
	let height = 0;
	let colorType = 0;
	let bitDepth = 0;
	const idat = [];

	while (offset < buffer.length) {
		const length = buffer.readUInt32BE(offset);
		const type = buffer.toString('latin1', offset + 4, offset + 8);
		const body = buffer.subarray(offset + 8, offset + 8 + length);
		offset += 12 + length;

		if (type === 'IHDR') {
			width = body.readUInt32BE(0);
			height = body.readUInt32BE(4);
			bitDepth = body[8];
			colorType = body[9];
			if (body[12] !== 0) throw new Error('interlaced PNGs are not supported');
		} else if (type === 'IDAT') {
			idat.push(body);
		} else if (type === 'IEND') {
			break;
		}
	}

	if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
	const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
	if (!channels) throw new Error(`unsupported colour type ${colorType}`);

	const raw = zlib.inflateSync(Buffer.concat(idat));
	const stride = width * channels;
	const pixels = Buffer.alloc(width * height * 4);
	const line = Buffer.alloc(stride);
	const previous = Buffer.alloc(stride);

	let source = 0;
	for (let y = 0; y < height; y++) {
		const filter = raw[source++];
		raw.copy(line, 0, source, source + stride);
		source += stride;
		unfilter(filter, line, previous, channels);
		line.copy(previous);

		for (let x = 0; x < width; x++) {
			const from = x * channels;
			const to = (y * width + x) * 4;
			if (channels === 4) {
				line.copy(pixels, to, from, from + 4);
			} else if (channels === 3) {
				pixels[to] = line[from];
				pixels[to + 1] = line[from + 1];
				pixels[to + 2] = line[from + 2];
				pixels[to + 3] = 255;
			} else if (channels === 2) {
				pixels[to] = pixels[to + 1] = pixels[to + 2] = line[from];
				pixels[to + 3] = line[from + 1];
			} else {
				pixels[to] = pixels[to + 1] = pixels[to + 2] = line[from];
				pixels[to + 3] = 255;
			}
		}
	}

	return { width, height, data: pixels };
}

function unfilter(filter, line, previous, bpp) {
	const stride = line.length;
	switch (filter) {
		case 0:
			return;
		case 1:
			for (let i = bpp; i < stride; i++) line[i] = (line[i] + line[i - bpp]) & 0xff;
			return;
		case 2:
			for (let i = 0; i < stride; i++) line[i] = (line[i] + previous[i]) & 0xff;
			return;
		case 3:
			for (let i = 0; i < stride; i++) {
				const left = i >= bpp ? line[i - bpp] : 0;
				line[i] = (line[i] + ((left + previous[i]) >> 1)) & 0xff;
			}
			return;
		case 4:
			for (let i = 0; i < stride; i++) {
				const a = i >= bpp ? line[i - bpp] : 0;
				const b = previous[i];
				const c = i >= bpp ? previous[i - bpp] : 0;
				const p = a + b - c;
				const pa = Math.abs(p - a);
				const pb = Math.abs(p - b);
				const pc = Math.abs(p - c);
				const predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
				line[i] = (line[i] + predictor) & 0xff;
			}
			return;
		default:
			throw new Error(`unknown PNG filter ${filter}`);
	}
}

function chunk(type, body) {
	const out = Buffer.alloc(body.length + 12);
	out.writeUInt32BE(body.length, 0);
	out.write(type, 4, 'latin1');
	body.copy(out, 8);
	out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
	return out;
}

/** @param {{width:number, height:number, data:Buffer}} image RGBA */
export function encodePng({ width, height, data }) {
	const stride = width * 4;
	const raw = Buffer.alloc((stride + 1) * height);
	for (let y = 0; y < height; y++) {
		raw[y * (stride + 1)] = 0; // filter: none — these images are tiny
		data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
	}

	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // RGBA
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;

	return Buffer.concat([
		SIGNATURE,
		chunk('IHDR', ihdr),
		chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0)),
	]);
}

export function createImage(width, height, fill = [0, 0, 0, 255]) {
	const data = Buffer.alloc(width * height * 4);
	for (let i = 0; i < width * height; i++) {
		data[i * 4] = fill[0];
		data[i * 4 + 1] = fill[1];
		data[i * 4 + 2] = fill[2];
		data[i * 4 + 3] = fill[3];
	}
	return { width, height, data };
}

/** Nearest-neighbour blit with integer scaling and simple alpha compositing. */
export function blit(destination, source, { sx = 0, sy = 0, sw, sh, dx = 0, dy = 0, scale = 1, tint } = {}) {
	const width = sw ?? source.width;
	const height = sh ?? source.height;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const from = ((sy + y) * source.width + (sx + x)) * 4;
			const alpha = source.data[from + 3];
			if (alpha === 0) continue;

			const r = tint ? tint[0] : source.data[from];
			const g = tint ? tint[1] : source.data[from + 1];
			const b = tint ? tint[2] : source.data[from + 2];

			for (let py = 0; py < scale; py++) {
				for (let px = 0; px < scale; px++) {
					const tx = dx + x * scale + px;
					const ty = dy + y * scale + py;
					if (tx < 0 || ty < 0 || tx >= destination.width || ty >= destination.height) continue;
					const to = (ty * destination.width + tx) * 4;
					const a = alpha / 255;
					destination.data[to] = Math.round(destination.data[to] * (1 - a) + r * a);
					destination.data[to + 1] = Math.round(destination.data[to + 1] * (1 - a) + g * a);
					destination.data[to + 2] = Math.round(destination.data[to + 2] * (1 - a) + b * a);
					destination.data[to + 3] = 255;
				}
			}
		}
	}
	return destination;
}
