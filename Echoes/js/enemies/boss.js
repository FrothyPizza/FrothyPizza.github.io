class Boss extends Enemy {
    constructor(x, y, w, h, health = 1000) {
        super(x, y, w, h, health);
        this.totalStages = 3;
        this.currentStage = 0; // Start at 0 for initial riddle

        this.spawnPosition = { x: x, y: y };
        // this.x = WIDTH/2;
        // this.y = 0;

        this.isEnraged = false;

        // Health thresholds for stage transitions
        this.stageThresholds = [
            { health: this.maxHealth / 2, stage: 2 },
            { health: this.maxHealth / 4, stage: 3 }
        ];

        this.hasMovedBackToAsk = false;
        this.isAskingRiddle = false;
        this.currentRiddle = null;
        this.bossAwaitingAnswer = null;

        this.riddleAskedForStage = {
            1: true, // after initial
            2: false,
            3: false
        };

        this.initialRiddleAsked = false;
        this.isSpeaking = false;
    }

    async spawnInitialRiddle() {
        if (!CONSTANTS.RIDDLES_ENABLED) return; // If riddles disabled, do nothing
        this.isAskingRiddle = true;
        this.currentRiddle = await generateRiddle(this.constructor.name);
        currentScene.startRiddle(this.currentRiddle, this);
    }

    async spawnStageRiddle(stage) {
        if (!CONSTANTS.RIDDLES_ENABLED) return; // If riddles disabled, do nothing
        this.isAskingRiddle = true;
        let riddle = await generateRiddle(this.constructor.name);

        await new Promise((resolve) => {
            let checkInterval = setInterval(() => {
                if(this.hasMovedBackToAsk) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        }).then(() => {
            this.hasMovedBackToAsk = false;
            this.currentRiddle = riddle;
            currentScene.startRiddle(this.currentRiddle, this);
        });
    }

    handleRiddleAnswer(answer) {
        if (!CONSTANTS.RIDDLES_ENABLED) return; // If riddles disabled, no classification.

        classifyRiddle(this.currentRiddle, this.currentRiddle.answer, answer, this.constructor.name)
            .then(classification => {
                this.isSpeaking = true;
                currentScene.startDialogue(classification.comment || "I didn't seem to have received a comment for this riddle response.", this);

                let checkDialogueInterval = setInterval(() => {
                    if (!currentScene.isTextActive) {
                        clearInterval(checkDialogueInterval);

                        if (!this.initialRiddleAsked) {
                            this.initialRiddleAsked = true;
                            this.currentStage = 1;
                            this.riddleAskedForStage[1] = true; 
                            this.advanceStage(classification.classification >= 5 ? false : true);
                        } else {
                            if (this.currentStage < this.totalStages) {
                                this.currentStage++;
                                this.advanceStage(classification.classification >= 5 ? false : true);
                            } else {
                                this.dead = true;
                                console.log("Boss defeated!");
                            }
                        }

                        this.isAskingRiddle = false;
                        this.isSpeaking = false;
                    }
                }, 100);
            })
            .catch(error => {
                console.error("Error classifying riddle answer:", error);
                // On error, just proceed
                this.isSpeaking = true;
                currentScene.startDialogue("Hmm, I couldn't understand that. Let's proceed anyway.", this);

                let checkDialogueInterval = setInterval(() => {
                    if (!currentScene.isTextActive) {
                        clearInterval(checkDialogueInterval);

                        if (!this.initialRiddleAsked) {
                            this.initialRiddleAsked = true;
                            this.currentStage = 1;
                            this.riddleAskedForStage[1] = true;
                            this.advanceStage(true);
                        } else {
                            if (this.currentStage < this.totalStages) {
                                this.currentStage++;
                                this.advanceStage(true);
                            } else {
                                this.dead = true;
                                console.log("Boss defeated!");
                            }
                        }

                        this.isAskingRiddle = false;
                        this.isSpeaking = false;
                    }
                }, 100);
            });
    }

    advanceStage(isStronger) {
        console.log(`Advancing to stage ${this.currentStage}. Stronger: ${isStronger}`);
        this.isEnraged = isStronger;
        this.setupStage(isStronger);
    }

    setupStage(isStronger) {
        // Implement in subclasses
        throw new Error("Method 'setupStage' must be implemented.");
    }

    update(map, entities) {

        if (!CONSTANTS.RIDDLES_ENABLED) {
            // If riddles are disabled, handle boss logic without riddles:
            // Initial stage setup if not done
            if (!this.initialRiddleAsked && this.currentStage === 0) {
                // No initial riddle, just proceed to stage 1
                this.initialRiddleAsked = true;
                this.currentStage = 1;
                this.advanceStage(false); // No classification, assume not stronger
            }

            // Check for stage transitions based on health
            for (let threshold of this.stageThresholds) {
                if (this.health <= threshold.health && this.currentStage < threshold.stage && !this.riddleAskedForStage[threshold.stage]) {
                    // No riddles, just advance stage
                    this.riddleAskedForStage[threshold.stage] = true;
                    this.currentStage = threshold.stage;
                    this.advanceStage(false);
                }
            }

            if(this.dead) {
                super.update(map, entities);
                return;
            }

            this.sharedStageBehavior(map, entities);

            switch (this.currentStage) {
                case 1:
                    this.stage1Behavior(map, entities);
                    break;
                case 2:
                    this.stage2Behavior(map, entities);
                    break;
                case 3:
                    this.stage3Behavior(map, entities);
                    break;
                default:
                    break;
            }

            if(this.isEnraged) {
                for(let i = 0; i < 2; i++) {
                    this.spawnRedParticle(entities);
                }
            }

            super.update(map, entities);
            return;
        }




        
        // If riddles are enabled, original logic:
        if (this.isAskingRiddle || this.isSpeaking) {
            this.x = lerp(this.x, this.spawnPosition.x, 0.1);
            this.y = lerp(this.y, this.spawnPosition.y, 0.1);
            currentScene.player.x = lerp(currentScene.player.x, currentScene.player.spawnPosition.x, 0.05);
            currentScene.player.y = lerp(currentScene.player.y, currentScene.player.spawnPosition.y, 0.05);

            if (distance(this.x, this.y, this.spawnPosition.x, this.spawnPosition.y) < 2 && distance(currentScene.player.x, currentScene.player.y, currentScene.player.spawnPosition.x, currentScene.player.spawnPosition.y) < 2) {
                this.hasMovedBackToAsk = true;
                this.x = this.spawnPosition.x;
                this.y = this.spawnPosition.y;
                currentScene.player.x = currentScene.player.spawnPosition.x;
                currentScene.player.y = currentScene.player.spawnPosition.y;
            } else {
                this.hasMovedBackToAsk = false;
            }

            return;
        }

        // Handle initial riddle
        if (!this.initialRiddleAsked && this.currentStage === 0) {
            this.spawnInitialRiddle();
            return;
        }

        // Check for stage transitions
        for (let threshold of this.stageThresholds) {
            if (this.health <= threshold.health && this.currentStage < threshold.stage && !this.riddleAskedForStage[threshold.stage]) {
                this.spawnStageRiddle(threshold.stage);
                this.riddleAskedForStage[threshold.stage] = true;
                break;
            }
        }

        if(this.dead) return;

        this.sharedStageBehavior(map, entities);

        switch (this.currentStage) {
            case 1:
                this.stage1Behavior(map, entities);
                break;
            case 2:
                this.stage2Behavior(map, entities);
                break;
            case 3:
                this.stage3Behavior(map, entities);
                break;
            default:
                break;
        }

        if(this.isEnraged) {
            for(let i = 0; i < 2; i++) {
                this.spawnRedParticle(entities);
            }
        }

        super.update(map, entities);
    }

    stage1Behavior(map, entities) {
        this.velocity.x = this.speed * this.direction;
        this.sprite.direction = this.direction;
        this.sprite.setAnimation("Run");
        if (this.rightHit || this.leftHit) {
            this.direction *= -1;
        }
    }

    stage2Behavior(map, entities) {
        // Implement in subclass
    }

    stage3Behavior(map, entities) {
        // Implement in subclass
    }

    sharedStageBehavior(map, entities) {
        // Shared behavior
    }

    spawnRedParticle(entities) {
        const x = this.x + Math.random() * this.width;
        const y = this.y + Math.random() * this.height;
        const particle = new Particle(x, y, 2, 2, "rgba(255, 0, 0, 0.5)", 20);
        entities.push(particle);
    }
}





