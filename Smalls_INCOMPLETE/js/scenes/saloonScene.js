class SaloonScene extends LevelScene {
  constructor(mapXml) {
    super(mapXml);
  }

  init() {
    super.init();

    this.bossSpawned = false;
    this.outlawsActive = false;

    let outlawLeft = null;
    let outlawRight = null;

    this.readyToTransitionToNextSceneWhenAllEnemiesDefeated = false;

    let OVERRIDE_ENTITIY_COUNT = 100;
    let spawned = 0;
    if (CONSTANTS.SPEEDY_MODE) {
      OVERRIDE_ENTITIY_COUNT = 0;
      spawned = 0;
    }

    // Spawn enemies from map data
    this.map.enemies.forEach((spawn) => {
      let enemyEntity = null;
      if (spawn.name === "SaloonOutlaw") {
        if (spawned >= OVERRIDE_ENTITIY_COUNT) return;
        enemyEntity = ECS.Blueprints.createSaloonOutlaw(spawn.x, spawn.y);
        enemyEntity.addComponent(
          new ECS.Components.LooksBackAndForthIntermittently(
            60 + Math.floor(Math.random() * 60)
          )
        );
        spawned++;
      }
      if (spawn.name === "SaloonOutlawInitial") {
        enemyEntity = ECS.Blueprints.createSaloonOutlaw(spawn.x, spawn.y);

        if (!outlawLeft) {
          outlawLeft = enemyEntity;
          enemyEntity.name = "OutlawLeft";
        } else if (!outlawRight) {
          outlawRight = enemyEntity;
          enemyEntity.name = "OutlawRight";
        }
      }

      if (enemyEntity) {
        this.addEntity(enemyEntity);
      }
    });

    // // find player in ECS entittes and add stunned birds to him
    // ECS.getEntitiesWithComponents('PlayerState').forEach(playerEntity => {
    //     console.log("Adding stunned birds to player");

    //     ECS.Helpers.addStunnedBirdsToEntity(playerEntity, this);
    //     console.log("Added stunned birds to player");
    // });

    if (Loader.cutscenes && Loader.cutscenes.saloon) {
      let local_initialize_after_cutscene = () => {
        let index = 1;
        this.getEntities().forEach((entity) => {
          if (entity.isSaloonOutlaw || entity.blueprint === "SaloonOutlaw") {
            entity.addComponent(
              new ECS.Components.SaloonKnifeOutlaw(
                240 * index + Math.floor(Math.random() * 120)
              )
            );
            index++;
          }
        });
        this.outlawsActive = true;
      };

      if (CONSTANTS.SPEEDY_MODE) {
        Loader.playMusic("DrabBarFast.mp3", 0.3, true);
        this.playCutscene(
          "saloon_abridged",
          {
            Player: this.player,
            OutlawLeft: outlawLeft,
            OutlawRight: outlawRight,
          },
          {
            onComplete: () => {
              local_initialize_after_cutscene();
            },
          }
        );
      } else {
        Loader.playMusic("DrabBarFast.mp3", 0.3, true);
        this.playCutscene(
          "saloon",
          {
            Player: this.player,
            OutlawLeft: outlawLeft,
            OutlawRight: outlawRight,
          },
          {
            shouldSave: true,
            onComplete: () => {
              this.player.addComponent(
                new ECS.Components.Checkpoint("SaloonFight")
              );
              this.playSaloonPart2(
                outlawLeft,
                outlawRight,
                local_initialize_after_cutscene
              );
            },
          }
        );
      }
    }
  }

  playSaloonPart2(outlawLeft, outlawRight, onComplete) {
    // If outlaws are not passed (e.g. reload), try to find them
    if (!outlawLeft)
      outlawLeft = this.getEntities().find((e) => e.name === "OutlawLeft");
    if (!outlawRight)
      outlawRight = this.getEntities().find((e) => e.name === "OutlawRight");

    this.playCutscene(
      "saloon_start_part_2",
      { Player: this.player, OutlawLeft: outlawLeft, OutlawRight: outlawRight },
      {
        shouldSave: false,
        onComplete: () => {
          if (onComplete) onComplete();
        },
      }
    );
  }

  onStateLoaded() {
    const checkpoint =
      this.player.Checkpoint ||
      this.getEntities().find((e) => e.has("Checkpoint"))?.Checkpoint;

    if (checkpoint) {
      if (checkpoint.id === "SaloonFight") {
        let local_initialize_after_cutscene = () => {
          let index = 1;
          this.getEntities().forEach((entity) => {
            if (entity.isSaloonOutlaw || entity.blueprint === "SaloonOutlaw") {
              entity.addComponent(
                new ECS.Components.SaloonKnifeOutlaw(
                  240 * index + Math.floor(Math.random() * 120)
                )
              );
              index++;
            }
          });
          this.outlawsActive = true;
        };

        this.playSaloonPart2(null, null, local_initialize_after_cutscene);
      } else if (checkpoint.id === "BossFight") {
        const boss = this.getEntities().find((e) => e.has("CrazedCowboy"));
        if (boss) {
          //Allows for the music to restart when you die
          Loader.playMusic("RagAttackFinished.mp3", 0.3, true);
          this.playBossAppearance(boss);
        }
      }
    }
  }

  update() {
    super.update();

    ECS.Systems.saloonBottleSystem(this.getEntities(), this.map, this);

    if (this.outlawsActive && !this.bossSpawned) {
      let outlawCount = 0;
      this.getEntities().forEach((entity) => {
        if (
          (entity.isSaloonOutlaw || entity.blueprint === "SaloonOutlaw") &&
          !entity.dead
        ) {
          // Assuming dead flag or removal
          outlawCount++;
        }
      });

      if (outlawCount === 0) {
        this.spawnBoss();
      }
    }

    // if the player has collected the lasso and gun, play cutscene
    if (
      this.player.has("PlayerState") &&
      this.player.PlayerState.hasCollectedLasso &&
      this.player.PlayerState.hasCollectedGun &&
      !this.itemsCollectedCutscenePlayed
    ) {
      this.itemsCollectedCutscenePlayed = true;
      this.playCutscene(
        "saloon_items_collected",
        { Player: this.player },
        {
          shouldSave: false,
          onComplete: () => {
            // remove IsEnemy from boss
            const boss = this.getEntities().find((e) => e.has("CrazedCowboy"));
            if (boss && boss.has("IsEnemy")) {
              console.log(
                "Removing IsEnemy from boss after items collected cutscene"
              );
              boss.removeComponent("IsEnemy");
            }

            // spawn a saloon outlaw in the sky to use as a dummy
            for (let i = 0; i < 2; ++i) {
              const dummyOutlaw = ECS.Blueprints.createSaloonOutlaw(
                64 + i * 64,
                0
              );
              dummyOutlaw.addComponent(
                new ECS.Components.LooksBackAndForthIntermittently(120)
              );
              // remove DamagesPlayer component so it doesn't hurt the player
              dummyOutlaw.removeComponent("DamagesPlayer");
              this.addEntity(dummyOutlaw);
            }

            this.readyToTransitionToNextSceneWhenAllEnemiesDefeated = true;
          },
        }
      );
    }

    // if there are no enemies left and readyToTransitionToNextSceneWhenAllEnemiesDefeated is true, transition to next scene
    if (this.readyToTransitionToNextSceneWhenAllEnemiesDefeated) {
      let enemyCount = 0;
      this.getEntities().forEach((entity) => {
        if (entity.has("IsEnemy") && !entity.dead) {
          enemyCount++;
        }
      });
      if (enemyCount === 0) {
        this.transitionToNextScene();
      }
    }
  }

  updateLevelSpecificSystems() {
    ECS.Systems.saloonItemCollectibleSystem(this.entities, this.map, this);
    ECS.Systems.saloonOutlawSystem(this.entities, this.map, this);
  }

  spawnBoss() {
    this.bossSpawned = true;
    console.log("Spawning Boss!");

    let bossX = 0;
    let bossY = 0;
    this.map.enemies.forEach((spawn) => {
      if (spawn.name === "MadSheriff") {
        bossX = spawn.x;
        bossY = spawn.y;
      }
    });

    // Spawn Boss
    // Position should probably be defined in map or hardcoded for now
    let boss = ECS.Blueprints.CrazedCowboy(bossX, bossY, "INACTIVE");
    this.addEntity(boss);

    // Play Boss Intro Cutscene if available

    if (Loader.cutscenes && Loader.cutscenes.saloon_boss) {
      //First time cutscene w/MadSheriff
      Loader.playMusic("RagAttackFinished.mp3", 0.3, true);

      this.playCutscene(
        "saloon_boss",
        { Sheriff: boss },
        {
          shouldSave: true,
          onComplete: () => {
            this.player.addComponent(
              new ECS.Components.Checkpoint("BossFight")
            );
            this.playBossAppearance(boss);
          },
        }
      );
    }
  }

  playBossAppearance(boss) {
    this.playCutscene(
      "saloon_boss_appearance",
      { Sheriff: boss },
      {
        shouldSave: false,
        onComplete: () => {
          // Boss fight starts
          if (boss.CrazedCowboy) {
            boss.CrazedCowboy.state = "IDLE";
          }

          boss.CrazedCowboy.startPos = {
            x: boss.Position.x,
            y: boss.Position.y,
          };
        },
      }
    );
  }

  transitionToNextScene() {
    // skips to the next scene, regardless of what's happeniung in the current scene
    GlobalState.sceneManager.switchScene(
      new DesertScene(Loader.levels["desert"].xml)
    );
  }
}
