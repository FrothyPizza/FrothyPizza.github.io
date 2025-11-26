// LevelScene - handles gameplay with map, entities, and systems
class LevelScene extends Scene {
    constructor(mapXml) {
        super();
        this.map = new Map(mapXml);
        this.cutscenePlayer = null;
    }

    init() {
        // Spawn player at map spawn point
        if (this.map.playerSpawn) {
            const player = ECS.Blueprints.createPlayer(
                this.map.playerSpawn.x, 
                this.map.playerSpawn.y
            );
            this.addEntity(player);
            this.player = player;

            // const testEnemy = ECS.Blueprints.testCharonEnemy(this.map.playerSpawn.x, this.map.playerSpawn.y - 20);
            // this.addEntity(testEnemy);
        }

    }

    playCutscene(keyOrScript, entityRefs = {}, options = {}) {
        const runtimeOptions = { scene: this, ...options };
        
        // Wrap onComplete to save state
        const originalOnComplete = runtimeOptions.onComplete;
        runtimeOptions.onComplete = (player) => {
            if (originalOnComplete) originalOnComplete(player);
            
            if (options.shouldSave !== false) {
                this.createSaveState();
            }
        };

        const player = typeof keyOrScript === 'string'
            ? Cutscene.fromKey(keyOrScript, entityRefs, runtimeOptions)
            : Cutscene.create(keyOrScript, entityRefs, runtimeOptions);
        if (!player) {
            return null;
        }
        this.cutscenePlayer = player;
        return this.cutscenePlayer;
    }

    update() {
        let blockPlayerInput = false;
        if (this.cutscenePlayer && this.cutscenePlayer.isActive()) {
            this.cutscenePlayer.update();
            if (this.cutscenePlayer.isFinished()) {
                this.cutscenePlayer = null;
            } else {
                blockPlayerInput = !!this.cutscenePlayer.blocksGameplay;
            }
        }

        let suppressedInputs = null;
        if (blockPlayerInput && typeof Inputs !== 'undefined') {
            suppressedInputs = {};
            Object.keys(Inputs).forEach(key => {
                suppressedInputs[key] = Inputs[key];
                Inputs[key] = false;
            });
        }

        try {

        // Run player systems first (order matters!)
        ECS.Systems.physicsSystem(this.entities);

        ECS.Systems.ComposedPlayerPhysicsSystem(this.entities, this.map);
        
        // Run core ECS systems
        ECS.Systems.mapCollisionSystem(this.entities, this.map);


        // Run player collision systems
        ECS.Systems.playerSpikeDamageSystem(this.entities, this.map);
        ECS.Systems.playerOffMapSystem(this.entities, this.map);
        ECS.Systems.playerInvincibilitySystem(this.entities);
        ECS.Systems.playerAttackSystem(this.entities, this.map);
        ECS.Systems.bulletSystem(this.entities);


        
        // Run other systems
        ECS.Systems.entityCollisionSystem(this.entities);
        ECS.Systems.bossSystem(this.entities);
        // ECS.Systems.saloonOutlawSystem(this.entities, this.map, this);
        this.updateLevelSpecificSystems();
        ECS.Systems.stunnedSystem(this.entities, this);

        ECS.Systems.boundEntitySystem(this.entities, this.map);
        
        // Update player state and animation
        ECS.Systems.playerStateMachineSystem(this.entities);
        ECS.Systems.playerAnimationSystem(this.entities);
        ECS.Systems.animationSystem(this.entities);

        ECS.Systems.viewSystem(this.entities, context);
        
        if (ECS.Systems.scoreTextSystem) {
            ECS.Systems.scoreTextSystem(this.entities);
        }

        


        

        // Remove dead entities
        Object.keys(this.entities).forEach(id => {
            const entity = this.entities[id];
            if(entity == null) return;
            if (entity.has('Dead') && entity.Dead.dead) {

                // If player dies, load save state
                if (entity.has('PlayerState')) {
                    if (this.savedState) {
                        // Calculate total loss: (Current Score - (Saved Score - 400))
                        // This represents everything earned since save + the 400 penalty
                        const currentScore = this.player ? this.player.PlayerState.score : 0;
                        
                        this.loadSaveState();
                        
                        // Apply death penalty
                        if (this.player && this.player.has('PlayerState')) {
                            const savedScore = this.player.PlayerState.score;
                            const totalLoss = currentScore - (savedScore - 200);
                            
                            // Apply the actual penalty to the score
                            this.player.PlayerState.score -= 200;
                            
                            // Show the visual text for the total amount lost, but don't apply it to score again
                            ECS.Helpers.scorePoints(-totalLoss, this.player.Position.x, this.player.Position.y - 10, 'maroon', 60, 0.5, false);
                            
                            // Save the new state with the penalty applied so it persists across multiple deaths
                            this.createSaveState();
                        }
                        return; // Stop processing removals for this frame
                    }
                }

           
                if(entity.has('BoundEntities') && entity.BoundEntities.entitiesWithOffsets) {
                    entity.BoundEntities.entitiesWithOffsets.forEach(boundEntityWithOffset => {
                        this.removeEntity(boundEntityWithOffset.entity.id);
                    });
                }

                this.removeEntity(id);
            }
            if (entity.has('RemoveFromScene') && entity.RemoveFromScene.remove) {

                if(entity.has('BoundEntities') && entity.BoundEntities.entitiesWithOffsets) {
                    entity.BoundEntities.entitiesWithOffsets.forEach(boundEntityWithOffset => {
                        console.log("Removing bound entity:", boundEntityWithOffset.entity.id);
                        this.removeEntity(boundEntityWithOffset.entity.id);
                    });
                }

                this.removeEntity(id);
            }
        });
        } finally {
            if (suppressedInputs) {
                Object.keys(suppressedInputs).forEach(key => {
                    Inputs[key] = suppressedInputs[key];
                });
            }
        }

        if (this.cutscenePlayer && this.cutscenePlayer.isFinished()) {
            this.cutscenePlayer = null;
        }
    }

    updateLevelSpecificSystems() {
        // Placeholder for level-specific system updates
    }

    draw(context) {
        // Draw the map
        this.map.draw(context);

        // Run render system to draw all entities
        ECS.Systems.renderSystem(this.entities, context);

        if (this.cutscenePlayer) {
            this.cutscenePlayer.draw(context, this);
        }
    }

    cleanup() {
        super.cleanup();
        this.cutscenePlayer = null;
        // Additional cleanup for level-specific resources if needed
    }
}



