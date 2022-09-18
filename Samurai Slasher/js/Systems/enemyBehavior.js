


ECS.Systems.enemyBehavior = entities => { 
	for(let id in entities) {
		let entity = entities[id];

		if(!entity.has("position", "velocity", "enemyBehavior", "mapCollider", "bounds"))
			continue;

		if(entity.has("pipeTraveller")) {
			entity.position.vec = entity.pipeTraveller.spawnLocations[Math.floor(Math.random() * 2)].copy();
			entity.velocity.y = 0;
			entity.enemyBehavior.speed = entity.enemyBehavior.enragedSpeed;
			entity.animatedSprite.sprite.tint = 0x992222;
			entity.removeComponent("pipeTraveller");
			entity.enemyBehavior.hasTouchedGround = false;
		}

		if(entity.enemyBehavior.hasTouchedGround) 
			entity.position.x += entity.enemyBehavior.direction * entity.enemyBehavior.speed
				* (entity.enemyBehavior.enraged ? entity.enemyBehavior.enragedSpeed : 1);

		if(entity.mapCollider.leftColliding)
			entity.enemyBehavior.direction = 1;
		if(entity.mapCollider.rightColliding)
			entity.enemyBehavior.direction = -1;


		if(entity.has("flyingEnemy") && entity.has("animatedSprite")) {
			if(!entity.animatedSprite.sprite.onFrameChange) {
				entity.animatedSprite.sprite.onFrameChange = (frame) => {
					if(frame == 1)
						entity.velocity.y = -entity.flyingEnemy.pulseStrength;
				}
			}
		}
		

		if(entity.position.y > app.renderer.height && !entity.has("pipeTraveller")) {
			entity.addComponent(new ECS.Components.PipeTraveller());
			entity.enemyBehavior.enraged = true;
		}
		
		if(entity.has("sprite")) {
			entity.sprite.sprite.scale.x = entity.enemyBehavior.direction;
		} else if(entity.has("animatedSprite")) {
			entity.animatedSprite.sprite.scale.x = entity.enemyBehavior.direction;			
		}

	}
}