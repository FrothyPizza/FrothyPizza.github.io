
// Entity collision system - handles collision detection between entities

ECS.Systems.entityCollisionSystem = function(entities) {
    const entityArray = Object.values(entities);
    
    // Check collisions between all entity pairs
    for (let i = 0; i < entityArray.length; i++) {
        const entity = entityArray[i];
        // Updtae hitbox and hurtbox positions based on sequencer data if available
        if (entity.has('AnimatedSprite')) {
            const sprite = entity.AnimatedSprite;
            const hitboxData = sprite.getSequencerDataForCurrentFrame('hitbox');
            if (hitboxData) {
                entity.Hitbox.boxes = hitboxData;
            }
            const hurtboxData = sprite.getSequencerDataForCurrentFrame('hurtbox');
            if (hurtboxData) {
                entity.Hurtbox.boxes = hurtboxData;
            }
        }

        for (let j = i + 1; j < entityArray.length; j++) {
            const entityA = entityArray[i];
            const entityB = entityArray[j];


            // Both entities need Position, Dimensions, Hitbox, and Hurtbox to collide
            if (!entityA.has('Position', 'Dimensions', 'Hitbox') || 
                !entityB.has('Position', 'Dimensions', 'Hurtbox')) {
                continue;
            }

            

            if (colliding(entityA, entityB)) {
                if (typeof entityA.interactWith === 'function') {
                    entityA.interactWith(entityB);
                }            
            }


            if (colliding(entityB, entityA)) {
                if (typeof entityB.interactWith === 'function') {
                    entityB.interactWith(entityA);
                }            
            }

            // Check if entities are colliding
            // if (colliding(entityA, entityB) || colliding(entityB, entityA)) {
                // // Call interactWith if method exists
                // if (typeof entityA.interactWith === 'function') {
                //     entityA.interactWith(entityB);
                // }
                // if (typeof entityB.interactWith === 'function') {
                //     entityB.interactWith(entityA);
                // }


                // // Saloon Outlaw vs Saloon Outlaw Collision
                // if (entityA.has('SaloonKnifeOutlaw') && entityB.has('SaloonKnifeOutlaw')) {
                //     if (!entityA.has('Stunned') && !entityB.has('Stunned')) {
                //         const dir = Math.sign(entityA.Position.x - entityB.Position.x) || 1;

                //         shakeScreen(3);
                        
                //         // Entity A moves away from B (dir)
                //         entityA.addComponent(new ECS.Components.Stunned({x: 0.25 * dir, y: -1}));
                        
                //         // Entity B moves away from A (-dir)
                //         entityB.addComponent(new ECS.Components.Stunned({x: 0.25 * -dir, y: -1}));
                //     }
                // }
            // }
        }
    }
}

// Helper function to check if two entities are colliding
function colliding(entityA, entityB) {
    const posA = entityA.Position;
    const posB = entityB.Position;

    if(!entityA.has('Hitbox') || !entityB.has('Hurtbox')) {
        return false;
    }

    // Check if any hitbox of entityA collides with any hurtbox of entityB
    for (let hitbox of entityA.Hitbox.boxes) {
        for (let hurtbox of entityB.Hurtbox.boxes) {
            if (posA.x + hitbox.x + hitbox.w > posB.x + hurtbox.x && 
                posA.x + hitbox.x < posB.x + hurtbox.x + hurtbox.w &&
                posA.y + hitbox.y + hitbox.h > posB.y + hurtbox.y && 
                posA.y + hitbox.y < posB.y + hurtbox.y + hurtbox.h) {
                return true;
            }
        }
    }
    return false;
}

// Helper function for checking collision between two entities (can be used externally)
ECS.Helpers.colliding = colliding;
