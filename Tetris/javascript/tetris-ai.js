
let AIfactors = {
    hole: -160,                       // how bad holes are
    holeCovered: -50,                 // how many blocks are above a hole (bad)

    heightVariance: -20,              // average height differance between adjacent columns
    averageHeight: -4,                // average height
    averageHeightSQ: -0.1,            // average height squared
    highestHeight: -2,                // highest height
    
    upstackThreshold: 6,              // how high it wants to stack before stacking higher is bad
    averageHeightBelowUpstack: 100,   // how much higher it wants to stack

    downstackThreshold: 14,           // how high the matrix must be before it heavily favors downstacking
    averageHeightAboveThreshold: -20,  // how bad the average height is above the threshold


    Idependency: -50,                 // number of columns with 2 adjacent columns 3 higher than the one
    deepIdependency: -100,             // number of columns with 2 adjacent columns 6 higher than the one
    partialIdependency: -20,          // number of columns with 2 adjacent columns >=2 higher than this one
    surfaceParity: -4,                // https://harddrop.com/wiki/Parity

    blocksInTenthColumn: -2,        // how many blocks are in the tenth column (used for stacking for tetrises)
    tetrisReady: 50,                 // it is good if it's tetris ready      


    holdPenalty: -30,         

    attack: 0, 
    attackEffeciency: 0,
    clearWithoutAttack: -30,
    clearedDoubleOrTriple: -30,
    tSpinSetup: 0,
    performedTSpin: 0,
    clearedTetris: 500,
};




const MOVE_HD = 0;
const MOVE_DD = 1;
const MOVE_R = 2;
const MOVE_L = 3;
const MOVE_RR = 4;
const MOVE_LL = 5;
const ROT_CW = 6;
const ROT_CCW = 7;
const ROT_180 = 8;
const HOLD = 9;



const SZ_MOVES = [
    [MOVE_LL, MOVE_HD],
    [MOVE_LL, MOVE_R, MOVE_HD],
    [MOVE_L, MOVE_HD],
    [MOVE_HD],
    [MOVE_RR, MOVE_HD],
    [MOVE_RR, MOVE_L, MOVE_HD],
    [MOVE_R, MOVE_R, MOVE_HD],

    [ROT_CCW, MOVE_LL, MOVE_HD],
    [MOVE_LL, ROT_CW, MOVE_HD],
    [ROT_CCW, MOVE_L, MOVE_HD],

    [ROT_CCW, MOVE_HD],

    [ROT_CW, MOVE_HD],
    [ROT_CW, MOVE_R, MOVE_HD],
    [ROT_CW, MOVE_R, MOVE_R, MOVE_HD],
    [MOVE_RR, ROT_CW, MOVE_HD],
    [ROT_CW, MOVE_RR, MOVE_HD],
];

const LJT_MOVES = [
    [MOVE_LL, MOVE_HD],
    [MOVE_LL, MOVE_R, MOVE_HD],
    [MOVE_L, MOVE_HD],
    [MOVE_HD],
    [MOVE_RR, MOVE_HD],
    [MOVE_RR, MOVE_L, MOVE_HD],
    [MOVE_R, MOVE_R, MOVE_HD],
    [MOVE_R, MOVE_HD],

    [ROT_180, MOVE_LL, MOVE_HD],
    [ROT_180, MOVE_LL, MOVE_R, MOVE_HD],
    [ROT_180, MOVE_L, MOVE_HD],
    [ROT_180, MOVE_HD],
    [ROT_180, MOVE_RR, MOVE_HD],
    [ROT_180, MOVE_RR, MOVE_L, MOVE_HD],
    [ROT_180, MOVE_R, MOVE_R, MOVE_HD],
    [ROT_180, MOVE_R, MOVE_HD],

    
    [ROT_CCW, MOVE_LL, MOVE_HD],
    [ROT_CCW, MOVE_L, MOVE_L, MOVE_HD],
    [ROT_CCW, MOVE_L, MOVE_HD],

    [ROT_CCW, MOVE_HD],

    [ROT_CCW, MOVE_R, MOVE_HD],
    [ROT_CCW, MOVE_R, MOVE_R, MOVE_HD],
    [ROT_CCW, MOVE_RR, MOVE_HD],


    [ROT_CW, MOVE_LL, MOVE_HD],
    [MOVE_LL, ROT_CW, MOVE_HD],
    [ROT_CW, MOVE_L, MOVE_HD],
    [ROT_CW, MOVE_L, MOVE_L, MOVE_HD],

    [ROT_CW, MOVE_HD],

    [ROT_CW, MOVE_R, MOVE_HD],
    [ROT_CW, MOVE_R, MOVE_R, MOVE_HD],
    [ROT_CW, MOVE_LL, MOVE_HD],
];


const O_MOVES = [
    [MOVE_LL, MOVE_HD],
    [MOVE_LL, MOVE_R, MOVE_HD],
    [MOVE_L, MOVE_L, MOVE_HD],
    [MOVE_L, MOVE_HD],
    [MOVE_HD],
    [MOVE_RR, MOVE_HD],
    [MOVE_RR, MOVE_L, MOVE_HD],
    [MOVE_R, MOVE_R, MOVE_HD],
    [MOVE_R, MOVE_HD],
];

const I_MOVES = [
    [MOVE_LL, MOVE_HD],
    [MOVE_L, MOVE_L, MOVE_HD],
    [MOVE_L, MOVE_HD],

    [MOVE_HD],

    [MOVE_RR, MOVE_HD],
    [MOVE_R, MOVE_R, MOVE_HD],
    [MOVE_R, MOVE_HD],

    [ROT_CCW, MOVE_HD],
    [ROT_CCW, MOVE_L, MOVE_HD],
    [MOVE_LL, ROT_CW, MOVE_HD],
    [MOVE_LL, ROT_CCW, MOVE_HD],
    [ROT_CCW, MOVE_LL, MOVE_HD],

    [ROT_CW, MOVE_HD],
    [ROT_CW, MOVE_R, MOVE_HD],
    [ROT_CW, MOVE_R, MOVE_R, MOVE_HD],
    [MOVE_RR, ROT_CW, MOVE_HD],
    [ROT_CW, MOVE_RR, MOVE_HD],
];



function executeMove(gameState, mino, moves, index, nextList) {
    switch (moves[index]) {
        case HOLD:
            gameState.performHold(mino, nextList);
            break;
        case MOVE_R:
            gameState.moveX(mino, 1);
            break;
        case MOVE_RR:
            gameState.arrX(mino, 1);
            break;
        case MOVE_LL:
            gameState.arrX(mino, -1);
            break;
        case MOVE_L:
            gameState.moveX(mino, -1);
            break;
        case ROT_CW:
            gameState.rotate(mino, 1);
            break;
        case ROT_CCW:
            gameState.rotate(mino, -1);
            break;
        case ROT_180:
            gameState.rotate(mino, 2);
            break;
        case MOVE_DD:
            gameState.sonicDrop(mino);
            break;
        case MOVE_HD:
            gameState.hardDrop(mino);
            return gameState.lastAttack;
            break;
        
    }
    return 0;
}



function fullyPerformMove(gameState, mino, moves, nextList) {
    let clear = 0;
    for (let i = 0; i < moves.length; ++i) {
        clear += executeMove(gameState, mino, moves, i, nextList);
    }
    return clear;
}








function findSoftDropMoves(gameState, minoIndex) {
    // this function finds all of the moves that require moving the tetromino down


    // example of a right overhang hole
    // # # .
    // # . .
    // # # .

    // example of a left overhang hole
    // . # #
    // . . #
    // . # #
    let rightOverhangHoles = [];
    let leftOverhangHoles = [];


    let holes = findAllHoles(gameState);

    for (let i = 0; i < holes.length; ++i) {
        let x = holes[i].x;
        let y = holes[i].y;
        if(gameState.matrix[x + 1 + y*WIDTH] < 0) {
            rightOverhangHoles.push(holes[i]);
        }
        if(gameState.matrix[x - 1 + y*WIDTH] < 0) {
            leftOverhangHoles.push(holes[i]);
        }
    }

    let moves = [];
    
    let orientations = 1;
    if(minoIndex == MINO_J || minoIndex == MINO_L || minoIndex == MINO_T)
        orientations = 4;
    else if(minoIndex == MINO_S || minoIndex == MINO_Z || minoIndex == MINO_I)
        orientations = 2;
    
    for(let o = 0; o < orientations; ++o) {
        let rotation = null;
        if(o == 1) rotation = ROT_CW;
        else if(o == 2) rotation = ROT_CCW;
        else if(o == 3) rotation = ROT_180;

        for(let i = 0; i < rightOverhangHoles.length; ++i) {
            let move = [];

            let tetromino = new Tetromino(minoIndex);
            if(rotation != null) {
                if(rotation == ROT_CW) gameState.rotate(tetromino, 1);
                else if(rotation == ROT_CCW) gameState.rotate(tetromino, -1);
                else if(rotation == ROT_180) gameState.rotate(tetromino, 2);
                move.push(rotation);
            }

            let hole = rightOverhangHoles[i];

            let leftMostBlock = 100;
            let rightMostBlock = -1;
            for(let j = 0; j < tetromino.data.length; ++j) {
                if(tetromino.data[j].x + tetromino.x < leftMostBlock) {
                    leftMostBlock = tetromino.data[j].x;
                }
                if(tetromino.data[j].x + tetromino.x > rightMostBlock) {
                    rightMostBlock = tetromino.data[j].x;
                }
            }
            let moveX = hole.x - leftMostBlock;

            if(rightMostBlock + moveX > WIDTH - 1) {
                move.push(MOVE_RR);
            } else if(moveX > 0) {
                for(let j = 0; j < moveX; ++j) {
                    move.push(MOVE_R);
                }
            } else if (moveX < 0) {
                for(let j = 0; j < -moveX; ++j) {
                    move.push(MOVE_L);
                }
            }

            move.push(MOVE_DD);
            move.push(MOVE_L);
            move.push(MOVE_HD);

            // test the move to see if it works
            let gameStateCopy = gameState.clone();
            fullyPerformMove(gameStateCopy, tetromino, move, []);
            // if the position of one of the tetromino's blocks is at the hole, then the move is valid
            for(let j = 0; j < tetromino.data.length; ++j) {
                if(tetromino.data[j].x + tetromino.x == hole.x && tetromino.data[j].y + tetromino.y == hole.y) {
                    moves.push(move);
                }
            }
        }
    }


    return moves;
}






function findAllHoles(gameState) {
    let holes = [];
    for (let i = 0; i < WIDTH; ++i) {
        let foundTopMostBlock = false;
        for (let j = 1; j < HEIGHT; ++j) {
            // Once we've found the topmost block of a column, any empty block below it is a hole
            if (foundTopMostBlock && gameState.matrix[i + j*WIDTH] == -1)
                holes.push({ x: i, y: j });

            if (gameState.matrix[i + j*WIDTH] >= 0)
                foundTopMostBlock = true;
        }
    }

    return holes;
}








function findAllUniqueMoves(gameState, minoIndex) {
    let endMinos = [];
    let holes = findAllHoles(gameState);

    let possibleRotations = 4;
    if (minoIndex == MINO_I || minoIndex == MINO_S || minoIndex == MINO_Z)
        possibleRotations = 2;
    if (minoIndex == MINO_O)
        possibleRotations = 1;
    
    for (let hole of holes) {
        for (let i = 0; i < possibleRotations; ++i) {
            let mino = new Tetromino(minoIndex);
            for (let r = 0; r < i; ++r)
                gameState.rotate(mino, 1);

            for (let j = 0; j < 4; ++j) {
                let thisTilePos = { x: mino.x + mino.data[j].x, y: mino.y + mino.data[j].y };

                mino.x += hole.x - thisTilePos.x;
                mino.y += hole.y - thisTilePos.y;

                if (gameState.softDrop(mino)) continue;

                if (!gameState.matrixContains(mino)) {
                    endMinos.push(mino);
                    break;
                }
            }
        }

    }

    // Remove duplicates
    let uniqueEndMinos = [];
    for (let mino of endMinos) {
        let found = false;
        for (let uniqueMino of uniqueEndMinos) {
            if (mino.equals(uniqueMino)) {
                found = true;
                break;
            }
        }
        if (!found)
            uniqueEndMinos.push(mino);
    }


    return uniqueEndMinos;
}











function getMoves(mino, gameState) {


    // if (mino == MINO_S || mino == MINO_Z)
    //     return SZ_MOVES;
    // else if (mino == MINO_O)
    //     return O_MOVES;
    // else if (mino == MINO_L || mino == MINO_J || mino == MINO_T)
    //     return LJT_MOVES;
    // else if (mino == MINO_I)
    //     return I_MOVES;
    let moves = [];

    if(mino == MINO_S || mino == MINO_Z) {
        moves = SZ_MOVES.slice();
    } else if(mino == MINO_O) {
        moves = O_MOVES.slice();
    } else if(mino == MINO_L || mino == MINO_J || mino == MINO_T) {
        moves = LJT_MOVES.slice();
    } else if(mino == MINO_I) {
        moves = I_MOVES.slice();
    }

    // let softDropMoves = findSoftDropMoves(gameState, mino);
    // for(let i = 0; i < softDropMoves.length; ++i) {
    //     moves.push(softDropMoves[i]);
    // }

    // if(gameState != null) {
    //     let uniqueMoves = findAllUniqueMoves(gameState, mino);
    //     for(let i = 0; i < uniqueMoves.length; ++i) {
    //         let path = pathfindToEndMino(gameState, mino, uniqueMoves[i], 0, 3);
    //         if(path != null) {
    //             moves.push(path);
    //         }
    //     }
    // }




    return moves;
}




function evaluate(gameState) {
    let score = 0;

    // if dead (need to work on this)
    for (let i = 3; i < 6; ++i)
        for (let j = 3; j < 5; ++j)
            if (gameState.matrix[i + j * WIDTH] >= 0) return -10000;
    
    //find holes
    let holePositions = [];
    let holeCount = 0;
    let coverdHoleCount = 0;
    for (let i = 0; i < WIDTH; ++i) {
        for (let j = 0; j < HEIGHT - 1; ++j) {
            if (gameState.matrix[i + j * WIDTH] >= 0 && gameState.matrix[i + (j + 1) * WIDTH] == -1) {
                holeCount++;
                // punish long holes but only up to 4 deep
                for (let c = 0; c < 4; ++c) {
                    if (gameState.matrix[i + (j + c) * WIDTH] == -1 && gameState.matrix[i + (j + c - 1) * WIDTH] == -1) {
                        ++holeCount;
                        holePositions.push({ i, j });
                    }
                }
                // blocks above a hole
                for (let c = 0; c < HEIGHT-j; ++c) {
                    if (gameState.matrix[i + (j - c) * WIDTH] >= 0)
                        ++coverdHoleCount;
                    else
                        break;
                }
            }
        }
    }
    score += holeCount * AIfactors.hole;
    score += coverdHoleCount * AIfactors.holeCovered;


    // create an array containing column heights
    let columnHeights = [];
    columnHeights.length = WIDTH;
    for (let i = 0; i < WIDTH; ++i) {
        let thisColHeight = 0;
        for (let j = 0; j < HEIGHT; ++j) {
            // if a tile is found
            if (gameState.matrix[i + j * WIDTH] >= 0) {
                thisColHeight = HEIGHT - j;
                j = HEIGHT; // continue to next column
            }
        }
        columnHeights[i] = thisColHeight;
    }


    // calculate average height
    let averageHeight = 0;
    let highestHeight = 0;
    for (let i = 0; i < columnHeights.length; ++i) {
        averageHeight += columnHeights[i];
        if (columnHeights[i] > highestHeight) highestHeight = columnHeights[i];
    }
    averageHeight /= columnHeights.length;
    score += averageHeight * AIfactors.averageHeight;
    score += averageHeight * averageHeight * AIfactors.averageHeightSQ;
    score += highestHeight * AIfactors.highestHeight;

    if(averageHeight > AIfactors.downstackThreshold)
        score += AIfactors.averageHeightAboveThreshold * averageHeight;

    if(averageHeight < AIfactors.upstackThreshold)
        score += AIfactors.averageHeightBelowUpstack * averageHeight;


    // Calculate I dependencies and height variance
    let Idependencies = 0;
    let deepIdependencies = 0;
    let variance = 0;
    for (let i = 0; i < columnHeights.length; ++i) {
        let leftHeight = 0;
        let thisHeight = columnHeights[i];
        let rightHeight = 0;

        // if it isn't index 0 or last
        if (i >= 1 && i < columnHeights.length - 1) {
            variance += Math.abs(columnHeights[i - 1] - thisHeight);
            variance += Math.abs(columnHeights[i + 1] - thisHeight);
        }

        // calculate I dependecies 
        if (i == 0) leftHeight = HEIGHT;
        else leftHeight = columnHeights[i - 1];

        if (i == columnHeights.length - 1) rightHeight = HEIGHT;
        else rightHeight = columnHeights[i + 1];

        if (leftHeight - thisHeight >= 3 && rightHeight - thisHeight >= 3) Idependencies++;
        if (leftHeight - thisHeight >= 6 && rightHeight - thisHeight >= 6) deepIdependencies++;
    }
    score += Idependencies * AIfactors.Idependency;
    score += deepIdependencies * AIfactors.deepIdependency;
    score += variance * AIfactors.heightVariance;


    // Calculate parity
    let parity = 0;
    for (let i = 0; i < columnHeights.length; ++i) {
        let color = (columnHeights[i] % 2) ^ (i % 2);
        if (color == 1) parity++;
        else parity--;
    }
    parity /= 2;
    parity = Math.abs(parity);
    score += parity * AIfactors.surfaceParity;

    // Blocks in tenth column
    let tenthColumnBlocks = 0;
    for(let i = 0; i < HEIGHT; ++i) {
        if (gameState.matrix[WIDTH-1 + i * WIDTH] >= 0) tenthColumnBlocks++;
    }
    score += tenthColumnBlocks * AIfactors.blocksInTenthColumn;


    // Check to see if it's tetris ready
    // if all of the columns are higher than column 10 by 4, then it's tetris ready
    let tetrisReady = true;
    for (let i = 0; i < columnHeights.length-1; ++i) {
        if(columnHeights[i] - columnHeights[columnHeights.length-1] < 4) {
            tetrisReady = false;
            break;
        }
    }
    score += tetrisReady * AIfactors.tetrisReady;










    // const Tshape = [
    //     ['A', 'O', '#', 'O', 'A'],
    //     ['A', '#', '#', '#', 'A'],
    //     ['1', '1', '#', '1', '1']
    // ];
    // score += shapePercentCompletion(gameState, Tshape, holePositions) * AIfactors.tSpinSetup;


    return score;
}

function evaluateAttackScore(attack, clear, tSpin) {
    let score = 0;

    // total attack sent
    score += attack * attack * AIfactors.attack; // attack squared to encourage larger clears

    if (clear == 2 || clear == 3) score += AIfactors.clearedDoubleOrTriple;

    if (clear == 4) score += AIfactors.clearedTetris;

    // clear without attack
    if (clear > 0 && attack == 0) {
        score += clear * AIfactors.clearWithoutAttack;
    }

    // attack efficiency
    if (clear > 0 && attack > 0) {
        score += attack / clear * AIfactors.attackEffeciency;
    }

    if (tSpin == TSPIN)
        score += clear * AIfactors.performedTSpin + AIfactors.tSpinSetup; // since this destroys a setup, increase its value by the amount lost
    else if (tSpin == TSPIN_MINI)
        score += clear * AIfactors.performedTSpin / 3;

    return score;
}








// TODO: beam search
let ai_nodes_evaluated = 0;
function findBestMovesDFS(gameState, mino, nextList, depth, maxDepth) {

    let allMoves = getMoves(mino, gameState);
    let bestMoves = [];
    
    for (let i = 0; i < allMoves.length; ++i) {
        let newMino = new Tetromino(mino);
        let newGameState = gameState.clone();
        
        // Copy the move into move
        let move = allMoves[i].slice();

        fullyPerformMove(newGameState, newMino, move, nextList);
        let clear = newGameState.lastClear;
        let attack = newGameState.lastAttack;
        let tSpin = newGameState.lastTSpin;
        
        let attackScore = evaluateAttackScore(attack, clear, tSpin);
        //let moveScore = evaluate(newGameState);

        //let score = attackScore + moveScore;
        if(depth < maxDepth) {
            let newNextList = nextList.slice();
            newNextList.shift();
            let newMinoIndex = nextList[0];
            score = findBestMovesDFS(newGameState, newMinoIndex, newNextList, depth + 1, maxDepth)[0].score + attackScore;

        } else {
            score = evaluate(newGameState) + attackScore;
            ai_nodes_evaluated++;
        }

        



        bestMoves.push({
            moves: move,
            score: score
        });
    }


    if(gameState.canHold) {

        let holdNext = nextList.slice();
        let holdState = gameState.clone();
        let holdMino = new Tetromino(mino);
        holdState.performHold(holdMino, holdNext);

        let allMovesWithHold = getMoves(holdMino.mino, holdState);
        for (let i = 0; i < allMovesWithHold.length; ++i) {
            let newMino = new Tetromino(holdMino);
            let newGameState = holdState.clone();
            let move = allMovesWithHold[i].slice();

            fullyPerformMove(newGameState, newMino, move, nextList);
            let clear = newGameState.lastClear;
            let attack = newGameState.lastAttack;
            let tSpin = newGameState.lastTSpin;
            
            let attackScore = evaluateAttackScore(attack, clear, tSpin);
            //let moveScore = evaluate(newGameState);

            //let score = attackScore + moveScore + AIfactors.holdPenalty;
            if(depth < maxDepth) {
                let newNextList = nextList.slice();
                newNextList.shift();
                let newMinoIndex = nextList[0];
                score = findBestMovesDFS(newGameState, newMinoIndex, newNextList, depth + 1, maxDepth)[0].score + attackScore + AIfactors.holdPenalty;
                
            } else {
                score = evaluate(newGameState) + attackScore + AIfactors.holdPenalty;
                ai_nodes_evaluated++;
            }

            

            

            bestMoves.push({
                moves: [HOLD],
                score: score
            });
        }
    }



    // Sort the moves by score
    bestMoves.sort(function(a, b) {
        return b.score - a.score;
    });

    // remove all moves that are hold other than the first
    let holdIndecies = [];
    for (let i = 0; i < bestMoves.length; ++i) {
        if (bestMoves[i].moves[0] == HOLD) holdIndecies.push(i);
    }
    
    for (let i = holdIndecies.length - 1; i >= 1; --i) {
        bestMoves.splice(holdIndecies[i], 1);
    }

    

    return bestMoves;
}






// function findBestMoves(gameState, mino, nextList) {

//     let allMoves = getMoves(mino);
//     let bestMoves = [];
    
//     for (let i = 0; i < allMoves.length; ++i) {
//         let newMino = new Tetromino(mino);
//         let newGameState = gameState.clone();
        
//         // Copy the move into move
//         let move = allMoves[i].slice();

//         fullyPerformMove(newGameState, newMino, move, nextList);
//         let clear = newGameState.lastClear;
//         let attack = newGameState.lastAttack;
//         let tSpin = newGameState.lastTSpin;
        
//         let attackScore = evaluateAttackScore(attack, clear, tSpin);
//         let moveScore = evaluate(newGameState);

//         let score = attackScore + moveScore;

//         bestMoves.push({
//             moves: move,
//             score: score
//         });
//     }

//     if(gameState.canHold) {
//         let holdNext = nextList.slice();
//         let holdState = gameState.clone();
//         let holdMino = new Tetromino(mino);
//         holdState.performHold(holdMino, holdNext);

//         let allMovesWithHold = getMoves(holdMino.mino);
//         for (let i = 0; i < allMovesWithHold.length; ++i) {
//             let newMino = new Tetromino(holdMino);
//             let newGameState = holdState.clone();
//             let move = allMovesWithHold[i].slice();

//             fullyPerformMove(newGameState, newMino, move, nextList);
//             let clear = newGameState.lastClear;
//             let attack = newGameState.lastAttack;
//             let tSpin = newGameState.lastTSpin;
            
//             let attackScore = evaluateAttackScore(attack, clear, tSpin);
//             let moveScore = evaluate(newGameState);

//             let score = attackScore + moveScore + AIfactors.holdPenalty;

//             bestMoves.push({
//                 moves: [HOLD],
//                 score: score
//             });
//         }
//     }

//     // Sort the moves by score
//     bestMoves.sort(function(a, b) {
//         return b.score - a.score;
//     });

//     // remove all moves that are hold other than the first
//     let holdIndecies = [];
//     for (let i = 0; i < bestMoves.length; ++i) {
//         if (bestMoves[i].moves[0] == HOLD) holdIndecies.push(i);
//     }
//     for (let i = holdIndecies.length - 1; i >= 1; --i) {
//         bestMoves.splice(holdIndecies[i], 1);
//     }

    

//     return bestMoves;
// }




