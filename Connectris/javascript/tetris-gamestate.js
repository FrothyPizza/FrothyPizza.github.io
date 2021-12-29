


class Tetromino {
    constructor(minoIndex, player) {


        // if the minoIndex is an instance of Tetromino, copy it
        if (minoIndex instanceof Tetromino) {
            this.mino = minoIndex.mino;
            
            // copy the data array
            this.data = [];
            for (let i = 0; i < 4; ++i) {
                this.data[i] = new Point(minoIndex.data[i].x, minoIndex.data[i].y);
            }

            this.x = minoIndex.x;
            this.y = minoIndex.y;
            this.rotation = minoIndex.rotation;
            this.player = minoIndex.player;

        } else {
            this.setTetromino(minoIndex, player);
        }
    }

    // resets the tetromino x, y, and rotation and makes it the new tetromino
	setTetromino(minoIndex, player) {
        this.mino = minoIndex;
        this.data = [];

        let x = WIDTH/2;
        if (minoIndex == MINO_O || minoIndex == MINO_I) {
            this.x = x
        } else {
            this.x = x-1;
        }

        this.y = YMARGIN - TETROMINO_START_Y;
        this.rotation = 0;

        for (let i = 0; i < 4; ++i) {
            this.data[i] = new Point(tetrominoData[minoIndex][i].x, tetrominoData[minoIndex][i].y);
        }

        this.player = player;
    }

    equals(other) {
        if (this.mino != other.mino) {
            return false;
        }

        for (let i = 0; i < 4; ++i) {
            if (this.data[i].x != other.data[i].x || this.data[i].y != other.data[i].y) {
                return false;
            }
        }

        return true;
    }

    clone() {
        return new Tetromino(this);
    }
}


// The Tetris game state stores the maxtrix and some other data about the game
// The tetromino should be handled outside of the game state
class TetrisGameState {
    constructor() {
        this.reset();
    }

    // resets the game state
    reset() {
        this.hold = -1;
        this.canHold = true;
        this.combo = 0;
        this.lastMoveWasKick = false;
        this.lastMoveWasRot = false;
        this.totalLinesCleared = 0;
        this.totalLinesSent = 0;
        this.b2b = 0;

        this.lastAttack = 0;
        this.lastTSpin = 0;

        this.incomingGarbage = [];
        
        this.matrix = [];
        for(let i = 0; i < WIDTH*HEIGHT; ++i) {
            this.matrix[i] = -1;
        }
    }

    clone() {
        let newState = new TetrisGameState();
        newState.hold = this.hold;
        newState.canHold = this.canHold;
        newState.combo = this.combo;
        newState.lastMoveWasKick = this.lastMoveWasKick;
        newState.lastMoveWasRot = this.lastMoveWasRot;
        newState.totalLinesCleared = this.totalLinesCleared;
        newState.totalLinesSent = this.totalLinesSent;
        newState.b2b = this.b2b;

        newState.incomingGarbage = [];
        for(let i = 0; i < this.incomingGarbage.length; ++i) {
            newState.incomingGarbage.push(this.incomingGarbage[i]);
        }

        newState.matrix = [];
        for(let i = 0; i < WIDTH*HEIGHT; ++i) {
            newState.matrix[i] = this.matrix[i];
        }

        return newState;
    }

    get(x, y) {
        return this.matrix[x + y*WIDTH];
    }



    // Pass in a tetromino and an array of tetrominoes representing the next list
    performHold(mino, next) {
        if (this.canHold) {
            let newHold = mino.mino;
            if (this.hold < 0 || this.hold >= 7) {
                mino.setTetromino(next[0]);
                next.splice(0, 1);
            } else { // if there is a hold, then swap the hold and the current tetromino
                mino.setTetromino(this.hold);
            }
            this.hold = newHold;
            this.canHold = false;
            return true;
        }
        return false;
    }



    // check if a tetromino is inside of a block of the matrix
    matrixContains(mino) {
        let contains = false;

        // check the coordinates of each tile of the tetromino
        // if the cooresponding tile of the Matrix is a block, return true
        for (let i = 0; i < 4; ++i) {
            let x = mino.data[i].x + mino.x;
            let y = mino.data[i].y + mino.y;

            if (x >= WIDTH || x < 0 || y >= HEIGHT) { // check if it's out of bounds
                contains = true;
            } else if (y >= 0) {
                if (this.matrix[x + y*WIDTH] >= 0) {
                    contains = true;
                }
            }
        }
        return contains;
    }


    // returns if it succeded
    softDrop(mino) {
        mino.y++;
        if (this.matrixContains(mino)) {
            mino.y--;
            return false;
        }
        else {
            this.lastMoveWasKick = false;
            this.lastMoveWasRot = false;
            return true;
        }
    }


    pasteToMatrix(mino) {
        for (let i = 0; i < 4; ++i) {
            let x = mino.data[i].x + mino.x;
            let y = mino.data[i].y + mino.y;

            if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                this.matrix[x + y*WIDTH] = mino.player;
            }
        }
    }


    clearLines() {
        let lines = 0;
        for (let i = 0; i < HEIGHT; ++i) {
            let c = 0;
            for (let j = 0; j < WIDTH; ++j) {
                if (this.matrix[j + i*WIDTH] >= 0) c++;
            }

            // if all the tiles in the row are filled
            if (c == WIDTH) {
                lines++;
                // Move the rest down
                for (let y = i; y >= 0; --y) {
                    for (let x = 0; x < WIDTH; ++x) {
                        if (y - 1 < 0) this.matrix[x + y*WIDTH] = -1;
                        else this.matrix[x + y*WIDTH] = this.matrix[x + (y - 1)*WIDTH];
                    }
                }
            }
        }
        if (lines > 0) this.combo++;
        else this.combo = 0;
        return lines;
    }



    sonicDrop(mino) {
        let movements = 0;
        while (!this.matrixContains(mino)) {
            mino.y++;
            movements++;
        }
        mino.y--;

        if (movements > 0) {
            this.lastMoveWasKick = false;
            this.lastMoveWasRot = false;
        }
    }


    moveX(mino, x) {
        mino.x += x;
        if (this.matrixContains(mino)) {
            mino.x -= x;
            return false;
        }
        else {
            this.lastMoveWasKick = false;
            this.lastMoveWasRot = false;
            return true;
        }
    }

    arrX(mino, x) {
        if(x > 1) x = 1;
        if(x < -1) x = -1;

        for (let i = 0; i < WIDTH; ++i) {
            if (!this.moveX(mino, x)) return; // as soon as it fails, stop trying to move it
        }
    }


    wallKick(mino, dir) {
        let newRotation = mino.rotation;

        newRotation += dir;
        if (newRotation < 0) newRotation = 3;
        if (newRotation > 3) newRotation = 0;

        let storeX = mino.x; let storeY = mino.y;

        // if it isn't O or I
        if (mino.mino < 5) {
            for (let i = 0; i < 5; ++i) {
                let nd = 0;
                if (dir == 1) nd = 0;
                if (dir == -1) nd = 1;

                mino.x += ZSTLJwallKickData[mino.rotation][nd][i].x;
                mino.y += ZSTLJwallKickData[mino.rotation][nd][i].y;
                if (!this.matrixContains(mino)) {
                    return true;
                }
                else {
                    mino.x = storeX;
                    mino.y = storeY;
                }
            }
            return false;
        }
        else {
            for (let i = 0; i < 5; ++i) {
                let nd = 0;
                if (dir == 1) nd = 0;
                if (dir == -1) nd = 1;

                mino.x += IwallKickData[mino.rotation][nd][i].x;
                mino.y += IwallKickData[mino.rotation][nd][i].y;
                if (!this.matrixContains(mino)) {
                    return true;
                }
                else {
                    mino.x = storeX;
                    mino.y = storeY;
                }
            }
            return false;
        }
    }


    // 0 doesn't rotate, 1 rotates right, -1 rotates left
    // 2 rotates 180 degrees
    rotate(mino, dir) {
        // don't rotate if it's O
        if (mino.mino == MINO_O) return;

        let oldMino = new Tetromino(mino);

        // if it's an i piece then use the precomputed rotations
        if (mino.mino == MINO_I) {
            let rot = mino.rotation;

            if (dir == 2) {
                if (rot == 0) rot = 2;
                if (rot == 1) rot = 3;
                if (rot == 2) rot = 0;
                if (rot == 3) rot = 1;
            }
            else {
                rot += dir;
            }

            if (rot < 0) rot = 3;
            if (rot > 3) rot = 0;

            for (let i = 0; i < 4; ++i) {
                mino.data[i].x = IrotationData[rot][i].x;
                mino.data[i].y = IrotationData[rot][i].y;
            }
        }
        else { // if it isn't an I piece, then rotate normally
            if (dir == 1) {
                for (let i = 0; i < 4; ++i) {
                    let x = mino.data[i].x; let y = mino.data[i].y;
                    mino.data[i].x = y * -1;
                    mino.data[i].y = x;
                }
            }
            if (dir == -1) {
                for (let i = 0; i < 4; ++i) {
                    let x = mino.data[i].x; let y = mino.data[i].y;
                    mino.data[i].x = y;
                    mino.data[i].y = x * -1;
                }
            }
            if (dir == 2) {
                for (let i = 0; i < 4; ++i) {
                    let x = mino.data[i].x; let y = mino.data[i].y;
                    mino.data[i].x = y;
                    mino.data[i].y = x * -1;
                }
                for (let i = 0; i < 4; ++i) {
                    let x = mino.data[i].x; let y = mino.data[i].y;
                    mino.data[i].x = y;
                    mino.data[i].y = x * -1;
                }
            }
        }


        let kickSuccess = false;
        if (this.matrixContains(mino)) kickSuccess = this.wallKick(mino, dir); // if the rotation that just happened fails, then attempt a kick
        else this.lastMoveWasRot = true; // otherwise, the rotation was successful
        if (this.matrixContains(mino) && !kickSuccess) { // if the kick doesn't work, then reset the mino
            for (let i = 0; i < 4; ++i) {
                mino.data[i].x = oldMino.data[i].x;
                mino.data[i].y = oldMino.data[i].y;
            }
        }
        else {
            this.lastMoveWasRot = true;
            if (kickSuccess) this.lastMoveWasKick = true;
            if (dir == 2) {
                switch (mino.rotation) {
                    case 0:
                        mino.rotation = 2;
                        break;
                    case 1:
                        mino.rotation = 3;
                        break;
                    case 2:
                        mino.rotation = 0;
                        break;
                    case 3:
                        mino.rotation = 1;
                        break;
                }
            }
            else {
                mino.rotation += dir;
            }
            if (mino.rotation < 0) mino.rotation = 3;
            if (mino.rotation > 3) mino.rotation = 0;
        }
    }


    placeGarbage() {
        if (this.incomingGarbage.length == 0) return;
        for (let i = 0; i < this.incomingGarbage.length; ++i) {
            if (this.incomingGarbage[i] > 0) {
                let holeIndex = Math.floor(Math.random() * WIDTH);
                // move everything up
                for (let w = 0; w < WIDTH; ++w) {
                    for (let h = 0; h < HEIGHT; h++) {
                        if (matrix[w][h] >= -1) {
                            if (h - this.incomingGarbage[i] >= 0) matrix[w][h - this.incomingGarbage[i]] = matrix[w][h];
                            matrix[w][h] = -1;
                        }

                    }
                }
                // place garbage
                for (let w = 0; w < WIDTH; ++w) {
                    for (let h = 0; h < this.incomingGarbage[i]; h++) {
                        if (w != holeIndex) {
                            if (HEIGHT - h - 1 >= 0) matrix[w][HEIGHT - h - 1] = 7;
                        }
                        else {
                            if (HEIGHT - h - 1 >= 0) matrix[w][HEIGHT - h - 1] = -1;
                        }
                    }
                }
            }
        }
        this.incomingGarbage.length = 0;
    }



    recieveAttack(atk) {
        if (atk > 0) this.incomingGarbage.push(atk);
    }

    // This returns the new attack value after it has been subtracted from the incoming garbage
    cancelGarbage(atk) {
        if (atk == 0) return atk;
        if (this.incomingGarbage.length == 0) return atk;

        for (let i = 0; i < this.incomingGarbage.length; ++i) {
            let startGarbage = this.incomingGarbage[i];
            this.incomingGarbage[i] -= atk;
            if (this.incomingGarbage[i] >= 0) {
                atk = 0;
                return atk;
            }
            else {
                this.incomingGarbage[i] = 0;
                atk -= startGarbage;
            }

        }
        return atk;
    }

    getAttack(wasTSpin, minoIndex, cleared) {
        if (cleared == 0) return 0;

        let attack = 0;

        if (cleared == 2 || cleared == 3) attack = cleared - 1; // 1 attack for 2 lines, 2 for 3 lines

        if (minoIndex == MINO_T) {
            if (wasTSpin == TSPIN_MINI) {
                if (cleared == 1) attack = 1; // mini tspin
                else if (cleared == 2) attack = 4; // mini tspin double
            }
            if (wasTSpin == TSPIN) {
                if (cleared == 1) attack = 2; // tspin single
                if (cleared == 2) attack = 4; // tspin double
                if (cleared == 3) attack = 6; // tspin triple

            }
        }

        //if it was a Tetris, attack = 4
        if (cleared == 4)
            attack = 4;

        if (this.b2b > 0 && (cleared == 4 || wasTSpin != NO_TSPIN)) attack += 1;

        // // add combo
        // if (this.combo >= 13) attack += 5;
        // else attack += COMBO_TABLE[this.combo];

        return attack;
    }


	// pass in the tetromino where it was before hard drop, and then test it int the matrix before hard drop
    isTspin(mino) {
        if (mino.mino != MINO_T || !this.lastMoveWasRot) return NO_TSPIN;

        let cornersFilled = 0;
        // C T C
        // T T T
        // C 0 C
        let mainCellsFilled = 0; // main cells filled are the cells adjacent to the t's
        // M T M
        // T T T
        // 0 0 0
        let corner = new Tetromino(mino);
        for (let i = 0; i < 4; ++i) {
            corner.data[i].x = 0;
            corner.data[i].y = 0;
        }
        
        corner.data[0].x = -1;
        corner.data[0].y = -1;
        if (this.matrixContains(corner)) {
            cornersFilled++;
            if (mino.rotation == 3 || mino.rotation == 0) mainCellsFilled++;
        }

        corner.data[0].x = -1;
        corner.data[0].y = 1;
        if (this.matrixContains(corner)) {
            cornersFilled++;
            if (mino.rotation == 3 || mino.rotation == 2) mainCellsFilled++;
        }

        corner.data[0].x = 1;
        corner.data[0].y = -1;
        if (this.matrixContains(corner)) {
            cornersFilled++;
            if (mino.rotation == 0 || mino.rotation == 1) mainCellsFilled++;
        }

        corner.data[0].x = 1;
        corner.data[0].y = 1;
        if (this.matrixContains(corner)) {
            cornersFilled++;
            if (mino.rotation == 1 || mino.rotation == 2) mainCellsFilled++;
        }

        if (cornersFilled >= 3 && mainCellsFilled >= 2) return TSPIN;
        else if (cornersFilled >= 3) return TSPIN_MINI;
        return NO_TSPIN;
    }

    // translate the above code to javascript
    // returns 1, 2, or -1
    getWinner() {
        // look for horizontal winner
        for (let y = 0; y < HEIGHT; ++y) {
            for (let x = 0; x < WIDTH - (TILES_IN_A_ROW_TO_WIN - 1); ++x) {
                let target = this.get(x, y);
                if (target != -1) {
                    let count = 0;
                    for (let i = 0; i < TILES_IN_A_ROW_TO_WIN; ++i) {
                        if (this.get(x + i, y) == target)
                            count += 1;
                    }
                    if (count == TILES_IN_A_ROW_TO_WIN)
                        return target;
                }
            }
        }
        // look for vertical winner
        for (let x = 0; x < WIDTH; ++x) {
            for (let y = 0; y < HEIGHT - (TILES_IN_A_ROW_TO_WIN - 1); ++y) {
                let target = this.get(x, y);
                if (target != -1) {
                    let count = 0;
                    for (let i = 0; i < TILES_IN_A_ROW_TO_WIN; ++i) {
                        if (this.get(x, y + i) == target)
                            count += 1;
                    }
                    if (count == TILES_IN_A_ROW_TO_WIN)
                        return target;
                }
            }
        }

        // look for diagonal winner from top left to bottom right
        for (let y = 0; y < HEIGHT - (TILES_IN_A_ROW_TO_WIN - 1); ++y) {
            for (let x = 0; x < WIDTH - (TILES_IN_A_ROW_TO_WIN - 1); ++x) {
                let target = this.get(x, y);
                if (target != -1) {
                    let count = 0;
                    for (let i = 0; i < TILES_IN_A_ROW_TO_WIN; ++i) {
                        if (this.get(x + i, y + i) == target)
                            count += 1;
                    }
                    if (count == TILES_IN_A_ROW_TO_WIN)
                        return target;
                }
            }
        }
        // look for diagonal winner from top right to bottom left
        for (let y = 0; y < HEIGHT - (TILES_IN_A_ROW_TO_WIN - 1); ++y) {
            for (let x = WIDTH - 1; x > TILES_IN_A_ROW_TO_WIN - 2; --x) {
                let target = this.get(x, y);
                if (target != -1) {
                    let count = 0;
                    for (let i = 0; i < TILES_IN_A_ROW_TO_WIN; ++i) {
                        if (this.get(x - i, y + i) == target)
                            count += 1;
                    }
                    if (count == TILES_IN_A_ROW_TO_WIN)
                        return target;
                }
            }
        }
        return -1;
    }



    hardDrop(mino) {
        this.canHold = true;
        for (let i = 0; i < HEIGHT + 10; i++) {
            mino.y++;
            if (this.matrixContains(mino)) {
                // if the hard drop moved the tetromino, the last move wasn't a kick
                if (i != 0) this.lastMoveWasKick = false;
                mino.y--;
                this.lastTSpin = this.isTspin(mino);
                

                this.pasteToMatrix(mino);

                if(CLEAR_LINES) this.lastClear = this.clearLines();
                this.lastAttack = this.getAttack(this.lastTSpin, mino.mino, this.lastClear);


                // handle back to back
                if (this.lastClear == 4 || this.lastTSpin != NO_TSPIN && this.lastClear > 0)
                    this.b2b++;
                else if (this.lastClear > 0) 
                    this.b2b = 0;

                if (this.lastClear == 0) this.lastAttack = 0;
                return i;
            }
        }
        return 0;
    }

}
