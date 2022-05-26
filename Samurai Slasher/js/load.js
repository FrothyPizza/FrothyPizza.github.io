



function loadSprites(onload) {
	const I = "assets/images"
	app.loader.add('player', I + "/player.png")
		.add('background', I + "/background.png")
		.add('titleScreen', I + "/title-screen.png")
		.add('controlsText', I + "/controls-text.json")
		.add('crate', I + "/crate.png")
		.add('smallEnemySpritesheet', I + '/enemies/small-enemy.json')
		.add('bigEnemySpritesheet', I + '/enemies/big-enemy.json')
		.add('batSpritesheet', I + '/enemies/bat.json')
		.add('tallEnemySpritesheet', I + '/enemies/tall-enemy.json')
		.add('playerSpritesheet', I + '/player-sheet.json')
		.add('swordSpritesheet', I + '/weapons/sword.json')
		.add('spearSpritesheet', I + '/weapons/spear.json')
		.add('hammerSpritesheet', I + '/weapons/hammer.json')
		.add('drillSpritesheet', I + '/weapons/drill.json')
		.add('cannonSpritesheet', I + '/weapons/cannon.json')
		.add('shurikenSpritesheet', I + '/weapons/shuriken.json')
		.add('buttonSpritesheet', I + '/buttons/button.json')
		.add('rightButtonSpritesheet', I + '/buttons/right-button.json')
		.add('leftButtonSpritesheet', I + '/buttons/left-button.json')
	
	loadSounds();

	let loadText = document.createElement("p");
	loadText.innerText = "loading...";
	document.body.appendChild(loadText);

	
	
	app.loader.load(() => {
		loadText.remove();
		onload();
	});
}
 
let sounds = {};
function loadSounds() {
	sounds.music = new Audio('assets/sounds/music/battle_music_2_long.mp3');
	sounds.music.loop = true;
	sounds.music.volume = 0.2;

	sounds.jump = new Audio('assets/sounds/effects/jump.wav');
	sounds.hit = new Audio('assets/sounds/effects/hit.wav');
	sounds.damage = new Audio('assets/sounds/effects/damage.wav');
	sounds.powerup = new Audio('assets/sounds/effects/powerup.wav');
	sounds.playerDamage = new Audio('assets/sounds/effects/playerDamage.wav');

	sounds.playerDamage.volume = 0.3;
	sounds.powerup.volume = 0.13;
	sounds.jump.volume = 0.1;
	sounds.hit.volume = 0.12;
	sounds.damage.volume = 0.1;
}

let musicStarted = false;
let musicStartListenerFunc = () => {
	if(musicStarted) return;
	musicStarted = true;
	sounds.music.play();
	window.removeEventListener("keydown", musicStartListenerFunc);
}
window.addEventListener("keydown", musicStartListenerFunc);
window.onfocus = () => {
	sounds.music.play();
}

window.onblur = () => {
	sounds.music.pause();
}