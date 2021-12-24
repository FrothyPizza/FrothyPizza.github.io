




const VERSON = "0.3.2";
if(localStorage.getItem("verson") != VERSON) {
    localStorage.clear();
    localStorage.setItem("verson", VERSON);
}
document.title = "Hal's Tower 3 - v" + VERSON;

class Clock {
    constructor() {
        this.startTime = 0;
        this.elapsedTime = 0;
        this.pausedTime = 0;
        this.isPaused = false;
        this.isStarted = false;
    }

    start() {
        this.startTime = Date.now();
        this.isStarted = true;
        this.isPaused = false;
    }

    pause() {
        if (this.isStarted && !this.isPaused) {
            this.isPaused = true;
            this.pausedTime = Date.now();
        }
    }

    resume() {
        if (this.isStarted && this.isPaused) {
            this.isPaused = false;
            this.startTime += (Date.now() - this.pausedTime);
        }
    }

    getElapsedTime() {
        if (this.isStarted && !this.isPaused) {
            this.elapsedTime = Date.now() - this.startTime;
        }
        return this.elapsedTime;
    }

    restart() {
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.isStarted = true;
        this.isPaused = false;
    }
}


let keys = [];
document.addEventListener('keydown', event => {
    keys[event.key] = true;
});

document.addEventListener('keyup', event => {
    keys[event.key] = false;
});



window.mobileAndTabletCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };
let isMobile = mobileAndTabletCheck();

let touches = [];
if(isMobile) {
    document.body.addEventListener('touchstart', function(event) {
        touches = event.touches;
    }, false);

    document.body.addEventListener('touchmove', function(event) {
        touches = event.touches;
    }, false);

    document.body.addEventListener('touchend', function(event) {
        touches = event.touches;
    }, false);
}


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
        targetX = player.deathX - player.width / 2;
        targetY = player.deathY - player.height / 2;
    } else {
        targetX = player.x - player.width / 2;
        targetY = player.y - player.height / 2;
    }

    let width = canvas.width;
    let height = canvas.height;

    let viewSmoothness = 0.01;


    view.x = lerp(view.x, targetX - width/2, viewSmoothness);
    view.y = lerp(view.y, targetY - height/2, viewSmoothness);
    
    // console.log(view.y - player.y);
    if(Math.abs(player.yVel) > 300) {
        if(targetY - view.y > canvas.height * 4/5) {
            view.y = targetY - canvas.height * 4/5;
        }
        if(targetY - view.y < canvas.height * 1/8) {
            view.y = targetY - canvas.height * 1/8;
        }

    }

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
const COLLISION_MARGIN = 8;

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.xVel = 0;
        this.yVel = 0;
        this.defaultJumpForce = -435;
        this.jumpForce = this.defaultJumpForce;
        this.defaultSpeed = 195;
        this.defaultGravity = 800;
        this.gravity = this.defaultGravity;
        this.speed = this.defaultSpeed;
        this.width = BLOCK_SIZE / 2;
        this.height = BLOCK_SIZE / 2;

        this.lastTimerGrounded = 0;

        this.bounceForce = -600;

        this.spawnX = x;
        this.spawnY = y;
        this.spawnGravity = this.gravity;

        this.deathX = 0;
        this.deathY = 0;

        this.speedUpSpeed = 400;
        this.speedUpTimer = 0;
        this.speedUpTimeMS = 5000;
        this.speedTrail = []; // [{x: 0, y: 0, time: 0}]
        this.speedTrailTimer = 0;
        this.speedTrailLifetime = 500;

        this.highJumpForce = -580;
        this.highJumpTimeMS = 8000;
        this.highJumpTimer = 0;
        this.highJumpTrail = []; // [{x: 0, y: 0, time: 0}]
        this.highJumpTrailTimer = 0;
        this.highJumpTrailLifetime = 500; 


        
        this.deathAnimationTimeMS = 300;
        this.deathAnimationTimer = this.deathAnimationTimeMS + 1;

        this.acquiredCheckpoints = [];

        this.hardRestart();
        if(localStorage.getItem('spawnX3') !== null) {
            this.spawnX = parseFloat(localStorage.getItem('spawnX3'));
            this.spawnY = parseFloat(localStorage.getItem('spawnY3'));
            this.spawnGravity = parseFloat(localStorage.getItem('gravity3'));
            console.log(localStorage.getItem('checkpoints3'));
            this.acquiredCheckpoints = JSON.parse(localStorage.getItem('checkpoints3'));
            this.restart();
            this.deathAnimationTimer = this.deathAnimationTimeMS + 1;
        } else {
            localStorage.setItem('spawnX3', this.spawnX);
            localStorage.setItem('spawnY3', this.spawnY);
            localStorage.setItem('gravity3', this.gravity);
            localStorage.setItem('checkpoints3', JSON.stringify(this.acquiredCheckpoints));
        }


    }

        

    draw() {

        // draw the speed trail
        for(let i = 0; i < this.speedTrail.length; i++) {
            if(Date.now() - this.speedTrail[i].time > this.speedTrailLifetime) {
                this.speedTrail.splice(i, 1);
                i--;
            } else {
                let trail = this.speedTrail[i];
                let alpha = 1 - (Date.now() - trail.time) / this.speedTrailLifetime;
                fill(0, 200, 200, alpha);
                rect(Math.round(trail.x), Math.round(trail.y), this.width, this.height, view);
            }
        }

        // every tenth of a second, add a speed trail point
        if(Date.now() - this.speedTrailTimer > 100 && Date.now() - this.speedUpTimer < this.speedUpTimeMS) {
            this.speedTrailTimer = Date.now();
            this.speedTrail.push({x: this.x, y: this.y, time: Date.now()});
        }

        // draw the high jump trail
        for(let i = 0; i < this.highJumpTrail.length; i++) {
            if(Date.now() - this.highJumpTrail[i].time > this.highJumpTrailLifetime) {
                this.highJumpTrail.splice(i, 1);
                i--;
            } else {
                let trail = this.highJumpTrail[i];
                let alpha = 1 - (Date.now() - trail.time) / this.highJumpTrailLifetime;
                fill(0, 230, 100, alpha);
                rect(Math.round(trail.x), Math.round(trail.y), this.width, this.height, view);
            }
        }

        // every seventh of a second, add a high jump trail point
        if(Date.now() - this.lastTimerGrounded > 10 && Date.now() - this.highJumpTrailTimer > 1000/7 && Date.now() - this.highJumpTimer < this.highJumpTimeMS) {
            this.highJumpTrailTimer = Date.now();
            this.highJumpTrail.push({x: this.x, y: this.y, time: Date.now()});
        }


        // draw the player
        fill(204, 204, 204);
        rect(Math.round(this.x), Math.round(this.y), this.width, this.height, view);

        // draw a teal blue bar at the right of the player to indicate how much time they have left sped up
        fill(0, 240, 240, 0.9);
        let fraction = 1 - (Date.now() - this.speedUpTimer) / this.speedUpTimeMS;
        if(fraction > 0) {
            rect(Math.round(this.x), Math.round(this.y + (1-fraction)*this.height), 5, Math.round(this.height * fraction), view);
        }

        // draw the jump bar
        fill(0, 230, 100, 0.8);
        fraction = 1 - (Date.now() - this.highJumpTimer) / this.highJumpTimeMS;
        if(fraction > 0) {
            rect(Math.round(this.x + this.width-5), Math.round(this.y + (1-fraction)*this.height), 5, Math.round(this.height * fraction), view);
        }

        // draw the death animation
        if(Date.now() - this.deathAnimationTimer > this.deathAnimationTimeMS) {
            this.deathAnimationTimer = 0;
        } else {
            let a = (Date.now() - this.deathAnimationTimer) / this.deathAnimationTimeMS;
            fill(255, 0, 0, 1-a);
            rect(Math.round(this.deathX), Math.round(this.deathY), this.width, this.height, view);
        }

    }

    update(delta) {
        if(keys['ArrowRight'] || keys['d']) {
            this.x += this.speed * delta / 1000;
        }
        if(keys['ArrowLeft'] || keys['a']) {
            this.x -= this.speed * delta / 1000;
        }

        this.yVel += this.gravity * delta / 1000;


        this.x += this.xVel * delta / 1000;
        this.y += this.yVel * delta / 1000;

        if(Date.now() - this.speedUpTimer < this.speedUpTimeMS) {
            this.speed = this.speedUpSpeed;
        } else {
            this.speed = this.defaultSpeed;
        }

        if(Date.now() - this.highJumpTimer < this.highJumpTimeMS) {
            this.jumpForce = this.highJumpForce;
        } else {
            this.jumpForce = this.defaultJumpForce;
        }


        // console.log(Date.now() - this.lastTimerGrounded);
        if(isMobile) { 
            for(let i = 0; i < touches.length; ++i) {
                if(touches[i].clientX > canvas.width/2 && touches[i].clientY > canvas.height/2) {
                    this.x += this.speed * delta / 1000;
                }
                if(touches[i].clientX < canvas.width/2 && touches[i].clientY > canvas.height/2) {
                    this.x -= this.speed * delta / 1000;
                }
                if(Date.now() - this.lastTimerGrounded < 10 && touches[i].clientY < canvas.height/2) {
                    if(this.gravity < 0) {
                        this.yVel = -this.jumpForce;
                    } else {
                        this.yVel = this.jumpForce;
                    }

                    this.lastTimerGrounded = 0;
                }
            }
        }


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
        // this.gravity = this.defaultGravity;

        this.deathAnimationTimer = 0;
        this.speedUpTimer = 0;
        this.highJumpTimer = 0;
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
        // this.gravity = this.defaultGravity;

        this.speedUpTimer = 0;
        this.highJumpTimer = 0;


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
    if(blockType === MAP_BLOCK_TYPES.block || blockType === MAP_BLOCK_TYPES.flashingOn) {
        if(collidingWithTopOfBlock(player, blockX, blockY, 0, 2)) {
            if(player.gravity > 0) {
                if(player.yVel > 0) {
                    if(keys['ArrowUp'] || keys['w']) {
                        if(player.gravity > 0) {
                            player.yVel = player.jumpForce;
                            player.y = blockY-player.height;
                            // player.y -= 0.1;
                        }
                    } else {
                        player.yVel = 0;
                        player.y = blockY-player.height;
                        player.lastTimerGrounded = Date.now();
                    }
                }
            } else {
                if(player.yVel > 0) {
                    player.yVel = 0;
                    player.y = blockY-player.height;
                    // player.lastTimerGrounded = Date.now();
                }
            }
        }
        if(collidingWithBottomOfBlock(player, blockX, blockY, 0, 2)){
            if(player.gravity < 0) {
                if(player.yVel < 0) {
                    if(keys['ArrowUp'] || keys['w']) {
                        player.yVel = -player.jumpForce;
                        player.y = blockY+BLOCK_SIZE;
                        // player.y += 0.1;
                    } else {
                        player.yVel = 0;
                        player.y = blockY+BLOCK_SIZE;
                        player.lastTimerGrounded = Date.now();
                    }
                }
            } else {
                if(player.yVel < 0) {
                    player.yVel = 0;
                    player.y = blockY+BLOCK_SIZE;
                    // player.lastTimerGrounded = Date.now();
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
        if(collidingWithBlock(player, blockX, blockY, -0.1)) {
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

    if(blockType === MAP_BLOCK_TYPES.speedUp) {
        if(collidingWithBlock(player, blockX, blockY, 0)) {
            player.speedUpTimer = Date.now();
        }
    }

    if(blockType === MAP_BLOCK_TYPES.highJump) {
        if(collidingWithBlock(player, blockX, blockY, 0)) {
            player.highJumpTimer = Date.now();
        }
    }

    if(blockType === MAP_BLOCK_TYPES.checkpoint) {
        if(collidingWithBlock(player, blockX, blockY, 0)) {
            player.spawnX = blockX + BLOCK_SIZE / 4;
            player.spawnY = blockY + BLOCK_SIZE - player.height;
            player.spawnGravity = player.gravity;

            localStorage.setItem('spawnX3', player.spawnX);
            localStorage.setItem('spawnY3', player.spawnY);
            localStorage.setItem('gravity3', player.gravity);

            // if the checkpoint array doesn't have this checkpoint, add it
            if(!player.acquiredCheckpoints.includes(blockX + ',' + blockY)) {
                player.acquiredCheckpoints.push(blockX + ',' + blockY);
                localStorage.setItem('checkpoints3', JSON.stringify(player.acquiredCheckpoints));
            }
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
        let startX = Math.floor(view.x / BLOCK_SIZE) - 1;
        let endX = Math.floor((view.x + canvas.width) / BLOCK_SIZE) + 1;
        startX = Math.max(startX, 0);
        endX = Math.min(endX, map[y].length-1);
        for(let x = startX; x <= endX; x++) {
            let blockPos = {x: x * BLOCK_SIZE, y: y * BLOCK_SIZE};

            switch(map[y][x]) {
                case MAP_BLOCK_TYPES.empty:
                    break;
                case MAP_BLOCK_TYPES.block:
                    fill(255, 255, 255, 0.8);
                    rect(blockPos.x, blockPos.y, BLOCK_SIZE, BLOCK_SIZE, view);
                    break;
                case MAP_BLOCK_TYPES.flashingOn:
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
                    triangle(blockPos.x + BLOCK_SIZE/6, blockPos.y + BLOCK_SIZE * 5/6,
                        blockPos.x + BLOCK_SIZE * 5/6, blockPos.y + BLOCK_SIZE * 5/6,
                        blockPos.x + BLOCK_SIZE/2, blockPos.y + BLOCK_SIZE, view);
                    triangle(blockPos.x + BLOCK_SIZE/6, blockPos.y + BLOCK_SIZE/6,
                        blockPos.x + BLOCK_SIZE * 5/6, blockPos.y + BLOCK_SIZE/6,
                        blockPos.x + BLOCK_SIZE/2, blockPos.y, view);
                    rect(Math.round(blockPos.x + BLOCK_SIZE/4), Math.round(blockPos.y + BLOCK_SIZE/4), BLOCK_SIZE/2, BLOCK_SIZE/2, view);
                    break;  
                case MAP_BLOCK_TYPES.speedUp:
                    fill(0, 128, 238);
                    rect(blockPos.x, blockPos.y, BLOCK_SIZE, BLOCK_SIZE, view);
                    fill(0, 0, 0, 0.1);
                    rect(Math.round(blockPos.x + BLOCK_SIZE/8), Math.round(blockPos.y + BLOCK_SIZE/4), BLOCK_SIZE/2, BLOCK_SIZE/2, view);
                    fill(0, 0, 0, 0.2);
                    rect(Math.round(blockPos.x + BLOCK_SIZE/4), Math.round(blockPos.y + BLOCK_SIZE/4), BLOCK_SIZE/2, BLOCK_SIZE/2, view);
                    fill(0, 64, 128);
                    rect(Math.round(blockPos.x + BLOCK_SIZE*3/8), Math.round(blockPos.y + BLOCK_SIZE/4), BLOCK_SIZE/2, BLOCK_SIZE/2, view);                    
                    break;
                case MAP_BLOCK_TYPES.highJump:
                    fill(0, 238, 138);
                    rect(blockPos.x, blockPos.y, BLOCK_SIZE, BLOCK_SIZE, view);
                    fill(0, 0, 0, 0.1);
                    triangle(blockPos.x + BLOCK_SIZE/4, blockPos.y + BLOCK_SIZE*3/4,
                        blockPos.x + BLOCK_SIZE*3/4, blockPos.y + BLOCK_SIZE*3/4,
                        blockPos.x + BLOCK_SIZE/2, blockPos.y + BLOCK_SIZE/4, view);

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

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}

let flashingBlockTimer = Date.now();
function updateMap() {
    if(Date.now() - flashingBlockTimer > TIME_PER_FLASH_MS) {
        for(let y = 0; y < map.length; y++) {
            for(let x = 0; x < map[y].length; x++) {
                if(map[y][x] === MAP_BLOCK_TYPES.flashingOn) {
                    map[y] = map[y].replaceAt(x, MAP_BLOCK_TYPES.flashingOff);
                    
                } else if(map[y][x] === MAP_BLOCK_TYPES.flashingOff) {
                    map[y] = map[y].replaceAt(x, MAP_BLOCK_TYPES.flashingOn);
                }
            }
        }
        flashingBlockTimer = Date.now();
    }
}


let framesRendered = 0;
let lastFrameTime = 0;
let renderFPS = 0;

let framesUpdated = 0;
let lastUpdateTime = 0;
let updateFPS = 0;


// level editor stuff
// canvas.onclick = function(e) {
//     let x = Math.floor((e.clientX - canvas.offsetLeft + view.x) / BLOCK_SIZE);
//     let y = Math.floor((e.clientY - canvas.offsetTop + view.y) / BLOCK_SIZE);
//     if(x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
//         if(map[y][x] === MAP_BLOCK_TYPES.block) {
//             map[y] = map[y].replaceAt(x, MAP_BLOCK_TYPES.empty);
//         } else if(map[y][x] === MAP_BLOCK_TYPES.empty) {
//             map[y] = map[y].replaceAt(x, MAP_BLOCK_TYPES.block);
//         }
//     }
// }
// document.addEventListener("keydown", function(e) {
//     if(e.key === 'Enter') {
//         navigator.clipboard.writeText(JSON.stringify(map)).then(function() {
//             console.log('Async: Copying to clipboard was successful!');
//           }, function(err) {
//             console.error('Async: Could not copy text: ', err);
//           });
        
//     }
// });



function renderLoop() {
    window.requestAnimationFrame(renderLoop);


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


    drawMap();
    player.draw();


    // draw fps
    fill(255, 255, 255);
    context.font = "20px Arial";
    context.fillText(`FPS: ${renderFPS}`, 5, 20);
    context.fillText(`UPS: ${updateFPS}`, 5, 40);

    // draw the level the player is on at the top right
    let level = player.acquiredCheckpoints.length + 1;
    context.fillText(`Level: ${level}`, canvas.width - 100, 20);

}



let lastUpdateStamp = performance.now();
function updateLoop() {
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
            // if(keys['ArrowDown'] || keys['s']) {
            //     if(player.gravity > 0) player.y -= 200 * delta/1000;
            //     else player.y += 200 * delta/1000;
            //     player.yVel = 0;
            // }
            // if(keys[' ']) {
            //     player.spawnX = player.x;
            //     player.spawnY = player.y;
            // }
            
            player.update(delta);
            handlePlayerCollisions(player);
    
            updateMap();
    
            ++framesUpdated;
            if(performance.now() - lastUpdateTime > 1000) {
                updateFPS = framesUpdated;
                framesUpdated = 0;
                lastUpdateTime = performance.now();
            }
        }
    
        updateView(player);
}



function startGame() {    
    view.x = player.x - canvas.width/2;
    view.y = player.y - canvas.height/2;

    renderLoop();
    
    window.setInterval(() => {
        updateLoop();
    }, 1000/250);
}

// startGame();