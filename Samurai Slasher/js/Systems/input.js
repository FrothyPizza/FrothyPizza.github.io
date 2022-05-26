




ECS.Systems.input = entities => {

	// handle mobile input
	if(isMobile) {
		for(let id in entities) {
			let entity = entities[id];
			if(!entity.has("button")) continue;

			entity.button.pressed = false;
			for(let i = 0; i < touches.length; ++i) {
				let touch = touches[i];
				let touchPos = touchToCanvasCoords(touch);
				let x = entity.position.x + entity.bounds.offset.x;
				let y = entity.position.y + entity.bounds.offset.y;
				if(touchPos.x > x && touchPos.x < x + entity.bounds.x && 
					touchPos.y > y && touchPos.y < y + entity.bounds.y) {

					entity.button.pressed = true;
				}
			}


			if(entity.button.pressed) {
				entity.animatedSprite.setAnimation("Pressed");
			} else {
				entity.animatedSprite.setAnimation("Idle");
			}

			if(entity.button.type == "jump")
				Inputs.jumpDown = entity.button.pressed;
			else if(entity.button.type == "attack")
				Inputs.attackDown = entity.button.pressed;
			else if(entity.button.type == "left")
				Inputs.leftDown = entity.button.pressed;
			else if(entity.button.type == "right")
				Inputs.rightDown = entity.button.pressed;
		}
	}


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
			
			if(Inputs.rightDown) {
				entity.position.x += speed;
				sprite.sprite.scale.x = 1;
			}
			if(Inputs.leftDown) {
				entity.position.x -= speed;
				sprite.sprite.scale.x = -1;
			}
			ECS.Helpers.setPlayerDirection(entities, entity, sprite.sprite.scale.x);

			if(lastScale !== boundEntity.animatedSprite.sprite.scale.x)
				hideshow();

			if(boundEntity.has("throwable")) ++boundEntity.throwable.framesSinceLastAttack;
			if((Inputs.attackDown) && boundEntity.has("throwable")) {
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

						for(let i = 0; i < 5; ++i) {
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
				
			} else if(Inputs.attackDown && boundEntity.animatedSprite.currentAnimation !== "Attack") {
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


			if(entity.mapCollider.grounded && Inputs.jumpDown) {
				entity.velocity.y = -entity.playerController.jumpSpeed;
				entity.playerController.jumpHoldTimer.restart();

				sounds.jump.play();
			}

			
			if(entity.playerController.jumpHoldTimer.getElapsedTime() < entity.playerController.maxJumpHoldTime 
			   && Inputs.jumpDown) {
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


	//console.log(console.log(touchToCanvasCoords(touches[0])));



	
}



let Inputs = {
	leftDown: false,
	rightDown: false,
	jumpDown: false,
	attackDown: false,
}



window.mobileAndTabletCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };
let isMobile = mobileAndTabletCheck();

let touches = [];
if(isMobile) {
    canvas.addEventListener('touchstart', function(event) {
        touches = event.touches;
    }, false);

    canvas.addEventListener('touchmove', function(event) {
        touches = event.touches;
    }, false);

    canvas.addEventListener('touchend', function(event) {
        touches = event.touches;
    }, false);

}

function touchToCanvasCoords(touch) {
	if(!touch) return;
	let rect = canvas.getBoundingClientRect();
	let pixelSize = rect.width / canvas.width;
	return {
		x: (touch.clientX - rect.left) / pixelSize,
		y: (touch.clientY - rect.top) / pixelSize
	};
}



let keys = [];
let keyJustWentDown = [];
document.addEventListener('keydown', event => {
    keys[event.key] = true;
	keyJustWentDown[event.key] = true;

	if(event.key == "ArrowLeft" || event.key == "j")
		Inputs.leftDown = true;
	if(event.key == "ArrowRight" || event.key == "k")
		Inputs.rightDown = true;
	if(event.key == "z" || event.key == "d")
		Inputs.jumpDown = true;
	if(event.key == "x" || event.key == "f")
		Inputs.attackDown = true;


});
document.addEventListener('keyup', event => {
    keys[event.key] = false;

	if(event.key == "ArrowLeft" || event.key == "j")
		Inputs.leftDown = false;
	if(event.key == "ArrowRight" || event.key == "k")
		Inputs.rightDown = false;
	if(event.key == "z" || event.key == "d")
		Inputs.jumpDown = false;
	if(event.key == "x" || event.key == "f")
		Inputs.attackDown = false;
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
