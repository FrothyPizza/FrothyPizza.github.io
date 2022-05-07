

ECS.Systems.crateCollisions = entities => {
	for(let id in entities) {
		const player = entities[id];
		if(!player.has("playerController", "position", "bounds")) continue;;

		for(let id in entities) {
			const crate = entities[id];
			if(!crate.has("position", "bounds", "collectable")) continue;

			if(colliding(player, crate)) {
				++player.playerController.score;
				let lastPosition = crate.position.vec.copy();
				do {
					crate.position.vec = crate.collectable.getRandomLocation();
					console.log(Vec2.dist(crate.position.vec, lastPosition));
				} while(Vec2.dist(crate.position.vec, lastPosition) < 64);
				// let oldWeaponEntity = entities[player.boundEntity.id];
				// let newWeapon;
				// do {
				// 	newWeapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
				// } while(newWeapon == oldWeaponEntity.enemyDamager.name);

				// ECS.removeEntity(oldWeaponEntity.id);
				// let newWeaponEnt = ECS.Blueprints.weapon(newWeapon);

				// if(player.animatedSprite.sprite.scale.x == -1) {
				// 	newWeaponEnt.animatedSprite.sprite.scale.x = -1;
				// 	player.boundEntity.offset.x = -Math.abs(player.boundEntity.offset.x);
				// 	newWeaponEnt.bounds.offset.x = -Math.abs(newWeaponEnt.bounds.offset.x);
				// 	newWeaponEnt.bounds.x = -Math.abs(newWeaponEnt.bounds.x);
				// }
				// ECS.register(newWeaponEnt);
				// player.boundEntity.id = newWeaponEnt.id;
				ECS.Helpers.setPlayerWeapon(entities, player);
				if(player.playerController.score > localStorage.getItem("samhighscore"))
					localStorage.setItem("samhighscore", player.playerController.score);

				for(let id in entities)
					if(entities[id].has("text") && entities[id].has("score")) {
						entities[id].text.textObj.text = player.playerController.score;
					} else if(entities[id].has("text") && entities[id].has("highscore")) {
						entities[id].text.textObj.text = "hi:" + localStorage.getItem("samhighscore");
					}

				sounds.powerup.play();
			}
		}
	}
}