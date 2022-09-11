

ECS.Systems.physics = entities => {
	for(let id in entities) {
		let entity = entities[id];

		if(entity.has("position")) {
			if(entity.has("sprite")) {
				entity.sprite.sprite.x = Math.round(entity.position.x - entity.sprite.offset.x);
				entity.sprite.sprite.y = Math.round(entity.position.y - entity.sprite.offset.y);
			}	
			if(entity.has("animatedSprite")) {
				entity.animatedSprite.sprite.x = Math.round(entity.position.x - entity.animatedSprite.offset.x);
				entity.animatedSprite.sprite.y = Math.round(entity.position.y - entity.animatedSprite.offset.y);
			}	
			if(entity.has("text")) {
				entity.text.textObj.x = entity.position.x;
				entity.text.textObj.y = entity.position.y;
			}
		}
		if(!entity.has("position", "velocity")) continue;

		if(entity.has("boundEntity")) {
			const bound = entities[entity.boundEntity.id];
			if(bound) {
				bound.position.x = entity.position.x + entity.boundEntity.offset.x + entity.bounds.x/2;
				bound.position.y = entity.position.y + entity.boundEntity.offset.y + entity.bounds.y/2;
			}
		}

		
		entity.position.last = entity.position.vec.copy();		
		entity.position.vec.add(entity.velocity.vec);
		
		if(entity.has("gravity")) {
			entity.velocity.vec.add(entity.gravity.vec);
			if(entity.velocity.y > entity.gravity.maxGravity)
				entity.velocity.y = entity.gravity.maxGravity;
		}



		// entity.position.x = Math.round(entity.position.x);
		entity.position.y = Math.round(entity.position.y);


	}
}