
ECS.Systems.animation = entities => {
	for(let id in entities) {
		let entity = entities[id];

		if(!entity.has("animatedSprite")) 
			continue;

		
		if(entity.has("position", "playerController")) {
			let moving = (entity.position.last.x !== entity.position.x);

			if(entity.has("animatedSprite") && entity.has("velocity")) {
				if(entity.velocity.y > 1 && !entity.grounded) {
					entity.animatedSprite.setAnimation("Fall");
				} else if(entity.velocity.y < -1 && !entity.grounded) {
					entity.animatedSprite.setAnimation("Jump");
				} else if(moving) {
					entity.animatedSprite.setAnimation("Run");
				} else {
					entity.animatedSprite.setAnimation("Idle");
				}
			}
		}

	}
}