


ECS.Systems.enemySpawner = entities => { 
	for(let id in entities) {
		let entity = entities[id];

		
		if(!entity.has("position", "enemySpawner"))
			continue;

		if(entity.enemySpawner.spawnTimer.getElapsedTime() > entity.enemySpawner.spawnDelay
		   || entity.enemySpawner.spawnTimer.getElapsedTime() > entity.enemySpawner.tempSpawnDelay) {
			entity.enemySpawner.spawnTimer.restart();

			
			if(entity.enemySpawner.spawnDelay > 400) {
				entity.enemySpawner.spawnDelay -= 5;
				entity.enemySpawner.tempSpawnDelay -= 5;
				// console.log(entity.enemySpawner.spawnDelay);
			}

			let type = 0;
			if(entity.enemySpawner.tempSpawnDelay == entity.enemySpawner.spawnDelay && Math.random() > 0.6) {
				if(Math.random() > 0.666)
					type = 1;
				else if(Math.random() > 0.5)
					type = 2;
				else
					type = 3;
				// type = Math.random() > 0.5 ? 1 : 2;
			}

			if(Math.random() > 0.9) {
				entity.enemySpawner.tempSpawnDelay = 400;
				setTimeout(() => entity.enemySpawner.tempSpawnDelay = entity.enemySpawner.spawnDelay, 1000);
			}

			
			let enemy = ECS.Blueprints.enemy(type);
			enemy.position.vec = entity.position.vec.copy();
			enemy.velocity.y = 1;
			if(Math.random() > 0.8) {
				enemy.enemyBehavior.enraged = true;
				enemy.enemyBehavior.speed = enemy.enemyBehavior.enragedSpeed;
				enemy.animatedSprite.sprite.tint = 0x992222;
			}
			ECS.register(enemy);
		}
	}
}
