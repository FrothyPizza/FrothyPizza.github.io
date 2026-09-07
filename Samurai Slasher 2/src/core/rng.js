/**
 * Randomness is a *service*, never a global. The live game hands the world
 * `Math.random`; tests hand it a seeded generator so the differential harness
 * can drive the original source and the new runtime from the same stream.
 */

/** Deterministic 32-bit PRNG (mulberry32). Same seed -> same sequence. */
export function mulberry32(seed) {
	let a = seed >>> 0;
	return function random() {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** `seed == null` -> the platform generator, otherwise a seeded one. */
export function createRandomSource(seed) {
	if (seed == null) return () => Math.random();
	return mulberry32(seed);
}
