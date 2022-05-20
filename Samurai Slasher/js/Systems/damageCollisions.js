
function colliding(ent1, ent2) {
	let pos1 = Vec2.add(ent1.position.vec, ent1.bounds.offset);
	let rect1 = ent1.bounds.vec.copy();
	let pos2 = Vec2.add(ent2.position.vec, ent2.bounds.offset);
	let rect2 = ent2.bounds.vec.copy();
	if(ent1.bounds.x < 0) {
		pos1.x += ent1.bounds.x;
		rect1.x *= -1;
	}
	return pos1.x + rect1.x > pos2.x 
		&& pos1.x < pos2.x + rect2.x 
		&& pos1.y + rect1.y > pos2.y 
		&& pos1.y < pos2.y + rect2.y;
}

ECS.Systems.damageCollisions = entities => {
	for(let id in entities) {
		const damager = entities[id];
		if(!damager.has("position", "bounds")) continue;

		if(damager.has("enemyDamager") && damager.enemyDamager.enabled) {
			++damager.enemyDamager.frames;
			if(damager.enemyDamager.frames > damager.enemyDamager.framesEnabled) {
				damager.enemyDamager.enabled = false;
				damager.enemyDamager.frames = 0;
				damager.enemyDamager.damagedEntities = [];
			}
		} 

		for(let id in entities) {
			const reciever = entities[id];
			if(!reciever.has("health", "position", "bounds")) continue;


			// if a weapon is damaging an enemy 
			if(damager.has("enemyDamager") && damager.enemyDamager.enabled && reciever.has("playerDamager")) {
				if(colliding(damager, reciever) && !damager.enemyDamager.damagedEntities.find(x => x == reciever.id)) {
					// freeze(100);
					damager.enemyDamager.damagedEntities.push(reciever.id);
					
					reciever.health.value -= damager.enemyDamager.damage;
					if(reciever.animatedSprite.sprite.tint == 0xFFFFFF) reciever.animatedSprite.sprite.tint = 0xBB8899;
					// sounds.damage.play();

					if(reciever.health.value <= 0) {
						reciever.removeComponent("mapCollider");
						reciever.removeComponent("playerDamager");
						if(damager.has("animatedSprite")) {
							reciever.velocity.x = 2.5 * damager.animatedSprite.sprite.scale.x;
							reciever.animatedSprite.sprite.zIndex = 1000;
						} else {
							reciever.velocity.x = 2.5 * (Math.random() > 0.5 ? -1 : 1);
						}
						reciever.velocity.y = -2.5;
						reciever.animatedSprite.sprite.loop = false;
						setTimeout(() => {ECS.removeEntity(reciever.id);}, 1000);
					} else {
						if(reciever.has("animatedSprite")) {
							if(reciever.animatedSprite.sprite.tint == 0xBB8899)
								setTimeout(() => reciever.animatedSprite.sprite.tint = 0xFFFFFF, 200);
						}
					}

					if(damager.has("throwable")) {
						if(damager.enemyDamager.damagedEntities.length > damager.throwable.pierce) {
							damager.removeComponent("enemyDamager");
							damager.velocity.x = -2 * damager.animatedSprite.sprite.scale.x;
							damager.velocity.y = -2.5;
							damager.animatedSprite.sprite.zIndex = 1000;
							damager.addComponent(new ECS.Components.Gravity());
						}			
					}

					if(damager.has("drill")) {
						let player = Object.values(entities).find(x => x.has("playerController"));
						if(player) {
							player.velocity.y = -2;
							player.mapCollider.grounded = true;
							do {
								player.position.y -= 2;
							} while(colliding(player, reciever));
						}
						setTimeout(() => {
							damager.enemyDamager.damagedEntities = [];
						}, 100);
						
					}

				}
			}

			// if an enemy is damaging the player
			if(damager.has("playerDamager") && reciever.has("playerController")) {
				let bound = entities[reciever.boundEntity.id];
				if(bound && bound.has("drill") && colliding(damager, bound)) {
					//
				} else if(colliding(damager, reciever)) {
					postScore(reciever.playerController.score);
					reciever.removeComponent("mapCollider");
					reciever.removeComponent("playerController");
					reciever.animatedSprite.setAnimation("Fall");
					reciever.velocity.x = -2 * reciever.animatedSprite.sprite.scale.x;
					reciever.velocity.y = -2.5;
					reciever.animatedSprite.sprite.zIndex = 1000;
					reciever.animatedSprite.sprite.tint = 0xBB8899;
					sounds.playerDamage.play();
					entities[reciever.boundEntity.id].animatedSprite.setAnimation("Idle");
					setTimeout(restart, 1600);
					freeze(250);
					return;
					
				}
			}
			
		}


		

	}
}