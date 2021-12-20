let keys = [];
document.addEventListener('keydown', event => {
    keys[event.key] = true;
});

document.addEventListener('keyup', event => {
    keys[event.key] = false;
});


let canvas = document.getElementById('canvas');

canvas.width = 600;
canvas.height = 600;
let fullScreen = true;
let context = canvas.getContext('2d');

if(fullScreen) {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
}


let view = {x: 0, y: 0};

function lerp(a, b, t) {
    return a + (b-a) * t;
}
function constrain(a, b, c) {
    if(a < b) return b;
    if(a > c) return c;
    return a;
}
// Make the view smoothly follow the player
function updateView(player){

    if(Date.now() - player.deathAnimationTimer < player.deathAnimationTimeMS) {
        targetX = player.deathX;
        targetY = player.deathY;
    } else {
        targetX = player.x;
        targetY = player.y;
    }

    let width = canvas.width;
    let height = canvas.height;

    let viewSmoothness = 0.01;

    view.x = lerp(view.x, targetX - width/2, viewSmoothness);
    view.y = lerp(view.y, targetY - height/2, viewSmoothness);
    
    view.y = constrain(view.y, 0, map.length * BLOCK_SIZE - height);

}

function fill(r, g, b, a=1) {
    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
}

function rect(x, y, w, h, view={x: 0, y: 0}) {
    context.fillRect(Math.round(x - view.x), Math.round(y - view.y), w, h);   
}
function triangle(x1, y1, x2, y2, x3, y3, view={x: 0, y: 0}) {
    context.beginPath();
    context.moveTo(Math.round(x1 - view.x), Math.round(y1 - view.y));
    context.lineTo(Math.round(x2 - view.x), Math.round(y2 - view.y));
    context.lineTo(Math.round(x3 - view.x), Math.round(y3 - view.y));
    context.fill();
}

function ellipse(x, y, w, h, view={x: 0, y: 0}) {
    context.beginPath();
    context.ellipse(x - view.x, y - view.y, w, h, 0, 0, 2 * Math.PI);
    context.fill();
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
const BLOCK_SIZE = 50;
const COLLISION_MARGIN = 5;

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.xVel = 0;
        this.yVel = 0;
        this.jumpForce = -435;
        this.defaultSpeed = 195;
        this.defaultGravity = 800;
        this.gravity = this.defaultGravity;
        this.speed = this.defaultSpeed;
        this.width = BLOCK_SIZE / 2;
        this.height = BLOCK_SIZE / 2;

        this.bounceForce = -600;

        this.spawnX = x;
        this.spawnY = y;
        this.spawnGravity = this.gravity;

        this.deathX = 0;
        this.deathY = 0;

        
        this.deathAnimationTimeMS = 300;
        this.deathAnimationTimer = this.deathAnimationTimeMS + 1;

        this.hardRestart();
        if(localStorage.getItem('spawnX3') !== null) {
            this.spawnX = parseFloat(localStorage.getItem('spawnX3'));
            this.spawnY = parseFloat(localStorage.getItem('spawnY3'));
            this.gravity = parseFloat(localStorage.getItem('gravity3'));
            this.restart();
            this.deathAnimationTimer = this.deathAnimationTimeMS + 1;
        } else {
            localStorage.setItem('spawnX3', this.spawnX);
            localStorage.setItem('spawnY3', this.spawnY);
            localStorage.setItem('gravity3', this.gravity);
        }


    }

    draw() {
        fill(204, 204, 204);
        rect(Math.round(this.x), Math.round(this.y), this.width, this.height, view);

        if(Date.now() - this.deathAnimationTimer > this.deathAnimationTimeMS) {
            this.deathAnimationTimer = 0;
        } else {
            let a = (Date.now() - this.deathAnimationTimer) / this.deathAnimationTimeMS;
            fill(255, 0, 0, 1-a);
            rect(Math.round(this.deathX), Math.round(this.deathY), this.width, this.height, view);
        }

    }

    update(delta) {
        if(keys['ArrowRight']) {
            this.x += this.speed * delta / 1000;
        }
        if(keys['ArrowLeft']) {
            this.x -= this.speed * delta / 1000;
        }

        this.yVel += this.gravity * delta / 1000;


        this.x += this.xVel * delta / 1000;
        this.y += this.yVel * delta / 1000;


    }

    hardRestart() {
        for(let i = 0; i < map.length; i++) {
            for(let j = 0; j < map[i].length; j++) {
                if(map[i][j] === MAP_BLOCK_TYPES.spawn) {
                    this.spawnX = j * BLOCK_SIZE + BLOCK_SIZE / 4;
                    this.spawnY = (i+1) * BLOCK_SIZE - this.height;
                    this.spawnGravity = this.defaultGravity;
                }
            }
        }
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.gravity = this.spawnGravity;
        this.xVel = 0;
        this.yVel = 0;
        this.speed = this.defaultSpeed;
        this.gravity = this.defaultGravity;

        this.deathAnimationTimer = 0;
    }

    restart() {
        this.deathAnimationTimer = Date.now();
        this.deathX = this.x;
        this.deathY = this.y;

        this.x = this.spawnX;
        this.y = this.spawnY;
        this.gravity = this.spawnGravity;
        this.xVel = 0;
        this.yVel = 0;
        this.speed = this.defaultSpeed;
        this.gravity = this.defaultGravity;


    }

}
let player = new Player(100, 100);


// collisionProtrusion is how far out of the block the hitbox protrudes
// boxWidth is how much shorter the hitbox should be
function collidingWithLeftOfBlock(player, blockX, blockY, collisionProtrusion=0, boxWidth=0) {
    return player.x + player.width > blockX - collisionProtrusion && player.x + player.width < blockX + COLLISION_MARGIN &&
           player.y + player.height > blockY + boxWidth && player.y < blockY + BLOCK_SIZE - boxWidth;
}
function collidingWithRightOfBlock(player, blockX, blockY, collisionProtrusion=0, boxWidth=0) {
    return player.x > blockX + BLOCK_SIZE - COLLISION_MARGIN && player.x < blockX + BLOCK_SIZE + collisionProtrusion &&
           player.y + player.height > blockY + boxWidth && player.y < blockY + BLOCK_SIZE - boxWidth;
}
function collidingWithTopOfBlock(player, blockX, blockY, collisionProtrusion=0, boxWidth=0) {
    return player.x + player.width > blockX + boxWidth && player.x < blockX + BLOCK_SIZE - boxWidth &&
           player.y + player.height > blockY - collisionProtrusion && player.y + player.height < blockY + COLLISION_MARGIN
}
function collidingWithBottomOfBlock(player, blockX, blockY, collisionProtrusion=0, boxWidth=0) {
    return player.x + player.width > blockX + boxWidth && player.x < blockX + BLOCK_SIZE - boxWidth &&
           player.y > blockY + BLOCK_SIZE - COLLISION_MARGIN && player.y < blockY + BLOCK_SIZE + collisionProtrusion
}

function collidingWithBlock(player, blockX, blockY, collisionProtrusion=0) {
    return player.x + player.width > blockX-collisionProtrusion && player.x < blockX + BLOCK_SIZE + collisionProtrusion &&
           player.y + player.height > blockY-collisionProtrusion && player.y < blockY + BLOCK_SIZE + collisionProtrusion;
}


function collidePlayerWithBlock(player, blockType, blockX, blockY) {
    if(blockType === MAP_BLOCK_TYPES.block) {
        if(collidingWithTopOfBlock(player, blockX, blockY, 0, 2)) {
            if(player.gravity > 0) {
                if(player.yVel > 0) {
                    if(keys['ArrowUp']) {
                        if(player.gravity > 0) {
                            player.yVel = player.jumpForce;
                            player.y -= 0.1;
                        }
                    } else {
                        player.yVel = 0;
                        player.y = blockY-player.height;
                    }
                }
            } else {
                player.yVel = 0;
                player.y = blockY-player.height;
            }
        }
        if(collidingWithBottomOfBlock(player, blockX, blockY, 0, 2)){
            if(player.yVel < 0) {
                if(player.gravity < 0 && keys['ArrowUp']) {
                    if(player.gravity < 0) {
                        player.yVel = -player.jumpForce;
                        player.y += 0.1;
                    }
                } else {
                    player.yVel = 0;
                    player.y = blockY+BLOCK_SIZE;
                }
            }
        }
        if(collidingWithLeftOfBlock(player, blockX, blockY, 0, 2)) {
            player.xVel = 0;
            player.x = blockX-player.width;
        }
        if(collidingWithRightOfBlock(player, blockX, blockY, 0, 2)) {
            player.xVel = 0;
            player.x = blockX+BLOCK_SIZE;
        }
    }

    if(blockType === MAP_BLOCK_TYPES.red) {
        if(collidingWithBlock(player, blockX, blockY, 0)) {
            player.restart();
        }
    }

    if(blockType === MAP_BLOCK_TYPES.gravityUp) {
        if(collidingWithBlock(player, blockX, blockY, -1)) {
            player.gravity = -Math.abs(player.gravity);
        }
    }

    if(blockType === MAP_BLOCK_TYPES.gravityDown) {
        if(collidingWithBlock(player, blockX, blockY, -1)) {
            player.gravity = Math.abs(player.gravity);
        }
    }

    if(blockType === MAP_BLOCK_TYPES.checkpoint) {
        if(collidingWithBlock(player, blockX, blockY, 0)) {
            player.spawnX = blockX + BLOCK_SIZE / 4;
            player.spawnY = blockY + BLOCK_SIZE - player.height;

            localStorage.setItem('spawnX3', player.spawnX);
            localStorage.setItem('spawnY3', player.spawnY);
            localStorage.setItem('gravity3', player.gravity);
        }
    }

    if(blockType === MAP_BLOCK_TYPES.bounce) {
        if(collidingWithTopOfBlock(player, blockX, blockY, 0, 2)) {
            player.yVel = player.bounceForce;
        }
        if(collidingWithBottomOfBlock(player, blockX, blockY, 0, 2)){
            player.yVel = -player.bounceForce;
        }
        if(collidingWithLeftOfBlock(player, blockX, blockY, 0, 2)) {
            player.xVel = 0;
            player.x = blockX-player.width;
        }
        if(collidingWithRightOfBlock(player, blockX, blockY, 0, 2)) {
            player.xVel = 0;
            player.x = blockX+BLOCK_SIZE;
        }
    }

}

function handlePlayerCollisions(player) {
    let startX = Math.floor(player.x / BLOCK_SIZE);
    let startY = Math.floor(player.y / BLOCK_SIZE);
    let endX = Math.floor((player.x + player.width) / BLOCK_SIZE);
    let endY = Math.floor((player.y + player.height) / BLOCK_SIZE);

    startY = Math.max(startY, 0);
    endY = Math.min(endY, map.length-1);

    startY = Math.max(startY, 0);
    endY = Math.min(endY, map.length-1);

    for(let x = startX; x <= endX; x++) {
        for(let y = startY; y <= endY; y++) {
            if(map[y][x] !== MAP_BLOCK_TYPES.red && map[y][x] !== MAP_BLOCK_TYPES.bounce) {
                collidePlayerWithBlock(player, map[y][x], x * BLOCK_SIZE, y * BLOCK_SIZE);
            }
        }
    }
    for(let x = startX; x <= endX; x++) {
        for(let y = startY; y <= endY; y++) {
            if(map[y][x] === MAP_BLOCK_TYPES.red || map[y][x] === MAP_BLOCK_TYPES.bounce) {
                collidePlayerWithBlock(player, map[y][x], x * BLOCK_SIZE, y * BLOCK_SIZE);
            }
        }
    }
}



function drawMap() {
    let startY = Math.floor(view.y / BLOCK_SIZE) - 1;
    let endY = Math.floor((view.y + canvas.height) / BLOCK_SIZE) + 1;
    startY = Math.max(startY, 0);
    endY = Math.min(endY, map.length-1);
    
    let startX = Math.floor(view.x / BLOCK_SIZE) - 1;
    let endX = Math.floor((view.x + canvas.width) / BLOCK_SIZE) + 1;
    startX = Math.max(startX, 0);
    endX = Math.min(endX, map[0].length-1);


    for(let y = startY; y <= endY; y++) {
        for(let x = startX; x <= endX; x++) {
            let blockPos = {x: x * BLOCK_SIZE, y: y * BLOCK_SIZE};

            switch(map[y][x]) {
                case MAP_BLOCK_TYPES.empty:
                    break;
                case MAP_BLOCK_TYPES.block:
                    fill(255, 255, 255, 0.8);
                    rect(blockPos.x, blockPos.y, BLOCK_SIZE, BLOCK_SIZE, view);
                    break;
                case MAP_BLOCK_TYPES.red:
                    fill(255, 0, 0);
                    rect(blockPos.x, blockPos.y, BLOCK_SIZE, BLOCK_SIZE, view);
                    break;
                case MAP_BLOCK_TYPES.checkpoint:
                    fill(240, 240, 0);
                    rect(blockPos.x, blockPos.y, BLOCK_SIZE, BLOCK_SIZE, view);
                    fill(255, 255, 0.5);
                    rect(blockPos.x + BLOCK_SIZE/5, blockPos.y + BLOCK_SIZE/5, BLOCK_SIZE/1.75, BLOCK_SIZE/1.75, view);
                    break;
                case MAP_BLOCK_TYPES.bounce:
                    fill(205, 40, 205, 0.8);
                    rect(blockPos.x, blockPos.y, BLOCK_SIZE, BLOCK_SIZE, view);
                    fill(255, 0, 255);
                    // triangle(blockPos.x + BLOCK_SIZE/6, blockPos.y + BLOCK_SIZE/6, 
                    //     blockPos.x + BLOCK_SIZE/6, blockPos.y + BLOCK_SIZE * 5/6,
                    //     blockPos.x, blockPos.y + BLOCK_SIZE/2, view);
                    // triangle(blockPos.x + BLOCK_SIZE * 5/6, blockPos.y + BLOCK_SIZE/6,
                    //     blockPos.x + BLOCK_SIZE * 5/6, blockPos.y + BLOCK_SIZE * 5/6,
                    //     blockPos.x + BLOCK_SIZE, blockPos.y + BLOCK_SIZE/2, view);
                    triangle(blockPos.x + BLOCK_SIZE/6, blockPos.y + BLOCK_SIZE * 5/6,
                        blockPos.x + BLOCK_SIZE * 5/6, blockPos.y + BLOCK_SIZE * 5/6,
                        blockPos.x + BLOCK_SIZE/2, blockPos.y + BLOCK_SIZE, view);
                    triangle(blockPos.x + BLOCK_SIZE/6, blockPos.y + BLOCK_SIZE/6,
                        blockPos.x + BLOCK_SIZE * 5/6, blockPos.y + BLOCK_SIZE/6,
                        blockPos.x + BLOCK_SIZE/2, blockPos.y, view);

                    rect(Math.round(blockPos.x + BLOCK_SIZE/4), Math.round(blockPos.y + BLOCK_SIZE/4), BLOCK_SIZE/2, BLOCK_SIZE/2, view);
                    break;  
                case MAP_BLOCK_TYPES.gravityDown:
                    fill(10, 255, 100, 0.8);
                    rect(blockPos.x, blockPos.y, BLOCK_SIZE, BLOCK_SIZE, view);
                    fill(10, 100, 255, 0.8);
                    triangle(blockPos.x + BLOCK_SIZE/4, blockPos.y + BLOCK_SIZE/2,
                             blockPos.x + BLOCK_SIZE*3/4, blockPos.y + BLOCK_SIZE/2,
                             blockPos.x + BLOCK_SIZE/2, blockPos.y + BLOCK_SIZE*3/4, view);
                    break;
                case MAP_BLOCK_TYPES.gravityUp:
                    fill(10, 255, 100, 0.8);
                    rect(blockPos.x, blockPos.y, BLOCK_SIZE, BLOCK_SIZE, view);
                    fill(10, 100, 255, 0.8);
                    triangle(blockPos.x + BLOCK_SIZE/4, blockPos.y + BLOCK_SIZE/2,
                             blockPos.x + BLOCK_SIZE*3/4, blockPos.y + BLOCK_SIZE/2,
                             blockPos.x + BLOCK_SIZE/2, blockPos.y + BLOCK_SIZE/4, view);
                    break;
                default:
                    break;
            }
        }
    }
}


let framesRendered = 0;
let lastFrameTime = 0;
let renderFPS = 0;

let framesUpdated = 0;
let lastUpdateTime = 0;
let updateFPS = 0;


function gameLoop() {
    window.requestAnimationFrame(gameLoop);


    ++framesRendered;
    if(performance.now() - lastFrameTime > 1000) {
        renderFPS = framesRendered;
        framesRendered = 0;
        lastFrameTime = performance.now();
    }
    if(fullScreen) {
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
    }


    // Draw ///////////////////////////////////////////////////////////////
    fill(3, 3, 10);
    rect(0, 0, canvas.width, canvas.height);

    // draw fps
    fill(255, 255, 255);
    context.font = "20px Arial";
    context.fillText(`FPS: ${renderFPS}`, 5, 20);
    context.fillText(`UPS: ${updateFPS}`, 5, 40);


    drawMap();
    player.draw();


} gameLoop();


view.x = player.x;
view.y = player.y;

let lastUpdateStamp = performance.now();
window.setInterval(() => {
    // Update /////////////////////////////////////////////////////////////
    for(let i = 0; i < 8; i++) {
        let delta = (performance.now() - lastUpdateStamp);
        lastUpdateStamp = performance.now();

        if(delta > 10) {
            delta = 10;
        }

        if(keys['r']) {
            player.hardRestart();
        }
        if(keys['ArrowDown']) {
            player.y -= 200 * delta/1000;
            player.yVel = 0;
        }
        
        player.update(delta);
        handlePlayerCollisions(player);

        ++framesUpdated;
        if(performance.now() - lastUpdateTime > 1000) {
            updateFPS = framesUpdated;
            framesUpdated = 0;
            lastUpdateTime = performance.now();
        }
    }

    updateView(player);

}, 1000/250);







// let lastTime = performance.now();
// window.setInterval(() => {

//     if(fullScreen) {
//         canvas.width = document.documentElement.clientWidth;
//         canvas.height = document.documentElement.clientHeight;
//     }

//     // Update /////////////////////////////////////////////////////////////
//     for(let i = 0; i < 3; i++) {
//         let delta = (performance.now() - lastTime);
//         lastTime = performance.now();

//         if(delta > 32) {
//             delta = 32;
//         }

//         console.log(delta);


//         player.update(delta);
//         handlePlayerCollisions(player);
//     }



//     // Draw ///////////////////////////////////////////////////////////////
//     fill(3, 3, 10);
//     rect(0, 0, canvas.width, canvas.height);

//     drawMap();
//     player.draw();
// }, 1000/60);
