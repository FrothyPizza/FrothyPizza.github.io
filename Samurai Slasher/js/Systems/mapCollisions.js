
const COLLISION_MARGIN = 4;

ECS.Systems.mapCollisions = entities => {
	for(let id in entities) {
		const mapEnt = entities[id];
		if(!mapEnt.has("tileCollisionMask")) continue;
		
		const blockSize = mapEnt.tileCollisionMask.tileSize;
		const map = mapEnt.tileCollisionMask.collisionMask;

		for(let id2 in entities) {
			const obj = entities[id2];
			if(!obj.has("position", "velocity", "bounds", "mapCollider"))
				continue;

			let offsetX = 0;
			if(obj.has("sprite") && obj.sprite.centered) {
				offsetX = obj.bounds.x/2 + obj.sprite.offset.x;
			}

			// the interpolated positions are only used for the y axis
			let interpolatedPositions = [];
			for(let i = 0; i <= Math.abs(obj.position.vec.y - obj.position.last.y); ++i) {
				if(obj.position.vec.y < obj.position.last.y) 
					interpolatedPositions.push(new Vec2(obj.position.x, obj.position.y + i));
				else
					interpolatedPositions.push(new Vec2(obj.position.x, obj.position.y - i));
			}
			// console.log(obj.position.vec, obj.position.last, interpolatedPositions);

			

			const thing = {
				x: obj.position.x,
				y: obj.position.y,
				width: obj.bounds.vec.x,
				height: obj.bounds.vec.y,
			}


			let hitGround = false;
			let leftHit = false;
			let rightHit = false;
			let topHit = false;

			if(obj.position.y < -6)
				obj.position.y = -6;

			
			for(let y = 0; y < map.length; ++y) {
				for(let x = 0; x < map[y].length; ++x) {
					if(map[y][x] !== "#" && !(obj.has("playerController") && map[y][x] === "_")) continue;
					let blockX = x * blockSize + mapEnt.position.x + offsetX;
					let blockY = y * blockSize + mapEnt.position.y;

					for(let i = 0; i < interpolatedPositions.length; ++i) {
						thing.y = interpolatedPositions[i].y;
						if(collidingWithTopOfBlock(thing, blockX, blockY, blockSize, 0, 1)
						  && obj.velocity.y >= 0) {
							hitGround = true;
							obj.velocity.y = 0;
							obj.position.y = blockY - obj.bounds.vec.y;
						}
						else if(collidingWithBottomOfBlock(thing, blockX, blockY, blockSize, 0, 1)
						  && obj.velocity.y <= 0) {
							topHit = true;
							obj.velocity.y = 0;
	                        obj.position.y = blockY + blockSize;
						}
						if(topHit || hitGround) {
							i = interpolatedPositions.length;
							continue;
						}
					}
					if(topHit || hitGround) continue;
					if(collidingWithLeftOfBlock(thing, blockX, blockY, blockSize, 0, 1)) {
						rightHit = true;
						obj.velocity.x = 0;
						obj.position.x = blockX - obj.bounds.vec.x;
					}
					else if(collidingWithRightOfBlock(thing, blockX, blockY, blockSize, 0, 1)) {
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
			
		}
	}
}



// i took this code from an old project, so it might be like the "best", but if it ain't broke, don't fix it
// collisionProtrusion is how far out of the block the hitbox protrudes
// boxWidth is how much shorter the hitbox should be
// thing: { x, y, width, height }
function collidingWithLeftOfBlock(thing, blockX, blockY, blockSize, collisionProtrusion=0, boxWidth=0) {
    return thing.x + thing.width > blockX - collisionProtrusion && thing.x + thing.width < blockX + COLLISION_MARGIN &&
           thing.y + thing.height > blockY + boxWidth && thing.y < blockY + blockSize - boxWidth;
}
function collidingWithRightOfBlock(thing, blockX, blockY, blockSize, collisionProtrusion=0, boxWidth=0) {
    return thing.x > blockX + blockSize - COLLISION_MARGIN && thing.x < blockX + blockSize + collisionProtrusion &&
           thing.y + thing.height > blockY + boxWidth && thing.y < blockY + blockSize - boxWidth;
}
function collidingWithTopOfBlock(thing, blockX, blockY, blockSize, collisionProtrusion=0, boxWidth=0) {
    return thing.x + thing.width > blockX + boxWidth && thing.x < blockX + blockSize - boxWidth &&
           thing.y + thing.height > blockY - collisionProtrusion && thing.y + thing.height < blockY + COLLISION_MARGIN
}
function collidingWithBottomOfBlock(thing, blockX, blockY, blockSize, collisionProtrusion=0, boxWidth=0) {
    return thing.x + thing.width > blockX + boxWidth && thing.x < blockX + blockSize - boxWidth &&
           thing.y > blockY + blockSize - COLLISION_MARGIN && thing.y < blockY + blockSize + collisionProtrusion
}

function collidingWithBlock(thing, blockX, blockY, blockSize, collisionProtrusion=0) {
    return thing.x + thing.width > blockX-collisionProtrusion && thing.x < blockX + blockSize + collisionProtrusion &&
           thing.y + thing.height > blockY-collisionProtrusion && thing.y < blockY + blockSize + collisionProtrusion;
}