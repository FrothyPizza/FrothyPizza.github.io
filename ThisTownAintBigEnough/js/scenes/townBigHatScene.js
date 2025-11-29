



class TownBigHatScene extends LevelScene {
    constructor(mapXml) {
        super(mapXml);

    }

    init() {
        super.init();

        ECS.getEntitiesWithComponents('PlayerState').forEach(playerEntity => {
            playerEntity.PlayerState.hasCollectedGun = true;
            playerEntity.PlayerState.hasCollectedLasso = true;
            let weapon = ECS.Helpers.addWeaponToPlayer(playerEntity, 'Gun');
            let lasso = ECS.Helpers.addWeaponToPlayer(playerEntity, 'Lasso');
            this.addEntity(weapon);
            this.addEntity(lasso);
        });

        const bossCues = {};
        this.map.bossCues.forEach((cue) => {
            bossCues[cue.name] = { x: cue.x, y: cue.y };
        });

        let bossEntity = null;
        this.map.enemies.forEach((spawn) => {
            let enemyEntity = null;
            if (spawn.name === "BigHat") {
                enemyEntity = ECS.Blueprints.createBigHatBoss(spawn.x, spawn.y, this, bossCues);
                bossEntity = enemyEntity;
            }
            if (enemyEntity) {
                this.addEntity(enemyEntity);
            }
        });

        this.bossActive = false;

        Loader.playMusic("FinalBoss4.mp3", 0.3, true);
        
        if (Loader.cutscenes && Loader.cutscenes.big_hat_initial) {
            if (CONSTANTS.SPEEDY_MODE) {
                this.playCutscene("big_hat_level_start", { BigHat: bossEntity, Player: this.player }, {
                    onComplete: () => {
                        this.bossActive = true;
                    }
                });
            } else {
                this.playCutscene("big_hat_initial", { BigHat: bossEntity, Player: this.player }, {
                    shouldSave: true,
                    onComplete: () => {
                        this.playCutscene("big_hat_level_start", { BigHat: bossEntity, Player: this.player }, {
                            shouldSave: false,
                            onComplete: () => {
                                this.bossActive = true;
                            }
                        });
                    }
                });
            }
        } else {
            this.bossActive = true;
        }

    }

    update() {
        super.update();

        // check if boss state has 0 health
        ECS.getEntitiesWithComponents('BigHatBossState').forEach(bossEntity => {
            if(bossEntity.BigHatBossState.health <= 0 && !(bossEntity.BigHatBossState.state == 'DEFEATED')) {
                bossEntity.BigHatBossState.state = 'DEFEATED';

                console.log("Big Hat defeated!");

                // Save High Score
                if (this.player && this.player.has('PlayerState')) {
                    const currentScore = this.player.PlayerState.score;
                    const storedScores = localStorage.getItem('smalls_world_high_scores');
                    let highScores = storedScores ? JSON.parse(storedScores) : [];
                    
                    highScores.push(currentScore);
                    highScores.sort((a, b) => b - a); // Descending sort
                    highScores = highScores.slice(0, 5); // Keep top 5
                    
                    localStorage.setItem('smalls_world_high_scores', JSON.stringify(highScores));
                    console.log("High score saved:", currentScore);
                }

                //This doesn't work
                //hat.AnimatedSprite.setAnimation("IdlePickUp")
                // find the hat
                const hats = ECS.getEntitiesWithComponents('BigHatHatState');
                let hat = null;
                if (hats.length > 0) {
                    hat = hats[0];
                    hat.AnimatedSprite.setAnimation("IdlePickUp");
                }

                bossEntity.AnimatedSprite.setAnimation('Death');
                // hide the shotgun (AnimatedSprite.hidden = true)
                ECS.getEntitiesWithComponents('BigHatGun').forEach(gun => {
                    if (gun.AnimatedSprite) {
                        gun.AnimatedSprite.hidden = true;
                    }
                });


                // find player entity
                const player = this.player;

                // then, find the BigHatHat and set its interactWith method to be :
                ECS.getEntitiesWithComponents('BigHatHatState').forEach(hat => {
                    hat.interactWith = (entity) => {
                        // check if entity has PlayerState
                        if (entity.has('PlayerState')) {
                            // if so, add BigHatHat to the player's BoundEntities
                            if (!player.has('BoundEntities')) {
                                player.addComponent(new ECS.Components.BoundEntities());
                            }
                            player.BoundEntities.entitiesWithOffsets.push({ entity: hat, offsetX: -6, offsetY: -11 });
                            
                            //play sound 
                            Loader.playSound("VictoryDoot.wav", 0.6);
                            Loader.setCurrentMusicVolume(0.0);

                            hat.interactWith = null; // prevent further interaction

                            // Remove physics/collision from hat so it doesn't interfere
                            // hat.removeComponent('PhysicsBody');
                            // hat.removeComponent('Collider');

                            // then, after a delay, switch to MenuScene
                            setTimeout(() => {
                                GlobalState.sceneManager.switchScene(new MenuScene());
                            }, 3000);
                        }
                    };
                });



                // // Transition to Menu after a delay
                // setTimeout(() => {
                //     GlobalState.sceneManager.switchScene(new MenuScene());
                // }, 3000);

                // play cutscene here (boss defeated)
                // this.playCutscene('BigHatDefeat', { boss: bossEntity }, { shouldSave: true });
            }
        });
    }

    onStateLoaded() {
        this.bossActive = false;
        // find boss entity
        let bossEntity = null;
        const bosses = ECS.getEntitiesWithComponents('BigHatBossState');
        if (bosses.length > 0) {
            bossEntity = bosses[0];
        }
        Loader.playMusic("FinalBoss4.mp3", 0.3, true);
        this.playCutscene("big_hat_level_start", { BigHat: bossEntity, Player: this.player }, {
            onComplete: () => {
                this.bossActive = true;
            }
        });
    }

    updateLevelSpecificSystems() {
        if (!this.bossActive) return;
        ECS.Systems.bigHatBossSystem(this.getEntities());
        ECS.Systems.bigHatHatSystem(this.getEntities());
        ECS.Systems.bigHatProjectileSystem(this.getEntities());
    }
}


