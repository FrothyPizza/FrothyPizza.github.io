/**
 * Guys spawn at edges in the 5 spawner locations (2 on left side, 3 on right side)
 * 
 * Knife guys just run at you
 * Gun guys strafe back and forth and shoot ocassionally
 * 
 * White hat guys come from left side
 * Black hat guys come from right side (left spawners are called EnemySpawnerMiddleLeft, EnemySpawnerMiddleRight, EnemySpawnerBottomRight, ...) so we can use the substring "Left" or "Right" to determine which side they come from
 * Guys that spawn on the right side face left, guys that spawn on the left side face right
 * 
 * The spawners are each only allowed to have 1 enemy active at a time (which is why we keep track of enemyIDsThatISpawned)
 * 
 * 
 * start spawning stars with a particle system or something
 * sunset gradually darkens the screen (overlay a semi-transparent black rectangle on top of everything)
 */

class DesertScene extends LevelScene {
    constructor(mapXml) {
        super(mapXml);

        this.totalFrames = CONSTANTS.SPEEDY_MODE ? 600 : 3600; // 1 minute at 60 FPS
        this.framesToCompletion = this.totalFrames; // 1 minute at 60 FPS

        this.spawners = [];
        this.leftSpawners = [];
        this.rightSpawners = [];
        this.initialKnifePairSpawnTimer = 240; // Initial delay
        this.secondHalfKnifePairSpawnTimer = 160; // Faster spawns in second half
        this.knifePairSpawnTimer = this.initialKnifePairSpawnTimer;

        this.pendingSpawns = [];
    }

    init() {
        super.init();

        this.framesToCompletion = this.totalFrames;

        this.enemiesActive = false;
        let outlawLeft = null;
        let outlawRight = null;

        this.map.enemies.forEach((spawn) => {
            // Find OutlawLeft and OutlawRight and set their names for cutscene desert_initial reference 
            // they walk off screen in the cutscene and then disappear btw
            // desert_level_start.cutscene is what plays after this cutscene (and every time after the game saves)
            if (spawn.name === "OutlawLeft") {
                // Left side guy (Deputy)
                outlawLeft = ECS.Blueprints.createDesertGunOutlaw(spawn.x, spawn.y, false);
                outlawLeft.name = "OutlawLeft";
                // Remove behavior components so they don't act during cutscene
                outlawLeft.removeComponent('DesertGunOutlaw');
                this.addEntity(outlawLeft);
            } else if (spawn.name === "OutlawRight") {
                // Right side guy (KnifeOutlaw)
                outlawRight = ECS.Blueprints.createDesertKnifeOutlaw(spawn.x, spawn.y, true);
                outlawRight.name = "OutlawRight";
                // Remove behavior components so they don't act during cutscene
                outlawRight.removeComponent('DesertKnifeOutlaw');
                this.addEntity(outlawRight);
            }
        });
        
        this.map.enemies.forEach((spawn) => {
            // if name starts with EnemySpawner, add to spawners with name and position
            if (spawn.name.startsWith("EnemySpawner")) {
                const spawner = {
                    name: spawn.name,
                    x: spawn.x,
                    y: spawn.y,
                    enemyIDsThatISpawned: [],
                    spawnDelayFrames: 120,
                    framesUntilNextSpawn: 0
                };
                this.spawners.push(spawner);
                
                if (spawn.name.includes("Left")) {
                    this.leftSpawners.push(spawner);
                } else {
                    this.rightSpawners.push(spawner);
                }
            }
        });

        // find player and add whip and gun
        ECS.getEntitiesWithComponents('PlayerState').forEach(playerEntity => {
            playerEntity.PlayerState.hasCollectedGun = true;
            playerEntity.PlayerState.hasCollectedLasso = true;
            let weapon = ECS.Helpers.addWeaponToPlayer(playerEntity, 'Gun');
            let lasso = ECS.Helpers.addWeaponToPlayer(playerEntity, 'Lasso');
            this.addEntity(weapon);
            this.addEntity(lasso);
        });


        if (Loader.cutscenes && Loader.cutscenes.desert_initial) {
            CONSTANTS.SPEEDY_MODE = false; // for testing
            if (CONSTANTS.SPEEDY_MODE) {
                //Can't tell if this is good, slight pause.
                Loader.playMusic("Tenser_Sevens.mp3", 0.3, true);
                this.playCutscene("desert_level_start", { Player: this.player }, {
                    onComplete: () => {
                        this.enemiesActive = true;
                        //Loader.playMusic("Tenser_Sevens.mp3", 0.3, true);
                    }
                });
            } else {
                Loader.playMusic("Tenser_Sevens.mp3", 0.3, true);

                this.playCutscene("desert_initial", { LeftOutlaw: outlawLeft, RightOutlaw: outlawRight }, {
                    shouldSave: true,
                    onComplete: () => {
                        // Remove the cutscene actors if they are still around (they should have walked off)
                        if (outlawLeft) this.removeEntity(outlawLeft.id);
                        if (outlawRight) this.removeEntity(outlawRight.id);
                        //Loader.playMusic("Tenser_Sevens.mp3", 0.3, true);

                        this.playCutscene("desert_level_start", { Player: this.player }, {
                            shouldSave: false,
                            onComplete: () => {
                                this.enemiesActive = true;
                            }
                        });
                    }
                });
            }
        } else {
            this.enemiesActive = true;
        }

    }

    update() {
        super.update();


        CONSTANTS.BACKGROUND_COLOR_DARKEN_ALPHA = Math.min(CONSTANTS.BACKGROUND_COLOR_DARKEN_ALPHA_MAX, 
            CONSTANTS.BACKGROUND_COLOR_DARKEN_ALPHA_MAX * (1 - this.framesToCompletion / this.totalFrames));

        if (!this.enemiesActive) return;

        // Decrease frames to completion to update background darkening
        if (this.framesToCompletion > 0) {
            this.framesToCompletion--;
        } else {
            this.onSunset();
            // scene is over here
            // ...
        }


        // Handle pending spawns
        for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
            const pending = this.pendingSpawns[i];
            pending.timer--;
            if (pending.timer <= 0) {
                // Remove exclamations
                pending.exclamations.forEach(e => this.removeEntity(e.id));
                
                // Spawn enemies
                const leftSpawner = pending.leftSpawner;
                const rightSpawner = pending.rightSpawner;
                
                // Spawn Left Guy (Faces Right)
                let leftEntity = ECS.Blueprints.createDesertKnifeOutlaw(leftSpawner.x, leftSpawner.y, false);
                this.addEntity(leftEntity);
                leftSpawner.enemyIDsThatISpawned.push(leftEntity.id);
                leftSpawner.framesUntilNextSpawn = leftSpawner.spawnDelayFrames;

                // Spawn Right Guy (Faces Left)
                let rightEntity = ECS.Blueprints.createDesertKnifeOutlaw(rightSpawner.x, rightSpawner.y, true);
                this.addEntity(rightEntity);
                rightSpawner.enemyIDsThatISpawned.push(rightEntity.id);
                rightSpawner.framesUntilNextSpawn = rightSpawner.spawnDelayFrames;
                
                this.pendingSpawns.splice(i, 1);
                // console.log("Spawned Knife Pair!");
            }
        }

        // Handle enemy spawning
        
        // 1. Cleanup Spawners
        this.spawners.forEach(spawner => {
            spawner.enemyIDsThatISpawned = spawner.enemyIDsThatISpawned.filter(enemyID => {
                return ECS.entities[enemyID];
            });
            if (spawner.framesUntilNextSpawn > 0) {
                spawner.framesUntilNextSpawn--;
            }
        });

        // // 2. Spawn Gunners (Max 2)
        // const activeGunners = ECS.getEntitiesWithComponents('DesertGunOutlaw').length;
        // if (activeGunners < 2) {
        //     const freeSpawners = this.spawners.filter(s => s.enemyIDsThatISpawned.length === 0 && s.framesUntilNextSpawn <= 0);
            
        //     if (freeSpawners.length > 0) {
        //         // 5% chance to spawn per frame if slot is open, to stagger them a bit
        //         if (Math.random() < 0.05) {
        //             const spawner = freeSpawners[Math.floor(Math.random() * freeSpawners.length)];
        //             let isLeftSpawner = spawner.name.includes("Left");
        //             let facingLeft = !isLeftSpawner;

        //             let level = 'Middle';
        //             if (spawner.name.includes('Top')) level = 'Top';
        //             if (spawner.name.includes('Bottom')) level = 'Bottom';

        //             let enemyEntity = ECS.Blueprints.createDesertGunOutlaw(spawner.x, spawner.y, facingLeft, level);
        //             this.addEntity(enemyEntity);
        //             spawner.enemyIDsThatISpawned.push(enemyEntity.id);
        //             spawner.framesUntilNextSpawn = spawner.spawnDelayFrames;
        //             console.log(`Spawned Gunner at ${spawner.name}`);
        //         }
        //     }
        // }

        // 3. Spawn Knife Pair (Intermittently)
        if (this.knifePairSpawnTimer > 0) {
            this.knifePairSpawnTimer--;
        } else {
            const freeLeft = this.leftSpawners.filter(s => s.enemyIDsThatISpawned.length === 0 && s.framesUntilNextSpawn <= 0);
            const freeRight = this.rightSpawners.filter(s => s.enemyIDsThatISpawned.length === 0 && s.framesUntilNextSpawn <= 0);

            if (freeLeft.length > 0 && freeRight.length > 0) {
                const leftSpawner = freeLeft[Math.floor(Math.random() * freeLeft.length)];
                const rightSpawner = freeRight[Math.floor(Math.random() * freeRight.length)];

                // Create Exclamations
                const ex1 = ECS.Blueprints.createExclamation(leftSpawner.x, leftSpawner.y - 8);
                const ex2 = ECS.Blueprints.createExclamation(rightSpawner.x, rightSpawner.y - 8);
                this.addEntity(ex1);
                this.addEntity(ex2);
                
                // Add to pending
                this.pendingSpawns.push({
                    timer: 60,
                    leftSpawner: leftSpawner,
                    rightSpawner: rightSpawner,
                    exclamations: [ex1, ex2]
                });

                // Reset Timer (3-6 seconds)
                this.knifePairSpawnTimer = this.framesToCompletion < this.totalFrames / 2 ?
                    this.secondHalfKnifePairSpawnTimer :
                    this.initialKnifePairSpawnTimer;
                this.knifePairSpawnTimer += Math.random() * 60;
                // console.log("Queueing Knife Pair Spawn!");
            }
        }
        
    }

    updateLevelSpecificSystems() {
        ECS.Systems.DesertEnemySystem(this.entities);
    }

    onStateLoaded() {
        this.enemiesActive = false;
        this.framesToCompletion = this.totalFrames;

        this.playCutscene("desert_level_start", { Player: this.player }, {
            onComplete: () => {
                this.enemiesActive = true;
            }
        });
    }


    onSunset() {

        //NOTE: might not want a cutscene here after sunset, maybe just transition to next (Town Goons)


        // play cutscene, etc.

        // TODO FOR RICHIE: if you want to add a cutscene here after sunset, you can do that
        // just make the onComplete transition to the next scene
        // you might want to like clear all entities except for the player (gemini can do that)
        // then spawn in two guys, then play the cutscene and pass those guys into the cutscene references,
        // gemini should be able to help

        freezeFrame(120);
        setFrameTimeout(() => {
            // transition to next scene
            GlobalState.sceneManager.switchScene(new TownGoonsScene(Loader.levels["town_goons"].xml));
            //GlobalState.sceneManager.switchScene(new TownBigHatScene(Loader.levels["town_big_hat"].xml));
        }, 120); // 2 second delay before switching
    }
}