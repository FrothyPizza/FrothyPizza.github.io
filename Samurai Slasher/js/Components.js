
function vec2fromTwoparams(param1, param2) {
	let vec;
	if(param1 instanceof Vec2)
		vec = param1.copy();
	else if(!isNaN(param1) && !isNaN(param2))
		vec = new Vec2(param1, param2);
	else
		vec = new Vec2(0, 0);
	return vec;
}


class Vectory {
	constructor(x, y) {
		this.vec = vec2fromTwoparams(x, y);
	}	
	set x(x) { this.vec.x = x; }
	get x() { return this.vec.x; }
	set y(y) { this.vec.y = y; }
	get y() { return this.vec.y; }
}

ECS.Components.Position = class position extends Vectory {
	constructor(x, y) {
		super(x, y);
		this.last = this.vec.copy();
	}	
}

ECS.Components.Velocity = class velocity extends Vectory {
	constructor(x, y) {
		super(x, y);
	}
}

ECS.Components.Health = class health {
	constructor(health) {
		this.value = health || 2;
	}	
}

ECS.Components.Sprite = class sprite {
	constructor(sprite, scene, centered=false) {
		if(sprite instanceof PIXI.Sprite) {
			this.sprite = sprite;
		} else if(sprite instanceof PIXI.Texture) {
			this.sprite = new PIXI.Sprite(sprite);
		}
		this.scene = scene;
		this.scene.addChild(this.sprite);

		this.offset = new Vec2(0, 0);

		if(centered) {
			this.sprite.anchor.x = 0.5; 	
		}
		this.centered = centered;
	}

	destroy() {
		this.scene.removeChild(this.sprite);
	}
}

// TODO: do
ECS.Components.AnimatedSprite = class animatedSprite {
	constructor(sheet, scene, centered=false) {
		this.sheet = sheet;
		this.sprite = new PIXI.AnimatedSprite(Object.entries(sheet.animations)[0][1]);
		this.currentAnimation = Object.entries(sheet.animations)[0][0];
		this.sprite.animationSpeed = 0.1;

		this.scene = scene;
		this.scene.addChild(this.sprite);
		this.sprite.play();

		this.offset = new Vec2(0, 0);

		if(centered) {
			this.sprite.anchor.x = 0.5; 	
			this.offset.x = -this.sprite.width/2;
		}
		this.centered = centered;
	}

	destroy() {
		this.scene.removeChild(this.sprite);
	}

	setAnimation(name) {
		if(this.currentAnimation == name) return;
		if(!this.sheet.animations[name]) return;
		this.sprite.stop();
		this.sprite.textures = this.sheet.animations[name];
		this.sprite.play();
		this.currentAnimation = name;
	}
}


ECS.Components.Text = class text {
	constructor(text, size, scene) {
		this.textObj = new PIXI.Text(text,{fontFamily : 'Arial', fontSize: size, fill : 0xFFFFFF, align : 'center'});
		this.textObj.anchor.x = 0.5;
		this.textObj.anchor.y = 0.5;
		this.textObj.scale.x = 0.0625;
		this.textObj.scale.y = 0.0625;
		this.textObj.zIndex = -2;
		this.scene = scene;
		scene.addChild(this.textObj);
	}

	destroy() {
		this.scene.removeChild(this.textObj);
	}
}

ECS.Components.Score = class score {
	constructor() {
		
	}
}

ECS.Components.Highscore = class highscore {
	constructor() {
		
	}
}



ECS.Components.Gravity = class gravity {
	static defaultGravity = 0.15;
	static maxGravity = 4;
	
	constructor(grav) {
		if(!grav)
			this.vec = new Vec2(0, ECS.Components.Gravity.defaultGravity);
		else if(grav instanceof Vec2)
			this.vec = grav.copy();
		else if(!isNaN(grav))
			this.vec = new Vec2(0, grav);

		this.maxGravity = ECS.Components.Gravity.maxGravity;
	}
	set x(x) { this.vec.x = x; }
	get x() { return this.vec.x; }
	set y(y) { this.vec.y = y; }
	get y() { return this.vec.y; }
}


ECS.Components.PlayerController = class playerController {
	constructor(enabled=true) {
		this.enabled = enabled;
		
		this.speed = 1;
		this.score = 0;

		this.jumpSpeed = 2.5;
		this.jumpReleaseMultiplier = 0.7;
		this.maxJumpHoldTime = 170;
		this.jumpHoldTimer = new Clock();
		this.jumpHoldTimer.add(this.maxJumpHoldTime + 1000);
		this.hasCutJumpVelocity = false;
	}
}

ECS.Components.MapCollider = class mapCollider {
	constructor(enabled=true) {
		this.enabled = enabled;
		
		this.grounded = false;
		this.rightColliding = false;
		this.leftColliding = false;
		this.topColliding = false;

	}
}

ECS.Components.TileCollisionMask = class tileCollisionMask {
	// e.g.
	// ######
	// #    #
	// # #  #
	// ######
	constructor(collisionMask, tileSize) {
		this.collisionMask = collisionMask;
		this.tileSize = tileSize || 8;
	}
}

// used for things like collisions
ECS.Components.Bounds = class bounds extends Vectory {
	constructor(width, height) {
		super(width, height);
		this.offset = new Vec2(0, 0);
	}
}

// whether an entity is bound to the one with the component
// e.g. the player might have a BoundEntity that is the gun/sword
ECS.Components.BoundEntity = class boundEntity {
	constructor(entityID, offsetX, offsetY) {
		this.id = entityID;
		this.offset = vec2fromTwoparams(offsetX, offsetY);
	}
}



ECS.Components.EnemySpawner = class enemySpawner {
	constructor(spawnDelay) {
		this.spawnDelay = spawnDelay;
		this.tempSpawnDelay = spawnDelay;
		this.spawnTimer = new Clock();
		this.spawnTimer.start();
	}
}


ECS.Components.EnemyBehavior = class enemyBehavior {
	constructor(direction) {
		this.direction = direction || (Math.random() > 0.5 ? 1 : -1)
		this.speed = 0.5;
		this.enragedSpeed = this.speed * 2;
		this.enraged = false;
	}
}

ECS.Components.FlyingEnemy = class flyingEnemy {
	constructor() {
		this.pulseStrength = 0.8;
	}
}

ECS.Components.PipeTraveller = class pipeTraveller {
	constructor() {
		this.spawnLocations = [new Vec2(64, 7), new Vec2(108, 7)];
	}
}

ECS.Components.EnemyDamager = class enemyDamager {
	constructor(damage) {
		this.damageDelay = 0;
		this.framesEnabled = 4;
		this.frames = 0;
		this.damage = damage || 1;
		this.enabled = true;

		this.damagedEntities = [];
	}
}

ECS.Components.Throwable = class throwable {
	constructor(attackDelay) {
		this.attackDelay = attackDelay || 20;
		this.framesSinceLastAttack = this.attackDelay;
		this.pierce = 2;
	}
}


ECS.Components.PlayerDamager = class playerDamager {
	constructor(damage) {
		this.damage = damage || 1;
	}
}

ECS.Components.Collectable = class collectable {
	constructor(spawnLocations) {
		this.spawnLocations = spawnLocations || Globals.crateLocations;
	}

	getRandomLocation() {
		return this.spawnLocations[Math.floor(Math.random() * this.spawnLocations.length)].copy();
	}
}