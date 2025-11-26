const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
const WIDTH = 30 * 8;
const HEIGHT = 22 * 8;

let PIXEL_SIZE = 5;
canvas.height = HEIGHT;
canvas.width = WIDTH;

let APP_ELAPSED_FRAMES = 0;
let APP_FPS = 60;

context.view = {x: 0, y: 0, width: WIDTH, height: HEIGHT, offsetX: 0, offsetY: 0};
function shakeScreen(amount) {
    let angle = Math.random() * Math.PI * 2;
    context.view.offsetX = Math.cos(angle) * amount;
    context.view.offsetY = Math.sin(angle) * amount;
    context.view.wasLockedToPlayer = context.view.lockedToPlayer;
    context.view.lockedToPlayer = true;

    // lerp back
    executeForXFrames(() => {
        context.view.offsetX = context.view.offsetX * 0.7;
        context.view.offsetY = context.view.offsetY * 0.7;
    }, 10);
    setFrameTimeout(() => {
        context.view.offsetX = 0;
        context.view.offsetY = 0;
        context.view.lockedToPlayer = context.view.wasLockedToPlayer;
    }, 10);

    // if gamepad connected, vibrate
    if(navigator.getGamepads()[0]) {
        navigator.getGamepads()[0].vibrationActuator.playEffect("dual-rumble", {
            duration: 100,
            strongMagnitude: 1.0,
            weakMagnitude: 1.0
        });
    }
}



/**
 * if the view has a target, follow it.
 * Regardless, constrain to level bounds.
 * @param {boolean} followCenterOffset the is the max offset from the center that the target can be before the view starts moving
 */
context.view.update = function(followCenterOffset) {
    followCenterOffset = false;
    if(this.target) {
        let targetXRelativeToView = this.target.x - this.x;
        if(followCenterOffset) {
            let maxOffset = followCenterOffset;
            if(targetXRelativeToView > WIDTH * (1/2 + maxOffset)) {
                this.x = this.target.x - Math.round(WIDTH * (1/2 + maxOffset));
            } else if(targetXRelativeToView < WIDTH * (1/2 - maxOffset)) {
                this.x = this.target.x - Math.round(WIDTH * (1/2 - maxOffset));
            }
            this.y = Math.round(this.target.y) - HEIGHT / 2;
        } else {
            this.x = Math.round(this.target.x) - WIDTH / 2;
            this.y = Math.round(this.target.y) - HEIGHT / 2;
        }
    }

    // Constrain view position
    if(GlobalState.currentScene) {
        let currentScene = GlobalState.currentScene;
        this.x = constrain(this.x, 0, currentScene.map.getWidthInPixels() - WIDTH);
        this.y = constrain(this.y, 0, currentScene.map.getHeightInPixels() - HEIGHT);
    }

    // Round view position
    this.x = Math.round(this.x) + Math.round(this.offsetX);
    this.y = Math.round(this.y) + Math.round(this.offsetY);



};



context.view.setTarget = function(positionComponent) {
    if(positionComponent) {
        this.target = positionComponent;
    } else {
        this.target = null;
    }
}



function resize() {
    let browserHeight = window.innerHeight;
    PIXEL_SIZE = Math.floor(browserHeight / HEIGHT + 0.1);
    canvas.style.height = HEIGHT * PIXEL_SIZE + 'px';
    canvas.style.width = WIDTH * PIXEL_SIZE + 'px';
} 
resize();
addEventListener('resize', resize);