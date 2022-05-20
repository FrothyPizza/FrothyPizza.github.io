
const app = new PIXI.Application({
	width: 176, 
	height: 128, 
	view: document.getElementById("canvas"),
});
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
app.renderer.backgroundColor = 0xb2b2b2;

function freeze(ms) {
	app.ticker.stop();
	setTimeout(() => {app.ticker.start();}, ms);
}

const gameScene = new PIXI.Container();
gameScene.sortableChildren = true;
app.stage.addChild(gameScene);

let canvas = document.getElementById("canvas");
mouse.relativeContainer = canvas;

document.addEventListener("keydown", () => document.body.style.cursor = 'none');
document.addEventListener("mousemove", () => document.body.style.cursor = 'initial');





const ECS = {
	Components: {},
	Blueprints: {},
	Systems: {},
	Helpers: {},
	
	// entityID: entity
	entities: {},
	register: function(entity) {
		this.entities[entity.id] = entity;
	},
	removeEntity: function(id) {
		// console.log(this.entities[id].components);
		// this.entities[id].components.forEach(name => {
		// 	this.entities[id].removeComponent(name);
		// });
		if(!this.entities[id]) return;
		this.entities[id].destroy();
		delete this.entities[id];
		//console.log("Entities: " + Object.entries(this.entities).length);
	}
};




window.onload = () => {
	loadSprites(main);
	
}

 


let started = false;
function main() {
	if(!localStorage.getItem("samhighscore"))
		localStorage.setItem("samhighscore", 0);
	
    console.log("Game Started");

	
	const systems = [
		ECS.Systems.mapCollisions,
		ECS.Systems.damageCollisions,
		ECS.Systems.crateCollisions,
		ECS.Systems.enemySpawner,
		ECS.Systems.physics,
		ECS.Systems.input,	
		ECS.Systems.enemyBehavior,
		ECS.Systems.animation,
	];
	
	
	let startScreen = new ECS.Entity();
	startScreen.addComponent(new ECS.Components.Sprite(app.loader.resources.titleScreen.texture, gameScene));
	startScreen.addComponent(new ECS.Components.Position(0, 0));
	ECS.register(startScreen);

	let controlsText = new ECS.Entity();
	controlsText.addComponent(new ECS.Components.AnimatedSprite
		(app.loader.resources.controlsText.spritesheet, gameScene, false));
	controlsText.addComponent(new ECS.Components.Position(73, 57));
	controlsText.animatedSprite.sprite.animationSpeed = 0.15;
	ECS.register(controlsText);

	let player = ECS.Blueprints.player();
	player.removeComponent("gravity");
	// player.position.vec = new Vec2(86, 66);
	ECS.register(player);

	let sword = ECS.Blueprints.weapon("sword");
	player.addComponent(new ECS.Components.BoundEntity(sword.id));
	ECS.register(sword);

	let start = () => {
		ECS.removeEntity(startScreen);
		ECS.removeEntity(player);
		ECS.removeEntity(sword);
		console.log("A");
		restart();
		document.removeEventListener("keydown", start);
	}
	document.addEventListener("keydown", start);
	
	
	app.ticker.maxFPS = 63;
	if(!started) {
		started = true;
		app.ticker.add(() => {
			for(let i = 0; i < systems.length; ++i) {
				// passing in all of the entities to every system 
				// is kinda a naive approach, but who cares about optimization
				systems[i](ECS.entities);
			}
		});
	}

	
}


function restart() {
	console.log("Game Restarted");
	
	Object.entries(ECS.entities).forEach(e => {ECS.removeEntity(e[0])});
	gameScene.removeChildren();
	
	ECS.entities = {};

	
	let map = new ECS.Entity();
	map.addComponent(new ECS.Components.Sprite(app.loader.resources.background.texture, gameScene));
	map.sprite.sprite.zIndex = 100;
	map.addComponent(new ECS.Components.Position(0, 0));
	map.addComponent(new ECS.Components.TileCollisionMask(Globals.map, 8));
	ECS.register(map);

	// let player = ECS.Blueprints.physicsy();
	// // player.addComponent(new ECS.Components.Sprite
	// // 	(app.loader.resources.player.texture, gameScene, true));
	// player.addComponent(new ECS.Components.AnimatedSprite
	// 	(app.loader.resources.playerSpritesheet.spritesheet, gameScene, true));
	// player.addComponent(new ECS.Components.Bounds(6, 8));
	// player.addComponent(new ECS.Components.PlayerController());
	// player.addComponent(new ECS.Components.Health(1));
	// player.position.vec = new Vec2(88, 88);
	// player.animatedSprite.offset.x = -3;
	let player = ECS.Blueprints.player();
	ECS.register(player);

	let score = new ECS.Entity();
	score.addComponent(new ECS.Components.Score());
	score.addComponent(new ECS.Components.Position(92, 60));
	score.addComponent(new ECS.Components.Text("23", 320, gameScene));
	score.text.textObj.text = 0;
	ECS.register(score);
 
	let highscore = new ECS.Entity();
	highscore.addComponent(new ECS.Components.Highscore());
	highscore.addComponent(new ECS.Components.Position(92, 76));
	highscore.addComponent(new ECS.Components.Text("23", 200, gameScene));
	highscore.text.textObj.text = "hi:" + localStorage.getItem("samhighscore");
	ECS.register(highscore);

	let crate = ECS.Blueprints.crate();
	ECS.register(crate);


	let sword = ECS.Blueprints.weapon("drill");
	player.addComponent(new ECS.Components.BoundEntity(sword.id));
	ECS.register(sword);


	let spawner = new ECS.Entity();
	spawner.addComponent(new ECS.Components.Position(88, -4));
	spawner.addComponent(new ECS.Components.EnemySpawner(1800));
	ECS.register(spawner);


}

