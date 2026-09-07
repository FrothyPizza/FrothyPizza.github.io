import { Vec2 } from '../core/vec2.js';

/**
 * Shared collision predicates, transcribed from the original.
 *
 * `COLLISION_MARGIN` and the odd asymmetry of the four block tests are the
 * source of several well-known feels (edge grabs, the 4px snap when landing).
 * They are reproduced exactly — see docs/compatibility.md.
 */
export const COLLISION_MARGIN = 4;

/** AABB overlap that understands a negative width (a left-facing weapon). */
export function colliding(a, b) {
	const posA = Vec2.add(a.position.vec, a.bounds.offset);
	const rectA = a.bounds.vec.copy();
	const posB = Vec2.add(b.position.vec, b.bounds.offset);
	const rectB = b.bounds.vec.copy();
	if (a.bounds.x < 0) {
		posA.x += a.bounds.x;
		rectA.x *= -1;
	}
	return (
		posA.x + rectA.x > posB.x &&
		posA.x < posB.x + rectB.x &&
		posA.y + rectA.y > posB.y &&
		posA.y < posB.y + rectB.y
	);
}

// `thing` is { x, y, width, height }. `collisionProtrusion` is how far outside
// the block the hitbox may stick; `boxWidth` shortens the perpendicular span.
export function collidingWithLeftOfBlock(thing, blockX, blockY, blockSize, collisionProtrusion = 0, boxWidth = 0) {
	return (
		thing.x + thing.width > blockX - collisionProtrusion &&
		thing.x + thing.width < blockX + COLLISION_MARGIN &&
		thing.y + thing.height > blockY + boxWidth &&
		thing.y < blockY + blockSize - boxWidth
	);
}

export function collidingWithRightOfBlock(thing, blockX, blockY, blockSize, collisionProtrusion = 0, boxWidth = 0) {
	return (
		thing.x > blockX + blockSize - COLLISION_MARGIN &&
		thing.x < blockX + blockSize + collisionProtrusion &&
		thing.y + thing.height > blockY + boxWidth &&
		thing.y < blockY + blockSize - boxWidth
	);
}

export function collidingWithTopOfBlock(thing, blockX, blockY, blockSize, collisionProtrusion = 0, boxWidth = 0) {
	return (
		thing.x + thing.width > blockX + boxWidth &&
		thing.x < blockX + blockSize - boxWidth &&
		thing.y + thing.height > blockY - collisionProtrusion &&
		thing.y + thing.height < blockY + COLLISION_MARGIN
	);
}

export function collidingWithBottomOfBlock(thing, blockX, blockY, blockSize, collisionProtrusion = 0, boxWidth = 0) {
	return (
		thing.x + thing.width > blockX + boxWidth &&
		thing.x < blockX + blockSize - boxWidth &&
		thing.y > blockY + blockSize - COLLISION_MARGIN &&
		thing.y < blockY + blockSize + collisionProtrusion
	);
}
