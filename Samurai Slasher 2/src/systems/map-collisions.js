import { Vec2 } from '../core/vec2.js';
import {
	collidingWithBottomOfBlock,
	collidingWithLeftOfBlock,
	collidingWithRightOfBlock,
	collidingWithTopOfBlock,
} from './collision.js';

/**
 * Tile collision — the first system in the frame, and the one with the most
 * load-bearing quirks. Transcribed from `Systems/mapCollisions.js`.
 *
 * Deliberately preserved oddities (all covered by the differential tests):
 *
 *   1. `thing.x` is sampled once, before the tile scan. Horizontal corrections
 *      applied to `position.x` are therefore invisible to later tiles in the
 *      same frame.
 *   2. `thing.y` is left holding the *last interpolated* y after the vertical
 *      sweep, and the horizontal tests then run against that value.
 *   3. Once a ceiling or floor is hit, `continue` skips the horizontal tests
 *      for every remaining tile that frame — you cannot be wall-corrected on a
 *      frame you landed.
 *   4. The vertical sweep walks back from the current position toward
 *      `position.last`, one whole pixel at a time. `position.last` is set by
 *      the *physics* system, which runs later in the frame, so on an entity's
 *      first frame it is still the constructor value (0,0) and the sweep
 *      covers the entire fall.
 *   5. The `offsetX` term only applies to `sprite`, never `animatedSprite` —
 *      and nothing with a map collider uses a plain `sprite`, so it is always
 *      zero. Kept because removing it would be a silent behaviour change if a
 *      future entity ever did use one.
 */
export function mapCollisions(world) {
	for (const mapEnt of world.each('tileCollisionMask')) {
		const blockSize = mapEnt.tileCollisionMask.tileSize;
		const map = mapEnt.tileCollisionMask.collisionMask;

		for (const obj of world.each('position', 'velocity', 'bounds', 'mapCollider')) {
			let offsetX = 0;
			if (obj.has('sprite') && obj.sprite.centered) {
				offsetX = obj.bounds.x / 2 + obj.sprite.offset.x;
			}

			// Interpolated positions are used for the y axis only.
			const interpolatedPositions = [];
			for (let i = 0; i <= Math.abs(obj.position.vec.y - obj.position.last.y); ++i) {
				if (obj.position.vec.y < obj.position.last.y) {
					interpolatedPositions.push(new Vec2(obj.position.x, obj.position.y + i));
				} else {
					interpolatedPositions.push(new Vec2(obj.position.x, obj.position.y - i));
				}
			}

			const thing = {
				x: obj.position.x,
				y: obj.position.y,
				width: obj.bounds.vec.x,
				height: obj.bounds.vec.y,
			};

			let hitGround = false;
			let leftHit = false;
			let rightHit = false;
			let topHit = false;

			if (obj.position.y < world.level.ceiling) obj.position.y = world.level.ceiling;

			for (let y = 0; y < map.length; ++y) {
				for (let x = 0; x < map[y].length; ++x) {
					// `_` is a one-way floor: solid for the player, not for enemies.
					if (map[y][x] !== '#' && !(obj.has('playerController') && map[y][x] === '_')) continue;
					const blockX = x * blockSize + mapEnt.position.x + offsetX;
					const blockY = y * blockSize + mapEnt.position.y;

					for (let i = 0; i < interpolatedPositions.length; ++i) {
						thing.y = interpolatedPositions[i].y;
						if (collidingWithTopOfBlock(thing, blockX, blockY, blockSize, 0, 1) && obj.velocity.y >= 0) {
							hitGround = true;
							obj.velocity.y = 0;
							obj.position.y = blockY - obj.bounds.vec.y;
						} else if (
							collidingWithBottomOfBlock(thing, blockX, blockY, blockSize, 0, 1) &&
							obj.velocity.y <= 0
						) {
							topHit = true;
							obj.velocity.y = 0;
							obj.position.y = blockY + blockSize;
						}
						if (topHit || hitGround) {
							i = interpolatedPositions.length;
							continue;
						}
					}
					if (topHit || hitGround) continue;

					if (collidingWithLeftOfBlock(thing, blockX, blockY, blockSize, 0, 1)) {
						rightHit = true;
						obj.velocity.x = 0;
						obj.position.x = blockX - obj.bounds.vec.x;
					} else if (collidingWithRightOfBlock(thing, blockX, blockY, blockSize, 0, 1)) {
						leftHit = true;
						obj.velocity.x = 0;
						obj.position.x = blockX + blockSize;
					}
				}
			}

			obj.mapCollider.grounded = hitGround;
			obj.mapCollider.rightColliding = rightHit;
			obj.mapCollider.leftColliding = leftHit;
			obj.mapCollider.topColliding = topHit;

			if (obj.has('enemyBehavior')) {
				if (hitGround) obj.enemyBehavior.hasTouchedGround = true;
			}
		}
	}
}
