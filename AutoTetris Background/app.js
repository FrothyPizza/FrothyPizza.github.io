

let canvas = document.getElementById('canvas');

let fullScreen = true;
let paused = false;
let context = canvas.getContext('2d');


let playerTetrisGame = new PlayerTetrisGame();


window.setInterval(() => {
    if(fullScreen) {
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
    }




    context.fillStyle = '#000';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillRect(0, 0, canvas.width, canvas.height);
    if(!paused) {
        playerTetrisGame.gameState.canHold = false;

        playerTetrisGame.performAIMove();
    }

    // Draw the game centered on screen
    blockSize = Math.min(canvas.height / (HEIGHT-YMARGIN + 5), canvas.width / (WIDTH+10));
    let xOffset = (canvas.width - WIDTH * blockSize) / 2;
    let yOffset = (canvas.height - (HEIGHT - YMARGIN) * blockSize) / 2;
    playerTetrisGame.render(context, {x: xOffset, y: yOffset}, blockSize, blockSize);

}, 1000/1000);