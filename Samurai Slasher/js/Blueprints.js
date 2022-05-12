
ECS.Blueprints.physicsy = () => {
	let e = new ECS.Entity();
	e.addComponent(new ECS.Components.Position());
	e.addComponent(new ECS.Components.Velocity());
	e.addComponent(new ECS.Components.Gravity());
	e.addComponent(new ECS.Components.MapCollider());
	return e;
}

ECS.Blueprints.enemy = (type) => {
	let e = ECS.Blueprints.physicsy();
	e.addComponent(new ECS.Components.Bounds(5, 6));
	e.addComponent(new ECS.Components.EnemyBehavior());
	e.addComponent(new ECS.Components.Health(1));
	e.addComponent(new ECS.Components.PlayerDamager(1));
	if(type == 0) {
		e.addComponent(new ECS.Components.AnimatedSprite
			(app.loader.resources.smallEnemySpritesheet.spritesheet, gameScene, true));
	} else if(type == 1) {
		e.addComponent(new ECS.Components.AnimatedSprite
			(app.loader.resources.bigEnemySpritesheet.spritesheet, gameScene, true));
		e.animatedSprite.sprite.animationSpeed = 0.0666;
		e.health.value = 4;
		e.bounds.vec = new Vec2(12, 12);
		e.enemyBehavior.speed = 0.25;
	} else if(type == 2) {
		e.addComponent(new ECS.Components.AnimatedSprite
			(app.loader.resources.batSpritesheet.spritesheet, gameScene, true));
		e.health.value = 1;
		e.bounds.vec = new Vec2(6, 8);
		e.animatedSprite.offset.x = -2;
		e.addComponent(new ECS.Components.FlyingEnemy());
		e.gravity.y = 0.075;
	}
	
	return e;
}

ECS.Blueprints.player = () => {
	let player = ECS.Blueprints.physicsy();
	// player.addComponent(new ECS.Components.Sprite
	// 	(app.loader.resources.player.texture, gameScene, true));
	player.addComponent(new ECS.Components.AnimatedSprite
		(app.loader.resources.playerSpritesheet.spritesheet, gameScene, true));
	player.addComponent(new ECS.Components.Bounds(6, 8));
	player.addComponent(new ECS.Components.PlayerController());
	player.addComponent(new ECS.Components.Health(1));
	player.position.vec = new Vec2(86, 66);
	player.animatedSprite.offset.x = -3;

	return player;
}

//const WEAPONS = ["sword", "hammer", "spear", "shuriken", "cannon"]; // dagger, bow, more?
let WEAPONS = [];
let addWeapon = (name, weight) => {
	for(let i = 0; i < weight; ++i)
		WEAPONS.push(name);
} 
addWeapon("sword", 5);
addWeapon("hammer", 5);
addWeapon("spear", 5);
addWeapon("shuriken", 5);
addWeapon("cannon", 1);


ECS.Blueprints.weapon = (type) => {
	if(!WEAPONS.includes(type)) {
		console.error("Weapon " + type + " attempted to be added")
		return;
	}
	
	let e = new ECS.Entity();
	

	e.addComponent(new ECS.Components.Position());
	e.addComponent(new ECS.Components.EnemyDamager(1));
	e.enemyDamager.enabled = false;

	
	e.enemyDamager.name = type;
	if(type == "sword") {
		e.addComponent(new ECS.Components.Bounds(23, 16));
		e.bounds.offset.x = 4;
		//e.bounds.offset.y = 4;
		e.bounds.offset.y = -e.bounds.y/2;
		
		e.addComponent(new ECS.Components.AnimatedSprite
			(app.loader.resources.swordSpritesheet.spritesheet, gameScene, false));
		e.animatedSprite.offset.y = e.animatedSprite.sprite.height/2 + 4;
	} else if(type == "hammer") {
		e.addComponent(new ECS.Components.Bounds(16, 18))
		e.enemyDamager.damage = 4;
		e.enemyDamager.damageDelay = 50;
		e.bounds.offset.x = 4;
		e.bounds.offset.y = -e.bounds.y/2;

		e.addComponent(new ECS.Components.AnimatedSprite
			(app.loader.resources.hammerSpritesheet.spritesheet, gameScene, false));
		e.animatedSprite.offset.y = e.animatedSprite.sprite.height/2 + 4;
		
	} else if(type == "spear") {
		e.addComponent(new ECS.Components.Bounds(42, 6));
		e.enemyDamager.damage = 1.5;
		e.bounds.offset.x = 4;
		e.bounds.offset.y = 3;
		e.bounds.offset.y = -e.bounds.y/2;

		e.addComponent(new ECS.Components.AnimatedSprite
			(app.loader.resources.spearSpritesheet.spritesheet, gameScene, false));
		e.animatedSprite.offset.y = e.animatedSprite.sprite.height/2 + 4;
		

	} else if(type == "shuriken") {
		e.addComponent(new ECS.Components.Bounds(4, 4));
		e.addComponent(new ECS.Components.AnimatedSprite
			(app.loader.resources.shurikenSpritesheet.spritesheet, gameScene, false));
		e.addComponent(new ECS.Components.Throwable(25));
		e.animatedSprite.offset.x = -4;
		e.animatedSprite.offset.y = 2;
		
		e.enemyDamager.framesEnabled = 0; // prevent it from attacking
		e.enemyDamager.enabled = true;
		
		// const rectangle = PIXI.Sprite.from(PIXI.Texture.WHITE);
		// rectangle.width = e.bounds.x;
		// rectangle.height = e.bounds.y;
		// rectangle.tint = 0xFF0000;
		// gameScene.addChild(rectangle);
		// setInterval(() => {
		// 	rectangle.x = e.position.x + e.bounds.offset.x;
		// 	rectangle.y = e.position.y + e.bounds.offset.y;
		// }, 0);
	} else if(type == "cannon") {
		e.addComponent(new ECS.Components.Bounds(23, 16));
		e.bounds.offset.x = 4;
		//e.bounds.offset.y = 4;
		e.bounds.offset.y = -e.bounds.y/2;
		
		e.addComponent(new ECS.Components.AnimatedSprite
			(app.loader.resources.cannonSpritesheet.spritesheet, gameScene, false));
		e.animatedSprite.offset.y = e.animatedSprite.sprite.height/2 + 4;
		e.addComponent(new ECS.Components.Throwable(20));
	}


	return e;
}

ECS.Blueprints.flyingShuriken = (dir, pos) => {
	let e = ECS.Blueprints.weapon("shuriken");
	e.addComponent(new ECS.Components.Velocity(4 * dir, 0));
	e.animatedSprite.setAnimation("Attack");
	e.animatedSprite.offset = new Vec2(0, 0);
	e.animatedSprite.sprite.scale.x = dir;
	e.enemyDamager.framesEnabled = 10000;
	e.position.vec = pos.copy();

	setTimeout(() => {
		ECS.removeEntity(e.id);
	}, 2000);
	return e;
}

ECS.Blueprints.cannonball = (dir, pos, random) => {
	let e = ECS.Blueprints.weapon("shuriken");
	e.addComponent(new ECS.Components.Velocity(3 * dir, -2.5));
	if(random) {
		e.velocity.x += Math.random() * 2 - 1;
		e.velocity.y += Math.random() * 2 - 1;
	}
	e.addComponent(new ECS.Components.Gravity());
	e.animatedSprite.setAnimation("Attack");
	e.animatedSprite.offset = new Vec2(0, 0);
	e.animatedSprite.sprite.scale.x = dir;
	e.enemyDamager.framesEnabled = 10000;
	e.position.vec = pos.copy();

	setTimeout(() => {
		ECS.removeEntity(e.id);
	}, 2000);
	return e;
}


ECS.Blueprints.crate = () => {
	let e = new ECS.Entity();
	e.addComponent(new ECS.Components.Position());
	e.addComponent(new ECS.Components.Collectable());
	e.addComponent(new ECS.Components.Bounds(8, 8));
	e.addComponent(new ECS.Components.Sprite
		(app.loader.resources.crate.texture, gameScene, false));
	e.sprite.sprite.zIndex = -1;
	e.position.vec = e.collectable.getRandomLocation()
	return e;
} 
