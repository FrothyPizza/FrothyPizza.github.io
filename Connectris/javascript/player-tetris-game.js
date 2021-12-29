


function pushOntoNextlist(nextList) {
    let bag = [0, 1, 2, 3, 4, 5, 6];
    
    // shuffle the bag
    for (let i = bag.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = bag[i];
        bag[i] = bag[j];
        bag[j] = temp;
    }

    // Add the bag to the next list
    for (let i = 0; i < bag.length; i++) {
        nextList.push(bag[i]);
    }

}


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

class PlayerTetrisGame {
    constructor() {
        this.gameState = new TetrisGameState();
        this.nextList = [];

        for(var i = 0; i < 3; i++) {
            pushOntoNextlist(this.nextList);
        }
        this.currentPlayer = 1;

        this.curMino = new Tetromino(this.nextList[0], this.currentPlayer);
        this.nextList.splice(0, 1);


        this.Lclock = new Clock();
        this.LclockRestarted = false;
        this.LARRClock = new Clock();

        this.Rclock = new Clock();
        this.RclockRestarted = false;
        this.RARRClock = new Clock();
        
        this.SDFClock = new Clock();


        this.Lclock.start();
        this.LARRClock.start();
        this.Rclock.start();
        this.RARRClock.start();
        this.SDFClock.start();

        this.das = 133;
        this.sdf = 5;
        this.arr = 10;

        this.piecesPlaced = 0;

    }

    restart() {
        this.gameState.reset();
        this.nextList = [];
        for(var i = 0; i < 14; i++) {
            pushOntoNextlist(this.nextList);
        }
        this.curMino = new Tetromino(this.nextList[0], this.currentPlayer);
        this.nextList.splice(0, 1);

        this.Lclock.restart();
        this.LARRClock.restart();
        this.Rclock.restart();
        this.RARRClock.restart();
        this.SDFClock.restart();

    }



    inputLeft(leftPressed, rightPressed) {
        if (rightPressed && this.RARRClock.getElapsedTime() > 0 && leftPressed) {
            this.Rclock.restart();
            this.RARRClock.restart();
        }

        if (leftPressed && this.LclockRestarted == false) {
            this.Lclock.restart();
            this.LclockRestarted = true;
            this.gameState.moveX(this.curMino, -1);

        }
        else {
            if (leftPressed == false) this.LclockRestarted = false;
        }
        if (this.arr > 0) {
            if (this.Lclock.getElapsedTime() > this.das && leftPressed) {
                if(rightPressed){
                    this.gameState.moveX(this.curMino, -1);
                    this.Lclock.restart();
                }

                if (this.LARRClock.getElapsedTime() > this.arr) {
                    this.LARRClock.restart();
                    this.gameState.moveX(this.curMino, -1);
                }
            }
        }
        else {
            if (this.Lclock.getElapsedTime() > this.das && leftPressed) {
                this.gameState.arrX(this.curMino, -1);
            }
        }
    }


    inputRight(leftPressed, rightPressed) {
        if (leftPressed && this.LARRClock.getElapsedTime() > 0 && rightPressed) {
            this.Lclock.restart();
            this.LARRClock.restart();
        }

        if (rightPressed && this.RclockRestarted == false) {
            this.Rclock.restart();
            this.RclockRestarted = true;
            this.gameState.moveX(this.curMino, 1);

        }
        else {
            if (rightPressed == false) this.RclockRestarted = false;
        }
        if (this.arr > 0) {
            if (this.Rclock.getElapsedTime() > this.das && rightPressed) {
                if(leftPressed){
                    this.gameState.moveX(this.curMino, 1);
                    this.Rclock.restart();
                }
                if (this.RARRClock.getElapsedTime() > this.arr) {
                    this.RARRClock.restart();
                    this.gameState.moveX(this.curMino, 1);
                }
            }
        }
        else {
            if (this.Rclock.getElapsedTime() > this.das && rightPressed) {
                this.gameState.arrX(this.curMino, 1);
            }
        }
    }


    inputDown() {
        if(this.sdf == 0) {
            this.gameState.sonicDrop(this.curMino);
        }
        else {
            if(this.SDFClock.getElapsedTime() > this.sdf) {
                this.SDFClock.restart();
                this.gameState.softDrop(this.curMino);
            }
        }
    }


   
    // this is used for instantaneous inputs
    inputGeneral(keyCode) {
        if (keyCode == CONTROLS.HARD_DROP) {

            this.gameState.hardDrop(this.curMino);
            
            if(this.currentPlayer == 1) {
                this.currentPlayer = 2;
            } else {
                this.currentPlayer = 1;
            }

            this.curMino.setTetromino(this.nextList[0], this.currentPlayer);
            this.nextList.splice(0, 1);
            if (this.nextList.length < 14) pushOntoNextlist(this.nextList);
            this.piecesPlaced++;
            
            let clear = this.gameState.lastClear;
            if (clear <= 0) {
                this.gameState.placeGarbage();
            } else {
                // let pitch = 1.0 + (this.gameState.combo / 16.0);
                // let sound = new Audio("sounds/line_clear.wav");
                // sound.playbackRate = pitch;
                // sound.play();

                // this.lineClearSound.play();
            }

            let attack = this.gameState.lastAttack;

            if(this.gameState.getWinner() == 1) {
                setTimeout(() => {
                    alert("Player 1 wins!");
                    this.restart();
                }, 10);

            } else if(this.gameState.getWinner() == 2) {
                setTimeout(() => {
                    alert("Player 2 wins!");
                    this.restart();
                }, 10);
            }

            




            return attack;
        }

        
        // if (keyCode == CONTROLS.HOLD) {
        //     this.gameState.performHold(this.curMino, this.nextList);
        // }
        if (keyCode == CONTROLS.ROTATE_CW) {
            this.gameState.rotate(this.curMino, 1);
        }
        if (keyCode == CONTROLS.ROTATE_CCW) {
            this.gameState.rotate(this.curMino, -1);
        }
        if (keyCode == CONTROLS.ROTATE_180) {
            this.gameState.rotate(this.curMino, 2);
        }

        // if (keyCode == CONTROLS.HOLD) {
        //     alert(this.gameState.getWinner());
        // }



        if (keyCode == CONTROLS.RESTART) {
            this.restart();
        }

        return 0;
    }


    render(context, position, tileSize) {
        renderTetris(context, position, tileSize, this.gameState, this.curMino, this.nextList, this.sortedAIMoves);
    }
}
