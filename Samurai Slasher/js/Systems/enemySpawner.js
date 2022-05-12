


ECS.Systems.enemySpawner = entities => { 
	for(let id in entities) {
		let entity = entities[id];

		
		if(!entity.has("position", "enemySpawner"))
			continue;

		if(entity.enemySpawner.spawnTimer.getElapsedTime() > entity.enemySpawner.spawnDelay
		   || entity.enemySpawner.spawnTimer.getElapsedTime() > entity.enemySpawner.tempSpawnDelay) {
			entity.enemySpawner.spawnTimer.restart();

			
			if(entity.enemySpawner.spawnDelay > 750) {
				entity.enemySpawner.spawnDelay -= 5;
				entity.enemySpawner.tempSpawnDelay -= 5;
				console.log(entity.enemySpawner.spawnDelay);
			}

			let type = 0;
			if(entity.enemySpawner.tempSpawnDelay == entity.enemySpawner.spawnDelay && Math.random() > 0.7) {
				type = Math.random() > 0.5 ? 1 : 2;
			}

			if(Math.random() > 0.9) {
				entity.enemySpawner.tempSpawnDelay = 400;
				setTimeout(() => entity.enemySpawner.tempSpawnDelay = entity.enemySpawner.spawnDelay, 1000);
			}
			
			let enemy = ECS.Blueprints.enemy(type);
			enemy.position.vec = entity.position.vec.copy();
			enemy.velocity.y = 1;
			ECS.register(enemy);
		}
	}
}
