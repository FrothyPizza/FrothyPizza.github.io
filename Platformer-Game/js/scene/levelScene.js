class LevelScene extends Scene {
    constructor(levelName, startMusic = true) {
        super();

        this.frameTimer = new Clock();

        this.levelName = levelName;
        this.map = Loader.levels[levelName];
        this.entities = [];
        this.player = null;
        // this.playerLives = playerLives == undefined ? 3 : playerLives;
        this.crate = null;
        this.loadEntities();

        this.frozen = false;

        // Text and Riddle related properties
        this.isTextActive = false;            // Indicates if any text (riddle or dialogue) is active
        this.isRiddleActive = false;          // Indicates if a riddle expecting input is active
        this.currentText = '';                // The text to display (riddle or dialogue)
        this.bossAwaitingAnswer = null;       // Reference to the boss entity, if any
        this.currentInputText = '';           // Player's input for riddles

        this.playerLivesSprite = new AnimatedSprite(Loader.spriteSheets.spider, "Idle", 30);
        this.playerLivesSprite.paused = false;
        this.playerLivesSprite.tint = "rgba(30, 30, 30, 0.1)";

        // Typewriter effect properties
        this.textDisplayIndex = 0;            // Current character index to display
        this.textDisplaySpeed = 1;            // Frames per character
        this.textDisplayTimer = 0;            // Timer to track frames
        this.isTextFullyDisplayed = false;    // Flag to indicate full text display

        this.sceneComplete = false;

        if(startMusic)
            Loader.playMusic(CONSTANTS.level_info[levelName].music.name, CONSTANTS.level_info[levelName].music.volume, true);

        console.log(this.entities.filter(entity => entity instanceof Boss));
        this.isBossLevel = this.entities.filter(entity => entity instanceof Boss).length > 0; 

        // Pause menu properties
        this.isPaused = false;
        this.pauseMenuOptions = ["Restart", "Return to Menu"];
        this.pauseMenuSelectedIndex = 0;

        // For detecting pause input toggle
        this.previousPauseInput = false;
    }

    loadEntities() {
        if(!this.map) return;

        // Initialize player
        if (!this.player) {
            this.player = new Player(this.map.playerSpawn.x, this.map.playerSpawn.y);
            this.entities.push(this.player);
        }

        // Initialize crate
        if (!this.crate) {
            if(this.map.crateLocations.length === 0) {
                this.crate = new Crate(0, 0, 8, 8, this.map.findAllGroundBlocksInScreenBounds(context.view.x, context.view.y));    
            } else {
                this.crate = new Crate(0, 0, 8, 8, this.map.crateLocations);    
            }
            this.crate.hide();
            this.entities.push(this.crate);
        }

        // Initialize enemies based on the map's enemies
        for (let enemyData of this.map.enemies) {
            let enemy;
            // switch (enemyData.name) {
            //     case 'SentryEnemy':
            //         enemy = new SentryEnemy(enemyData.x, enemyData.y);
            //         break;
            //     case 'UnicyclistEnemy':
            //         enemy = new UnicyclistEnemy(enemyData.x, enemyData.y, this.entities);
            //         break;
            //     case 'TurtleEnemy':
            //         enemy = new TurtleEnemy(enemyData.x, enemyData.y);
            //         break;
            //     case 'MimeHeadEnemy':
            //         enemy = new MimeHeadEnemy(enemyData.x, enemyData.y);
            //         break;
            //     case 'TurtleTadpoleEnemy':
            //         enemy = new TurtleTadpoleEnemy(enemyData.x, enemyData.y, enemyData.direction || 1);
            //         break;
            //     case 'BeeEnemy':
            //         enemy = new BeeEnemy(enemyData.x, enemyData.y);
            //         break;
            //     case 'CorgiEnemy':
            //         enemy = new CorgiEnemy(enemyData.x, enemyData.y);
            //         break;
            //     case 'SheepEnemy':
            //         enemy = new SheepEnemy(enemyData.x, enemyData.y);
            //         break;
            //     case 'HoopoeEnemy':
            //         enemy = new HoopoeEnemy(enemyData.x, enemyData.y);
            //         break;
            //     case 'HoopoeHatchlingEnemy':
            //         enemy = new HoopoeHatchlingEnemy(enemyData.x, enemyData.y);
            //         break;
            //     case 'EggEnemy':
            //         enemy = new EggEnemy(enemyData.x, enemyData.y);
            //         break;
            //     case 'DanglingSpiderEnemy':
            //         enemy = new DanglingSpiderEnemy(enemyData.x, enemyData.y);
            //         break;
            //     default:
            //         console.warn(`Unknown enemy type: ${enemyData.name}`);
            // }
            // enemy = new window[enemyData.name](enemyData.x, enemyData.y, enemyData.direction || 1);
            // use eval instead
            enemy = eval(`new ${enemyData.name}(${enemyData.x}, ${enemyData.y}, ${enemyData.direction || 1})`);

            if (enemy) {
                this.entities.push(enemy);
            }
        }
    }

    updateCrateLocations() {
        if(this.map.crateLocations.length === 0) {
            this.crate.locations = this.map.findAllGroundBlocksInScreenBounds(context.view.x, context.view.y);
        } else {
            this.crate.locations = this.map.crateLocations;
        }
    }

    startRiddle(riddle, boss) {
        if (!CONSTANTS.RIDDLES_ENABLED) return; // If riddles are disabled, do nothing.

        this.isTextActive = true;
        this.isRiddleActive = true;
        this.currentText = riddle.riddle_text;
        this.bossAwaitingAnswer = boss;
        this.currentInputText = '';

        // Initialize typewriter effect properties
        this.textDisplayIndex = 0;
        this.textDisplayTimer = 0;
        this.isTextFullyDisplayed = false;

        console.log("Riddle started:", riddle.riddle_text, " riddle answer:", riddle.answer);
    }

    startDialogue(text, boss) {
        if (!CONSTANTS.RIDDLES_ENABLED) return; // If riddles are disabled, do nothing.

        this.isTextActive = true;
        this.isRiddleActive = false;
        this.currentText = text;
        this.bossAwaitingAnswer = boss;

        // Initialize typewriter effect properties
        this.textDisplayIndex = 0;
        this.textDisplayTimer = 0;
        this.isTextFullyDisplayed = false;
    }


    hitFlagToWin() {
        let freezeTime = 120;
        this.freezeFrame(freezeTime);
        if(this.player) {
            this.player.sprite.setAnimation("Fall");
        }
        setFrameTimeout(() => {
            currentScene = new WorldMapScene();
            currentScene.completeLevel(this.levelName);
        }, freezeTime);
    }

    update() {
        // Check for pause input toggle
        if (!this.isTextActive) {
            if (Inputs.pause && !this.previousPauseInput) {
                this.isPaused = !this.isPaused;
            }
            this.previousPauseInput = Inputs.pause;
        }

        if (this.isPaused) {
            if (this.delayClock === undefined) {
                this.delayClock = new Clock();
            }

            if (this.delayClock.getTime() > 10) {
                if (Inputs.up) {
                    this.pauseMenuSelectedIndex = (this.pauseMenuSelectedIndex - 1 + this.pauseMenuOptions.length) % this.pauseMenuOptions.length;
                    this.delayClock.restart();
                }
                if (Inputs.down) {
                    this.pauseMenuSelectedIndex = (this.pauseMenuSelectedIndex + 1) % this.pauseMenuOptions.length;
                    this.delayClock.restart();
                }
                if (Inputs.enter) {
                    if (this.pauseMenuSelectedIndex === 0) {
                        // Restart
                        this.restart();
                    } else if (this.pauseMenuSelectedIndex === 1) {
                        // Return to menu
                        currentScene = new WorldMapScene();
                    }
                    this.delayClock.restart();
                }
            }

            return; // Don't update game logic while paused
        }

        if (this.isTextActive) {
            if (!this.isTextFullyDisplayed) {
                this.textDisplayTimer++;
                if (this.textDisplayTimer >= this.textDisplaySpeed) {
                    this.textDisplayIndex++;
                    this.textDisplayTimer = 0;

                    if (this.textDisplayIndex >= this.currentText.length) {
                        this.textDisplayIndex = this.currentText.length;
                        this.isTextFullyDisplayed = true;
                    }
                }
            }
            if(Inputs.enter && this.isTextFullyDisplayed && this.isTextActive && this.isRiddleActive) {
                this.enterAnswer();
            }
            if((Inputs.enter || Inputs.shoot || Inputs.jump || Inputs.dash || Inputs.left || Inputs.right || Inputs.up || Inputs.down) && this.isTextFullyDisplayed && this.isTextActive && !this.isRiddleActive && this.currentText !== "Let me think about that...") {
                this.isTextActive = false;
                this.bossAwaitingAnswer = null;
            }   
            return;
        }

        if(this.frozen) return;

        // Very hackey solution to move the boss back to the original position while asking a riddle
        let exit = false;
        if(this.entities.filter(entity => entity instanceof Boss).forEach(boss => {
            if((boss.isAskingRiddle || boss.isSpeaking) && !boss.hasMovedBackToAsk) {
                exit = true;
                boss.update();
            }
        }));
        if(exit) {
            return;
        } 

        // Update all entities
        for (let entity of this.entities) {
            entity.update(this.map, this.entities);
        }

        // Handle interactions
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].interactWith === undefined)
                continue;
            for (let j = 0; j < this.entities.length; j++) {
                if (this.entities[j] instanceof Particle)
                    continue;
                if (i !== j) { // Prevent self-interaction
                    this.entities[i].interactWith(this.entities[j]);
                }
            }
        }

        // Remove dead entities
        this.entities = this.entities.filter(entity => {
            if (entity.removeFromScene) {
                return false; // Remove dead entity
            }
            return true; // Keep alive entity
        });

        // if the boss is no longer alive, the scene is complete
        let boss = this.entities.find(entity => entity instanceof Boss);
        if (!boss && !this.player.dead && this.isBossLevel && !this.sceneComplete) {
            let playerPosition = { x: this.player.x, y: this.player.y };
            // adjust x to 16 towards the center of the screen
            if(playerPosition.x < context.view.x + context.canvas.width / 2) {
                playerPosition.x = context.view.x + context.canvas.width / 2 - 16;
            } else if(playerPosition.x > context.view.x + context.canvas.width / 2) {
                playerPosition.x = context.view.x + context.canvas.width / 2 + 16;
            }

            this.entities.push(new Flag(playerPosition.x, playerPosition.y));
            this.sceneComplete = true;
            // currentScene = new WorldMapScene();
        }
        if(this.map.pointIsCollidingWithType(this.player.x, this.player.y, "checkpoint")) {
            this.hitFlagToWin();
        }
    }

    getScreenPosition(gameX, gameY) {
        // Get the position relative to the view
        const relativeX = gameX - context.view.x;
        const relativeY = gameY - context.view.y;

        return { x: relativeX, y: relativeY };
    }

    resetPlayerPosition() {
        if (this.player) {
            this.player.x = this.map.playerSpawn.x;
            this.player.y = this.map.playerSpawn.y;
            this.player.velocity = { x: 0, y: 0 };
                
            this.player.sprite.paused = false;
            this.player.dead = false;
            this.player.collidesWithMap = true;

            this.player.weapon = "sword";
        }
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    draw(context) {
        // Draw the map
        this.map.draw(context);

        // Draw all entities
        for (let entity of this.entities) {
            entity.draw(context, this.map);
        }

        // If text is active, draw the text box
        if (this.isTextActive && CONSTANTS.RIDDLES_ENABLED) {
            this.drawTextBox(context);
        }

        // If paused, dim the screen and draw pause menu
        if (this.isPaused) {
            context.fillStyle = "rgba(0,0,0,0.5)";
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
            this.drawPauseMenu(context);
        }

        // -------------------------
        // TIMER IMPLEMENTATION START
        // -------------------------
        // We assume APP_ELAPSED_FRAMES is a global variable that increments each frame (60fps)
        const timerWidth = 24;
        const timerHeight = 16;
        // Draw a small black rectangle at the top-left corner; some alpha
        context.fillStyle = "rgba(0, 0, 0, 0.5)";
        context.fillRect(0, 0, timerWidth, timerHeight);

        // Calculate elapsed seconds
        const elapsedSeconds = Math.floor((this.frameTimer.getTime()) / 60);

        // Draw the timer text centered in the 24x16 rectangle
        // Coordinates roughly center: x=12 (half of 24), y=8 (half of 16)
        this.drawBitmapText(context, elapsedSeconds.toString(), 12, 6, 'center', '#fff');
        // -------------------------
        // TIMER IMPLEMENTATION END
        // -------------------------
    }

    drawTextBox(context) {
        if (!CONSTANTS.RIDDLES_ENABLED) return;

        if (this.bossAwaitingAnswer && this.currentText) {
            // Get boss position on screen
            const boss = this.bossAwaitingAnswer;
            const bossPosition = this.getScreenPosition(boss.x + boss.width / 2, boss.y);

            // Determine the size of the text box
            const boxWidth = 200; // example width
            const padding = 10;

            // Get the portion of the text to display
            const fullText = this.currentText;
            const textToDisplay = fullText.slice(0, this.textDisplayIndex);
            const lines = this.wrapText(textToDisplay, boxWidth - 2 * padding);

            const lineHeight = this.charHeight + 1; // Adjust as needed
            const textHeight = lines.length * lineHeight;

            // Include space for input text if it's a riddle
            const inputLineHeight = this.charHeight + 2; // Adjust as needed
            let totalHeight = textHeight + 2 * padding;

            if (this.isRiddleActive && this.isTextFullyDisplayed) {
                totalHeight += inputLineHeight + 10; // extra space for input
            }

            // Calculate box position
            let boxX = bossPosition.x - boxWidth / 2;
            let boxY = bossPosition.y - totalHeight - 10; // 10 pixels above the boss

            // Adjust position if box goes off-screen
            if (boxX < 0) {
                boxX = 0;
            } else if (boxX + boxWidth > context.canvas.width) {
                boxX = context.canvas.width - boxWidth;
            }
            if (boxY < 0) {
                boxY = 0;
            } else if (boxY + totalHeight > context.canvas.height) {
                boxY = context.canvas.height - totalHeight;
            }

            // Draw the box
            context.fillStyle = "rgba(255, 255, 255, 0.6)";
            context.strokeStyle = "black";
            context.lineWidth = 4;

            // Draw filled rectangle
            context.fillRect(boxX, boxY, boxWidth, totalHeight);

            // Draw border
            context.strokeRect(boxX, boxY, boxWidth, totalHeight);

            // Draw the text
            let textY = boxY + padding;
            for (let line of lines) {
                this.drawBitmapText(context, line, boxX + boxWidth / 2, textY, 'center');
                textY += lineHeight;
            }

            // If it's a riddle and fully displayed, draw the user's input text
            if (this.isRiddleActive && this.isTextFullyDisplayed) {
                // Draw the user's input text with blinking cursor
                textY += 10; // extra space before input
                let modifier = APP_ELAPSED_FRAMES % 60 > 30 ? ' ' : '_';
                this.drawBitmapText(context, this.currentInputText + modifier, boxX + boxWidth / 2, textY, 'center');
            }
        }
    }

    handleTextInput(e) {
        if (!CONSTANTS.RIDDLES_ENABLED) return;

        if (this.isTextFullyDisplayed) {
            if (this.isRiddleActive) {
                // Handle input for riddle
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    // Remove last character
                    this.currentInputText = this.currentInputText.slice(0, -1);
                } else if (e.key.length === 1 && /^[a-zA-Z0-9 .!?]$/.test(e.key)) {
                    // Append character to input text
                    this.currentInputText += e.key;
                }
            } else {
                if(this.currentText !== "Let me think about that...") {
                    // Handle input for dialogue (press any key to continue)
                    this.isTextActive = false;
                    this.bossAwaitingAnswer = null;
                }
            }
        }
    }

    enterAnswer() {
        if (!CONSTANTS.RIDDLES_ENABLED) return;

        // Submit the answer
        const playerAnswer = this.currentInputText.trim();
        this.isTextActive = false;
        this.isRiddleActive = false;

        if (this.bossAwaitingAnswer) {
            this.startDialogue("Let me think about that...", this.bossAwaitingAnswer);
            this.bossAwaitingAnswer.handleRiddleAnswer(playerAnswer);
        }
        this.currentInputText = '';
    }

    restart() {
        console.log("RESTARTING LEVEL");
        currentScene = new LevelScene(this.levelName, false);
    }

    freezeFrame(frames) {
        setFrameTimeout(() => {
            this.frozen = false;
        }, frames);
        this.frozen = true;
    }

    drawPauseMenu(context) {
        // Calculate the needed width and height based on text
        let maxWidth = 0;
        let lineHeight = this.charHeight + 4;
        let padding = 10;

        for (let option of this.pauseMenuOptions) {
            const w = this.measureBitmapTextWidth(option);
            if (w > maxWidth) {
                maxWidth = w;
            }
        }

        const menuWidth = maxWidth + padding * 2;
        const menuHeight = (this.pauseMenuOptions.length * lineHeight) + padding * 2;

        const x = (context.canvas.width - menuWidth) / 2;
        const y = (context.canvas.height - menuHeight) / 2;

        context.fillStyle = "rgba(0,0,0,0.8)";
        context.fillRect(x, y, menuWidth, menuHeight);
        context.strokeStyle = "#ffffff";
        context.lineWidth = 2;
        context.strokeRect(x, y, menuWidth, menuHeight);

        let textY = y + padding;
        for (let i = 0; i < this.pauseMenuOptions.length; i++) {
            let option = this.pauseMenuOptions[i];
            let color = i === this.pauseMenuSelectedIndex ? "#ff0" : "#fff";
            this.drawBitmapText(context, option, x + menuWidth / 2, textY, 'center', color);
            textY += lineHeight;
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (currentScene.isTextActive && CONSTANTS.RIDDLES_ENABLED) {
        currentScene.handleTextInput(e);
        // Do not handle other inputs while text is active
        return;
    }
    // Handle other game inputs here
});
