

let currentlyRolling = false;
function rollDice(world, player, entities) {
    if(currentlyRolling) return;
    currentlyRolling = true;
    player.score += 1;

    let green = Math.floor(Math.random() * 6);
    let red = Math.floor(Math.random() * 6);
    let golden = Math.floor(Math.random() * 6);

    greenDie.roll(green);
    setTimeout(() => {
        goldenDie.roll(golden);
    }, 1000);
    setTimeout(() => {
        redDie.roll(red);
    }, 2000);

    setTimeout(() => {
        playEvent(world, player, entities, green, golden, red);
        currentlyRolling = false;
    }, 3000);
    return [green, golden, red];
}


function playEvent(world, player, entities, green, golden, red) {
    console.log(green, golden, red);

    let thing = getThingFromNumber(green);
    let element = getElementFromNumber(golden);
    let quantity = red + 3;

    if(thing === 'bomb') {
        for(let i = 0; i < quantity * 2; i++) {
            console.log('bomb');
            let explosive = new Explosive(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT), Math.random() * 6.28);
            // make it closer to the player
            while(explosive.colliding(world, explosive.x, explosive.y)) {
                explosive.x = Math.floor(Math.random() * WIDTH);
                explosive.y = Math.floor(Math.random() * HEIGHT);
                if(Math.random() > 0.5) {
                    explosive.x = player.x + Math.floor(Math.random() * 50) - 25;
                    explosive.y = player.y + Math.floor(Math.random() * 50) - 25;
                }
            }

            explosive.velocity.x = 0;
            explosive.velocity.y = 0;
            explosive.gravity = 0;
            explosive.explosionTime = 2000 + Math.random() * 1000;
            explosive.explosionRadius += Math.random() * 30;
            if(red === 5) {
                explosive.explosionIntensity = 12;
            }
            entities.push(explosive);
        }
    }

    if(thing === 'meep') {
        for(let i = 0; i < quantity * 2; i++) {
            let meep = createMeep(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT), element);
            while(meep.colliding(world, meep.x, meep.y)) {
                meep.x = Math.floor(Math.random() * WIDTH);
                meep.y = Math.floor(Math.random() * HEIGHT);
            }
            entities.push(meep);
        }
    }

    if(thing === 'seeker') {
        for(let i = 0; i < quantity - 2; i++) {
            let seeker = createSeeker(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT), element);
            while(seeker.colliding(world, seeker.x, seeker.y)) {
                seeker.x = Math.floor(Math.random() * WIDTH);
                seeker.y = Math.floor(Math.random() * HEIGHT);
            }
            entities.push(seeker);
        }
    }
}

function getElementFromNumber(n) {
    switch(n) {
        case 0: return 'sand';
        case 1: return 'water';
        case 2: return 'wall';
        case 3: return 'dirt';
        case 4: return 'acid';
        case 5: return 'acid';
    }
}

function getThingFromNumber(n) {
    switch(n) {
        case 0: return 'meep';
        case 1: return 'meep';
        case 2: return 'seeker';
        case 3: return 'seeker';
        case 4: return 'bomb';
        case 5: return 'bomb';
    }
}


