/**
 * TEMP
 * Copy of desertScene
 * 
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

class TownGoonsScene extends LevelScene {
    constructor(mapXml) {
        super(mapXml);

        this.totalFrames = CONSTANTS.SPEEDY_MODE ? 60 : 3600; // 1 minute at 60 FPS
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
        this.waitingCannoneers = [];
        this.levelComplete = false;

        this.enemiesActive = false;
        let outlawLeft = null;
        let outlawRight = null;

        this.map.enemies.forEach((spawn) => {
            // Find OutlawLeft and OutlawRight and set their names for cutscene desert_initial reference 
            // they walk off screen in the cutscene and then disappear btw
            // desert_level_start.cutscene is what plays after this cutscene (and every time after the game saves)
            if (spawn.name === "OutlawLeft") {
                // Left side guy (Deputy)
                outlawLeft = ECS.Blueprints.createDesertGunOutlaw(spawn.x, spawn.y, true);
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
            } else if (spawn.name.startsWith("CannonOutlaw")) {
                const isLeft = spawn.x < (this.map.width * this.map.tilewidth) / 2;
                // Create with default level 'Middle', will be updated on spawn
                let outlaw = ECS.Blueprints.createTownGoonsCannonOutlaw(spawn.x, spawn.y, !isLeft, 'Middle', this);
                outlaw.TownGoonsCannonOutlaw.state = 'waiting';
                this.addEntity(outlaw);
                this.waitingCannoneers.push(outlaw);
            } else if (spawn.name === "CannonOutlaw") {
                // one of the initial "waiting" spots for the cannoneer, before they drop down later
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
                Loader.playMusic("Tenser_Sevens.mp3", 0.3, true);
                this.playCutscene("town_goons_start", { Player: this.player }, {
                    onComplete: () => {
                        this.enemiesActive = true;
                    }
                });
            } else {
                Loader.playMusic("Tenser_Sevens.mp3", 0.3, true);

                this.playCutscene("town_goons_initial", { LeftOutlaw: outlawLeft, RightOutlaw: outlawRight }, {
                    shouldSave: true,
                    onComplete: () => {
                        // Remove the cutscene actors if they are still around (they should have walked off)
                        if (outlawLeft) this.removeEntity(outlawLeft.id);
                        if (outlawRight) this.removeEntity(outlawRight.id);

                        this.playCutscene("town_goons_start", { Player: this.player }, {
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
        }

        const remainingCannoneers = ECS.getEntitiesWithComponents('TownGoonsCannonOutlaw').length;
        if (remainingCannoneers === 0 && !this.levelComplete) {
            this.levelComplete = true;
            this.onSunset();
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
                let leftEntity = ECS.Blueprints.createTownGoonsKnifeOutlaw(leftSpawner.x, leftSpawner.y-1, false);
                this.addEntity(leftEntity);
                leftSpawner.enemyIDsThatISpawned.push(leftEntity.id);
                leftSpawner.framesUntilNextSpawn = leftSpawner.spawnDelayFrames;

                // Spawn Right Guy (Faces Left)
                let rightEntity = ECS.Blueprints.createTownGoonsKnifeOutlaw(rightSpawner.x, rightSpawner.y-1, true);
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
        const activeCannoneers = ECS.getEntitiesWithComponents('TownGoonsCannonOutlaw').filter(e => e.TownGoonsCannonOutlaw.state !== 'waiting').length;
        if (activeCannoneers < 2) {
            // Cannon enemies spawn on Top and Middle platforms
            const freeSpawners = this.spawners.filter(s => 
                s.enemyIDsThatISpawned.length === 0 && 
                s.framesUntilNextSpawn <= 0 &&
                (s.name.includes('Top') || s.name.includes('Middle'))
            );
            
            if (freeSpawners.length > 0 && this.waitingCannoneers.length > 0) {
                // 5% chance to spawn per frame if slot is open, to stagger them a bit
                if (Math.random() < 0.05) {
                    const spawner = freeSpawners[Math.floor(Math.random() * freeSpawners.length)];
                    
                    // Find closest waiting cannoneer
                    let closestIndex = -1;
                    let minDist = Infinity;
                    
                    this.waitingCannoneers.forEach((c, index) => {
                        const dist = Math.abs(c.Position.x - spawner.x) + Math.abs(c.Position.y - spawner.y);
                        if (dist < minDist) {
                            minDist = dist;
                            closestIndex = index;
                        }
                    });

                    if (closestIndex !== -1) {
                        const enemyEntity = this.waitingCannoneers[closestIndex];
                        this.waitingCannoneers.splice(closestIndex, 1);

                        // Drop down
                        enemyEntity.Position.y += 2;
                        enemyEntity.TownGoonsCannonOutlaw.state = 'entering';
                        
                        // Update properties based on spawner
                        let level = 'Middle';
                        if (spawner.name.includes('Top')) level = 'Top';
                        if (spawner.name.includes('Bottom')) level = 'Bottom';
                        enemyEntity.TownGoonsCannonOutlaw.currentLevel = level;

                        let isLeftSpawner = spawner.name.includes("Left");
                        let facingLeft = !isLeftSpawner;
                        
                        // Update SpawnSide
                        if (enemyEntity.has('SpawnSide')) {
                            enemyEntity.SpawnSide.side = facingLeft ? 'right' : 'left';
                        }
                        // Update Sprite Flip
                        if (enemyEntity.has('AnimatedSprite')) {
                            enemyEntity.AnimatedSprite.flipX = facingLeft;
                            enemyEntity.AnimatedSprite.direction = facingLeft ? -1 : 1;
                        }

                        spawner.enemyIDsThatISpawned.push(enemyEntity.id);
                        spawner.framesUntilNextSpawn = spawner.spawnDelayFrames;
                        console.log(`Activated Cannoneer at ${spawner.name}`);
                    }
                }
            }
        }


        // make sure that if there are two cannoneers on the same side and they're both in their strafing states, one of them drops down
        ECS.getEntitiesWithComponents('TownGoonsCannonOutlaw').forEach(entity => {
            if (entity.has('Stunned')) return;
            const cannoneer = entity.TownGoonsCannonOutlaw;
            
            if (cannoneer.state === 'strafing_back' || cannoneer.state === 'strafing_forward') {
                // find other cannoneers on same side in strafing state
                const isLeftSide = entity.has('SpawnSide') && entity.SpawnSide.side === 'left';
                const others = ECS.getEntitiesWithComponents('TownGoonsCannonOutlaw').filter(e => {
                    if (e.id === entity.id) return false;
                    const otherIsLeft = e.has('SpawnSide') && e.SpawnSide.side === 'left';
                    const otherState = e.TownGoonsCannonOutlaw.state;
                    return otherIsLeft === isLeftSide && (otherState === 'strafing_back' || otherState === 'strafing_forward');
                });
                if (others.length > 0) {
                    console.log("Multiple cannoneers on same side strafing, dropping one down");
                    // if their Y position is within 1 pixel, drop one down
                    const other = others[0];
                    if (Math.abs(other.Position.y - entity.Position.y) < 1) {
                        // drop down the other cannoneer
                        other.Position.y += 2;
                        // other.TownGoonsCannonOutlaw.state = 'entering';
                    }
                }
            }
        });



        // 3. Spawn Knife Pair (Intermittently)
        if (this.knifePairSpawnTimer > 0) {
            this.knifePairSpawnTimer--;
        } else {
            // Knife enemies spawn on Bottom platforms
            const freeLeft = this.leftSpawners.filter(s => 
                s.enemyIDsThatISpawned.length === 0 && 
                s.framesUntilNextSpawn <= 0 &&
                s.name.includes('Bottom')
            );
            const freeRight = this.rightSpawners.filter(s => 
                s.enemyIDsThatISpawned.length === 0 && 
                s.framesUntilNextSpawn <= 0 &&
                s.name.includes('Bottom')
            );

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

        ECS.Systems.TownGoonEnemySystem(this.entities);
    }


    onStateLoaded() {
        this.enemiesActive = false;
        this.framesToCompletion = this.totalFrames;
        this.levelComplete = false;
        
        this.pendingSpawns = []; // Clear pending spawns

        // Reset spawners
        this.spawners.forEach(spawner => {
            spawner.enemyIDsThatISpawned = [];
            spawner.framesUntilNextSpawn = 0;
        });

        // Repopulate waitingCannoneers
        this.waitingCannoneers = ECS.getEntitiesWithComponents('TownGoonsCannonOutlaw')
            .filter(e => e.TownGoonsCannonOutlaw.state === 'waiting');
            
        console.log("State Loaded. Waiting Cannoneers:", this.waitingCannoneers.length);

        this.playCutscene("town_goons_start", { Player: this.player }, {
            onComplete: () => {
                this.enemiesActive = true;
            }
        });
    }


    onSunset() {

        freezeFrame(120);
        setFrameTimeout(() => {
            // transition to next scene
            GlobalState.sceneManager.switchScene(new TownBigHatScene(Loader.levels["town_big_hat"].xml));
        }, 120); // 3 second delay before switching
    }
}