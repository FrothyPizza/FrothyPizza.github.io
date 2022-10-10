

let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');

const CELL_SIZE = 5;
const WIDTH = 128;
const HEIGHT = 128;

canvas.height = HEIGHT;
canvas.width = WIDTH;

canvas.style.height = HEIGHT * CELL_SIZE + 'px';
canvas.style.width = WIDTH * CELL_SIZE + 'px';

let world = new CellMatrix();
let player = new Player(62, 62);
let entities = [];

let playTimeMS = 120000;
let playTimeClock = new Clock();
playTimeClock.start();
let hasHalfWayWarned = false;
let hasAlmostDoneWarned = false;


function restart() {
    world = new CellMatrix();
    player = new Player(40, 40);
    entities = [];
    playTimeClock.restart();
    hasHalfWayWarned = false;
    hasAlmostDoneWarned = false;
}

let greenDie = new Die(spritesheets.greenDie, 3, 3);
let goldenDie = new Die(spritesheets.goldenDie, 14, 3);
let redDie = new Die(spritesheets.redDie, 25, 3);


if(!localStorage.getItem('rollhighscore')) {
    localStorage.setItem('rollhighscore', 0);
}
let highscore = localStorage.getItem('rollhighscore');


async function beepXTimes(times, delay) {
    for(let i = 0; i < times; i++) {
        await beep(delay);
    }
}

async function beep(delay) {
    return new Promise(resolve => {
        setTimeout(() => {
            sounds.beep.currentTime = 0;
            sounds.beep.play();
            resolve();
        }, delay);
    });
}


setInterval(() => {
    let lastPlayerHealth = player.health;
    world.draw();
    world.update();

    player.update(world, entities);
    player.draw();

    
    greenDie.draw(context);
    goldenDie.draw(context);
    redDie.draw(context);

    if(Inputs.rollPressed) {
        rollDice(world, player, entities);
        Inputs.rollPressed = false;
    }

    if(player.dead || player.health <= 0 || playTimeClock.getElapsedTime() >= playTimeMS) {
        let high = localStorage.getItem('rollhighscore');
        if(player.score > high) {
            localStorage.setItem('rollhighscore', player.score);
            highscore = player.score;
            

        }
        restart();
    }

    for(let i = 0; i < entities.length; i++) {
        entities[i].update(world, player);
        entities[i].draw();

        if(entities[i].dead) {
            entities.splice(i, 1);
            i--;
        }
    }

    if(lastPlayerHealth != player.health) {
        context.fillStyle = 'rgb(255, 0, 0, 0.5)';
        context.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);
        sounds.hurt.play();
    }

    // draw player health bar in top right
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    context.fillRect(WIDTH - 35, 5, 32, 5);
    context.fillStyle = '#0f0';
    context.fillRect(WIDTH - 35, 5, Math.round(player.health / 3) - 1, 5);

    // draw player score in middle
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.font = '20px Arial';
    context.fillText(player.score, WIDTH / 2 - 5, HEIGHT / 2 - 5);

    // draw highscore below player score
    context.fillStyle = 'rgba(255, 255, 255, 0.2)';
    context.font = '10px Arial';
    context.fillText("hi: " + highscore, WIDTH / 2 - 9, HEIGHT / 2 + 4);


    // draw a blue bar on the top for play time
    let percentComplete = playTimeClock.getElapsedTime() / playTimeMS;
    context.fillStyle = `rgba(255, 0, 0, ${percentComplete * 0.5 + 0.5})`;
    context.fillRect(0, 0, WIDTH - WIDTH * percentComplete, 1);

    if(percentComplete > 0.4 && !hasHalfWayWarned) {
        hasHalfWayWarned = true;
        beepXTimes(3, 300);
    }

    if(playTimeMS - playTimeClock.getElapsedTime() < 5000 && !hasAlmostDoneWarned) {
        hasAlmostDoneWarned = true;
        beepXTimes(20, 250);
    }


    // // bottom
    // context.fillRect(WIDTH, HEIGHT - 1, -(WIDTH - WIDTH * percentComplete), 1);
    // // left
    // context.fillRect(0, 0, 1, HEIGHT - HEIGHT * percentComplete);
    




    // let x = mouse.x;
    // let y = mouse.y;
    // // draw a faint outline around the brush
    // for(let xm = 0; xm < brushSize; xm++) {
    //     for(let ym = 0; ym < brushSize; ym++) {
    //         context.fillStyle = 'rgba(255, 255, 255, 0.1)';
    //         context.fillRect(x + xm, y + ym, 1, 1);
    //     }
    // } 

}, 16.6666);








function place() {
    if(!keys["Shift"]) return;

    let positions = bresenham(
        mouse.x, mouse.y,
        mouse.lastX, mouse.lastY
    );

    for(let i = 0; i < positions.length; i++) {
        let x = positions[i].x;
        let y = positions[i].y;


        if(mouse.down || mouse.right) {
            let t = mouse.right ? 'empty' : selectedType;
            for(let xm = 0; xm < brushSize; xm++) {
                for(let ym = 0; ym < brushSize; ym++) {
                    if(x + xm <= 0 || x + xm >= world.width - 1 || y + ym <= 0 || y + ym >= world.height - 1) {
                        continue;
                    }
                    world.set(x + xm, y + ym, createCell(t, x + xm, y + ym));
                    // world.get(x + xm, y + ym).velocity.y = 1;
                    // world.get(x + xm, y + ym).velocity.x = Math.random() * 2 - 1;
                }
            }
        }

    }
}





function createCell(type, x, y) {
    switch(type) {
        case 'empty':
            return new Empty(x, y);
        case 'wall':
            return new Wall(x, y);
        case 'water':
            return new Water(x, y);
        case 'plant':
            return new Plant(x, y);
        case 'sand':
            return new Sand(x, y);
        case 'acid':
            return new Acid(x, y);
        case 'dirt':
            return new Dirt(x, y);
        case 'wood':
            return new Wood(x, y);
        case 'flammableGas':
            return new FlammableGas(x, y);
        case 'fire':
            return new Fire(x, y);
        case 'barrier':
            return new Barrier(x, y);
        default:
            return new Empty(x, y);
    }
}


let selectedType = 'wall';
let brushSize = 2;

window.addEventListener('keypress', e => {
    if(e.key === 'e') {
        selectedType = 'empty';
    }
    if(e.key === 'b') {
        selectedType = 'wall';
    }
    if(e.key === 's') {
        selectedType = 'sand';
    }
    if(e.key === 'p') {
        selectedType = 'plant';
    }
    if(e.key === 'w') {
        selectedType = 'water';
    }
    if(e.key === 'a') {
        selectedType = 'acid';
    }
    if(e.key === 'd') {
        selectedType = 'dirt';
    }
    if(e.key === 'o') {
        selectedType = 'wood';
    }
    if(e.key === 'g') {
        selectedType = 'flammableGas';
    }
    if(e.key === 'f') {
        selectedType = 'fire';
    }
    if(e.key === 'r') {
        selectedType = 'barrier';
    }
    if(e.key === 'x') {
        world.explode(mouse.x, mouse.y, 24);
    }
});

// scroll to change brush size
window.addEventListener('wheel', e => {
    brushSize = Math.max(1, brushSize + (e.deltaY > 0 ? 1 : -1));
    console.log(brushSize);
});




window.addEventListener('contextmenu', e => e.preventDefault());

// document.addEventListener('mousemove', place);
// document.addEventListener('mousedown', place);
// setInterval(place, 16);