
ECS.Systems.stunnedSystem = function(entities, scene) {
    Object.values(entities).forEach(entity => {
        if (!entity.has('Stunned')) return;

        const stunned = entity.Stunned;

        
        // Initialize: Apply knockback
        if (stunned.state === 'INIT') {
            if (entity.has('Velocity')) {
                entity.Velocity.x = stunned.knockbackVelocity.x;
                entity.Velocity.y = stunned.knockbackVelocity.y;
            }
            stunned.state = 'KNOCKBACK';
            stunned.timer = stunned.knockbackDuration;
        }

        // Phase 1: Knockback
        if (stunned.state === 'KNOCKBACK') {
            stunned.timer--;
            if (stunned.timer <= 0) {
                // Stop movement
                if (entity.has('Velocity')) {
                    entity.Velocity.x = 0;
                    entity.Velocity.y = 0;
                }
                
                // Add visual effects
                if (ECS.Helpers.addStunnedBirdsToEntity) {
                    ECS.Helpers.addStunnedBirdsToEntity(entity, scene);
                }

                // Add invincibility
                if (!entity.has('InvincibilityFrames')) {
                    entity.addComponent(new ECS.Components.InvincibilityFrames(stunned.dazeDuration + 10));
                } else {
                    entity.InvincibilityFrames.duration = stunned.dazeDuration + 10;
                }

                stunned.state = 'DAZED';
                stunned.timer = stunned.dazeDuration;
            }
        }

        // Phase 2: Dazed
        else if (stunned.state === 'DAZED') {
            stunned.timer--;
            if (stunned.timer <= 0) {
                if (stunned.removeOnComplete) {
                    if (!entity.has('RemoveFromScene')) {
                        entity.addComponent(new ECS.Components.RemoveFromScene(true));
                    }
                } else {
                    ECS.Helpers.removeStunnedBirdsFromEntity(entity, scene);
                    entity.removeComponent('InvincibilityFrames');
                    entity.removeComponent('Stunned');
                    console.log("Entity has recovered from stunned state.");    
                    console.log(entity);
                }
                stunned.state = 'FINISHED';
            }
        }
    });
};
