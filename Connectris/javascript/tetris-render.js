
function getColor(player) {
    // switch (mino) {
    //     case 0:
    //         return 'rgb(227, 91, 2)'
    //     case 1:
    //         return 'rgb(33, 65, 198)'
    //     case 2:
    //         return 'rgb(215, 15, 55)'
    //     case 3:
    //         return 'rgb(89, 177, 1)'
    //     case 4:
    //         return 'rgb(175, 41, 138)'
    //     case 5:
    //         return 'rgb(15, 155, 215)'
    //     case 6:
    //         return 'rgb(227, 159, 2)'
    //     case 7:
    //         return 'rgb(153, 153, 153)'
    //     case 8:
    //         return 'rgb(200, 200, 200)'
    // }

    if(player == 1) {
        return 'rgb(227, 91, 2)';
    } else if(player == 2) {
        return 'rgb(33, 65, 198)';
    } else if(player == 3) {
        return 'rgb(100, 100, 100)';
    }
}



function renderTetris(context, position, tileSize, gameState, mino, nextList, player1Score, player2Score) {

    // Draw matrix
    // don't render the top two tiles
    for (let i = 0; i < WIDTH; ++i) {
        for (let j = 0; j < HEIGHT; ++j) {
            if (gameState.matrix[i + j*WIDTH] > -1) {
                context.fillStyle = getColor(gameState.matrix[i + j*WIDTH]);
                // context.fillRect(tileSize * i + position.x, tileSize * (j - YMARGIN) + position.y, tileSize, tileSize);
                // draw a circle
                context.beginPath();
                context.arc(tileSize * i + position.x + tileSize/2, tileSize * (j - YMARGIN) + position.y + tileSize/2, tileSize/2, 0, 2 * Math.PI);
                context.fill();

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
        context.fillStyle = 'rgba(125, 125, 125, 0.3)';
        //context.fillRect(tileSize * (ghost.x + ghost.data[i].x) + position.x, tileSize * (ghost.y + ghost.data[i].y - YMARGIN) + position.y, tileSize, tileSize);
        context.beginPath();
        context.arc(tileSize * (ghost.x + ghost.data[i].x) + position.x + tileSize/2, tileSize * (ghost.y + ghost.data[i].y - YMARGIN) + position.y + tileSize/2, tileSize/2, 0, 2 * Math.PI);
        context.fill();
    }

    // Draw current tetromino
    for (let i = 0; i < 4; ++i) {
        context.fillStyle = getColor(mino.player);
        //context.fillRect(tileSize * (mino.x + mino.data[i].x) + position.x, tileSize * (mino.y + mino.data[i].y - YMARGIN) + position.y, tileSize, tileSize);
        context.beginPath();
        context.arc(tileSize * (mino.x + mino.data[i].x) + position.x + tileSize/2, tileSize * (mino.y + mino.data[i].y - YMARGIN) + position.y + tileSize/2, tileSize/2, 0, 2 * Math.PI);
        context.fill();
    }

    // Draw next list
    let next = new Tetromino(mino);
    for (let i = 0; i < PREVIEWS; ++i) {
        next.setTetromino(nextList[i], next.player);
        if(next.player == 1) {
            next.player = 2;
        } else {
            next.player = 1;
        }
        next.x = WIDTH + 3; next.y = YMARGIN + i * 3;
        let posModifier = {};
        if (next.mino == MINO_I || next.mino == MINO_O) posModifier.x += 0.5;
        for (let i = 0; i < 4; ++i) {
            context.fillStyle = getColor(next.player);
            //context.fillRect(tileSize * (next.x + next.data[i].x) + position.x, tileSize * (next.y + next.data[i].y - YMARGIN) + position.y, tileSize, tileSize);
            context.beginPath();
            context.arc(tileSize * (next.x + next.data[i].x) + position.x + tileSize/2, tileSize * (next.y + next.data[i].y - YMARGIN) + position.y + tileSize/2, tileSize/2, 0, 2 * Math.PI);
            context.fill();
        }
    }


    // Draw hold
    if (gameState.hold >= 0 && gameState.hold < 7) {
        let hold = new Tetromino(gameState.hold);
        hold.x = -3;
        hold.y = YMARGIN + 1;
        for (let i = 0; i < 4; ++i) {
            context.fillStyle = getColor(hold.player);
            context.fillRect(tileSize * (hold.x + hold.data[i].x) + position.x, tileSize * (hold.y + hold.data[i].y - YMARGIN) + position.y, tileSize, tileSize);
            
        }
    }

    // Draw score
    context.font = '40px Sans-Serif';
    context.fillStyle = getColor(1);
    context.fillText(player1Score, tileSize * (WIDTH + 3) + position.x, tileSize * (HEIGHT - YMARGIN)/2 + position.y);
    context.fillStyle = getColor(2);
    context.fillText(player2Score, 0 - tileSize * 4 + position.x, tileSize * (HEIGHT - YMARGIN)/2 + position.y);

    // // draw lines going through consecutive tiles of the same color (not working currently)
    // context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    // for (let j = 0; j < HEIGHT; ++j) {
    //     for (let i = 0; i < WIDTH; ++i) {
    //         if (gameState.matrix[i + j*WIDTH] > -1) {
    //             let color = gameState.matrix[i + j*WIDTH];
    //             let line = 1;
    //             for (let k = i + 1; k < WIDTH; ++k) {
    //                 if (gameState.matrix[i + j*WIDTH + k] != color) break;
    //                 line++;
    //             }
    //             if (line > 1) {
    //                 context.fillRect(tileSize * i + position.x, 
    //                                  tileSize * (j - YMARGIN) + position.y + (tileSize-5)/2, 
    //                                  tileSize * (line), 
    //                                  5);
    //             }
    //             // i = i + line - 1;
    //         }
    //     }
    // }









}


