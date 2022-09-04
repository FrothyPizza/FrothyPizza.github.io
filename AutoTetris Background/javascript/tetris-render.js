
function getColor(mino) {
    switch (mino) {
        case 0:
            return 'rgb(227, 91, 2)'
        case 1:
            return 'rgb(33, 65, 198)'
        case 2:
            return 'rgb(215, 15, 55)'
        case 3:
            return 'rgb(89, 177, 1)'
        case 4:
            return 'rgb(175, 41, 138)'
        case 5:
            return 'rgb(15, 155, 215)'
        case 6:
            return 'rgb(227, 159, 2)'
        case 7:
            return 'rgb(153, 153, 153)'
        case 8:
            return 'rgb(200, 200, 200)'
    }
}



function renderTetris(context, position, tileSize, gameState, mino, nextList, AIMoves, AIMoveIndex) {

    // Draw matrix
    // don't render the top two tiles
    for (let i = 0; i < WIDTH; ++i) {
        for (let j = 0; j < HEIGHT; ++j) {
            if (gameState.matrix[i + j*WIDTH] > -1) {
                context.fillStyle = getColor(gameState.matrix[i + j*WIDTH]);
                context.fillRect(tileSize * i + position.x, tileSize * (j - YMARGIN) + position.y, tileSize, tileSize);
            }
        }
    }


    // Draw lines of the matrix
    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < WIDTH + 1; ++i) {
        if (i == 0 || i == WIDTH) context.fillStyle = 'rgba(255, 255, 255, 1)';
        else context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(tileSize * i + position.x, 0 + position.y, 1, tileSize * (HEIGHT - YMARGIN));
    }

    for (let i = 0; i < HEIGHT - YMARGIN + 1; ++i) {
        if (i == 0 || i == HEIGHT - YMARGIN) context.fillStyle = 'rgba(255, 255, 255, 1)';
        else context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(0 + position.x, tileSize * i + position.y, tileSize * WIDTH, 1);
    }

    // Draw attack bar
    if (gameState.incomingGarbage.length > 0) {
        let totatk = 0;
        for (let i = 0; i < gameState.incomingGarbage.length; ++i) {
            totatk += gameState.incomingGarbage[i];
        }

        context.fillStyle = 'rgba(255, 0, 0, 0.5)';
        context.fillRect(0 + position.x, tileSize * (HEIGHT - totatk - YMARGIN) + position.y, 3, totatk * tileSize);
    }

    // Draw ghost
    let ghost = new Tetromino(mino);
    gameState.sonicDrop(ghost);
    for (let i = 0; i < 4; ++i) {
        context.fillStyle = 'rgba(125, 125, 125, 0.5)';
        context.fillRect(tileSize * (ghost.x + ghost.data[i].x) + position.x, tileSize * (ghost.y + ghost.data[i].y - YMARGIN) + position.y, tileSize, tileSize);
    }

    // Draw current tetromino
    for (let i = 0; i < 4; ++i) {
        context.fillStyle = getColor(mino.mino);
        context.fillRect(tileSize * (mino.x + mino.data[i].x) + position.x, tileSize * (mino.y + mino.data[i].y - YMARGIN) + position.y, tileSize, tileSize);
    }

    // Draw next list
    let next = new Tetromino(mino);
    for (let i = 0; i < PREVIEWS; ++i) {
        next.setTetromino(nextList[i]);
        next.x = WIDTH + 3; next.y = YMARGIN + i * 3;
        let posModifier = {};
        if (next.mino == MINO_I || next.mino == MINO_O) posModifier.x += 0.5;
        for (let i = 0; i < 4; ++i) {
            context.fillStyle = getColor(next.mino);
            context.fillRect(tileSize * (next.x + next.data[i].x) + position.x, tileSize * (next.y + next.data[i].y - YMARGIN) + position.y, tileSize, tileSize);
        }
    }

    // Draw hold
    if (gameState.hold >= 0 && gameState.hold < 7) {
        let hold = new Tetromino(gameState.hold);
        hold.x = -3;
        hold.y = YMARGIN + 1;
        for (let i = 0; i < 4; ++i) {
            context.fillStyle = getColor(hold.mino);
            context.fillRect(tileSize * (hold.x + hold.data[i].x) + position.x, tileSize * (hold.y + hold.data[i].y - YMARGIN) + position.y, tileSize, tileSize);
        }
    }

    // If AI is rendering, draw the AI's current move as a line going through where the tetromino will land
    if (AIMoves != null && AIMoves.length > 0) {
        if(AIMoveIndex == null) AIMoveIndex = 0;
        let move = AIMoves[AIMoveIndex];
        

        let state = gameState.clone();
        let tetromino = new Tetromino(mino.mino);
        let next = nextList.slice();

        //let move = findBestMove(state, tetromino.mino, next);
        if(move.moves == [HOLD]) {
            state.performHold(tetromino, next);
            move = findBestMove(state, tetromino.mino, next);
        }

        move.moves[move.length - 1] = MOVE_DD;

        fullyPerformMove(state, tetromino, move.moves, next);
        
        // Now that the tetromino is in the correct position, draw it
        for (let i = 0; i < 4; ++i) {
            context.fillStyle = getColor(tetromino.mino);
            context.fillStyle.alpha = 0.5;

            let centeredBlockSize = tileSize / 2;
            context.fillRect(tileSize * (tetromino.x + tetromino.data[i].x) + position.x + centeredBlockSize/2, tileSize * (tetromino.y + tetromino.data[i].y - YMARGIN) + position.y + centeredBlockSize/2, centeredBlockSize, centeredBlockSize);
        }


    }





}


