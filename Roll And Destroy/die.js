

class Die {
    constructor(spriteSheet, x, y) {
        this.sprite = new AnimatedSprite(spriteSheet, 9, 9, 5, [0], false);
        this.x = x;
        this.y = y;
    }

    draw(context) {
        this.sprite.draw(context, this.x, this.y);
    }

    // returns the value rolled
    roll(value) {
        let frames = [];
        for(let i = 0; i < 10; i++) {
            frames.push(Math.floor(Math.random() * 6));
        }
        if(value) {
            frames[frames.length - 1] = value || frames[frames.length - 1];
        }
        this.sprite.play(frames);
        let roll = this.sprite.frames[this.sprite.frames.length - 1] + 1;

        for(let i = 0; i < 10; ++i) {
            setTimeout(() => {
                sounds.tick.currentTime = 0;
                sounds.tick.volume = 0.05 + Math.random() * 0.08;
                sounds.tick.play();
            }, i * 100 + Math.random() * 10);
        }

        setTimeout(() => {
            getNoteFromDieRoll(roll).currentTime = 0;
            getNoteFromDieRoll(roll).play();
        }, 800);


        return roll;
    }

}

