

class AnimatedSprite {
    constructor(spriteSheet, frameWidth, frameHeight, frameDuration, frames, loop) {
        this.spriteSheet = spriteSheet;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameDuration = frameDuration;
        this.frames = frames;
        this.loop = loop;
        this.frameIndex = 0;
        this.timeUntilNextFrame = 0;
        this.paused = false;
    }

    draw(context, x, y) {
        
        let frame = this.frames[this.frameIndex];
        context.drawImage(
            this.spriteSheet,
            this.frameWidth * frame, 0,
            this.frameWidth, this.frameHeight,
            x, y,
            this.frameWidth, this.frameHeight
        );

        this.timeUntilNextFrame++;
        if(this.timeUntilNextFrame > this.frameDuration) {
            this.frameIndex++;
            this.timeUntilNextFrame = 0;
        }
        if(this.frameIndex >= this.frames.length) {
            if(this.loop) {
                this.frameIndex = 0;
            } else {
                this.frameIndex = this.frames.length - 1;
            }
        }

    }

    play(frames) {
        if(frames) {
            this.frames = frames;
        }
        this.frameIndex = 0;
    }



}


let sounds = {};
let spritesheets = {};

function loadSounds() {
    sounds.explosion = new Audio('sounds/explosion.wav');
    sounds.explosion.volume = 0.15;

    sounds.beep = new Audio('sounds/beep.wav');
    sounds.beep.volume = 0.1;

    sounds.shoot = new Audio('sounds/shoot.wav');
    sounds.shoot.volume = 0.2;

    sounds.tick = new Audio('sounds/tick.wav');
    sounds.tick.volume = 0.02;

    sounds.hurt = new Audio('sounds/hurt.wav');
    sounds.hurt.volume = 0.05;

    sounds.b3 = new Audio('sounds/notes/b3.wav');
    sounds.b3.volume = 1;
    sounds.c3 = new Audio('sounds/notes/c3.wav');
    sounds.c3.volume = 1;
    sounds.e3 = new Audio('sounds/notes/e3.wav');
    sounds.e3.volume = 0.2;
    sounds.g3 = new Audio('sounds/notes/g3.wav');
    sounds.g3.volume = 0.7;
    sounds.c4 = new Audio('sounds/notes/c4.wav');
    sounds.c4.volume = 0.7;
    sounds.e4 = new Audio('sounds/notes/e4.wav');
    sounds.e4.volume = 1;
}

function loadSpritesheets() {
    spritesheets.greenDie = new Image();
    spritesheets.greenDie.src = 'images/dice/green-die.png';
    spritesheets.redDie = new Image();
    spritesheets.redDie.src = 'images/dice/red-die.png';
    spritesheets.goldenDie = new Image();
    spritesheets.goldenDie.src = 'images/dice/golden-die.png';

    
}

loadSounds();
loadSpritesheets();






function getNoteFromDieRoll(number) {
    switch(number) {
        case 6: return sounds.b3;
        case 5: return sounds.c3;
        case 4: return sounds.e3;
        case 3: return sounds.g3;
        case 2: return sounds.c4;
        case 1: return sounds.e4;
        default: console.error('Unknown note: ' + number);
    }
}