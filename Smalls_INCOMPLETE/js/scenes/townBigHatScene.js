



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


