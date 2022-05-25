




ECS.Systems.input = entities => {
	for(let id in entities) {
		let entity = entities[id];

		
		if(!entity.has("position", "playerController"))
			continue;

		let speed = entity.playerController.speed;

		if(!entity.has("mapCollider")) {
			if(keys['ArrowRight']) {
				entity.position.x += speed;
			}
			if(keys['ArrowLeft']) {
				entity.position.x -= speed;
			}
			if(keys['ArrowUp']) {
				entity.position.y -= speed;
			}
			if(keys['ArrowDown']) {
				entity.position.y += speed;
			}
			
		} else if(entity.has("velocity")) {
			const sprite = entity.sprite || entity.animatedSprite;


			
			let boundEntity = null;
			if(entity.has("boundEntity") && entities[entity.boundEntity.id].has("animatedSprite")) {
				boundEntity = entities[entity.boundEntity.id];
			}
			// this is a super hackey solution, but i don't feel like fixing the root problem
			let hideshow = () => {
				boundEntity.animatedSprite.sprite.visible = false;
				setTimeout(() => {boundEntity.animatedSprite.sprite.visible = true;}, 0);
			}
			let lastScale = boundEntity.animatedSprite.sprite.scale.x;
			
			if(keys['ArrowRight'] || keys['k']) {
				entity.position.x += speed;
				sprite.sprite.scale.x = 1;
			}
			if(keys['ArrowLeft'] || keys['j']) {
				entity.position.x -= speed;
				sprite.sprite.scale.x = -1;
			}
			ECS.Helpers.setPlayerDirection(entities, entity, sprite.sprite.scale.x);

			if(lastScale !== boundEntity.animatedSprite.sprite.scale.x)
				hideshow();

			if(boundEntity.has("throwable")) ++boundEntity.throwable.framesSinceLastAttack;
			if((keyJustWentDown["x"] || keyJustWentDown['f']) && boundEntity.has("throwable")) {
				if(boundEntity.throwable.framesSinceLastAttack > boundEntity.throwable.attackDelay) {
					
					if(boundEntity.enemyDamager.name == "cannon") {
						boundEntity.animatedSprite.setAnimation("Attack");
						boundEntity.animatedSprite.sprite.animationSpeed = 0.2;
						boundEntity.animatedSprite.sprite.loop = false;
		
						boundEntity.animatedSprite.sprite.onComplete = () => {
							boundEntity.animatedSprite.setAnimation("Idle");
							boundEntity.animatedSprite.sprite.animationSpeed = 0.1;
							boundEntity.animatedSprite.sprite.loop = true;
							// boundEntity.enemyDamager.enabled = false;
							boundEntity.animatedSprite.sprite.onComplete = () => {};
						}

						for(let i = 0; i < 6; ++i) {
							let shurik = ECS.Blueprints.cannonball(sprite.sprite.scale.x, entity.position.vec, true);
							shurik.position.y += 2;
							ECS.register(shurik);	
						}
					} else {
						let shurik = ECS.Blueprints.flyingShuriken(sprite.sprite.scale.x, entity.position.vec);
						shurik.position.y += 2;
						ECS.register(shurik);	

					}
					boundEntity.throwable.framesSinceLastAttack = 0;
					sounds.hit.play();
				}
				
			} else if((keyJustWentDown["x"] || keyJustWentDown['f']) && boundEntity.animatedSprite.currentAnimation !== "Attack") {
				boundEntity.animatedSprite.setAnimation("Attack");
				boundEntity.animatedSprite.sprite.animationSpeed = 0.2;
				boundEntity.animatedSprite.sprite.loop = false;
				if(boundEntity.enemyDamager.damageDelay > 0)
					setTimeout(() => {
						boundEntity.enemyDamager.enabled = true;
						sounds.hit.play();
					}, boundEntity.enemyDamager.damageDelay);
				else {
					boundEntity.enemyDamager.enabled = true;
					sounds.hit.play();
				}

				
				boundEntity.animatedSprite.sprite.onComplete = () => {
					boundEntity.animatedSprite.setAnimation("Idle");
					boundEntity.animatedSprite.sprite.animationSpeed = 0.1;
					boundEntity.animatedSprite.sprite.loop = true;
					// boundEntity.enemyDamager.enabled = false;
					boundEntity.animatedSprite.sprite.onComplete = () => {};
				}
			}


			if(entity.mapCollider.grounded && (keys['z'] || keys['d'])) {
				entity.velocity.y = -entity.playerController.jumpSpeed;
				entity.playerController.jumpHoldTimer.restart();

				sounds.jump.play();
			}

			
			if(entity.playerController.jumpHoldTimer.getElapsedTime() 
			   < entity.playerController.maxJumpHoldTime 
			   && (keys['z'] || keys['d'])) {
				entity.velocity.y = -entity.playerController.jumpSpeed;
				entity.playerController.hasCutJumpVelocity = true;
				if(entity.mapCollider.topColliding) {
					entity.playerController.hasCutJumpVelocity = true;
					entity.playerController.jumpHoldTimer.add(10000);
				}
			} else if(!entity.playerController.hasCutJumpVelocity) {
				entity.playerController.jumpHoldTimer.add(10000);
				entity.velocity.y *= entity.playerController.jumpReleaseMultiplier;
				entity.playerController.hasCutJumpVelocity = true;
			}

			
		}
	}

	keyJustWentDown = [];
}








let keys = [];
let keyJustWentDown = [];
document.addEventListener('keydown', event => {
    keys[event.key] = true;
	keyJustWentDown[event.key] = true;

});
document.addEventListener('keyup', event => {
    keys[event.key] = false;
});



let keyPressListeners = [];
function addKeyPressListener(key, callback) {
    let listener = {
        key: key,
        func: event => {
            if(event.key == key) {
                callback();
            }
        }
    }

    document.addEventListener('keydown', listener.func);
    keyPressListeners.push(listener);
}

function removeKeyListeners(key) {
    for(let i = 0; i < keyPressListeners.length; i++) {
        if(keyPressListeners[i].key == key) {
            document.removeEventListener('keydown', keyPressListeners[i].func);
            keyPressListeners.splice(i, 1);
            i--;
        }
    }
}
