
/*
/**
 * Bound Entities Component; entities stored in this component will have their positions
 * bound to the parent entity's position.
 * 
 * Pass in entitiesWithOffsets as an array of objects with the following structure:
 * [
 *   { entity: <ECS.Entity>, offsetX: <number>, offsetY: <number> },
 *   ...
 * ]
 */


ECS.Systems.boundEntitySystem = function(entities) {
    Object.values(entities).forEach(entity => {
        // Only process entities with BoundEntities component
        if (!entity.has('BoundEntities', 'Position')) return;
        const boundEntitiesComp = entity.BoundEntities;
        const parentPosition = entity.Position;

        boundEntitiesComp.entitiesWithOffsets.forEach(boundObj => {
            if(!boundObj.entity) return;

            const boundEntity = boundObj.entity;
            let offsetX = typeof boundObj.offsetX === 'number' ? boundObj.offsetX : 0;
            const offsetY = typeof boundObj.offsetY === 'number' ? boundObj.offsetY : 0;

            let flip = false
            if (entity.has('AnimatedSprite')) {
                flip = !(entity.AnimatedSprite.direction == 1);

            }
            if (boundEntity.has('Position')) {
                if(flip) {
                    // Flip logic: Mirror around the center of the parent
                    // New X = ParentX + ParentWidth - OffsetX - BoundWidth
                    const parentWidth = entity.Dimensions ? entity.Dimensions.width : 0;
                    const boundWidth = boundEntity.Dimensions ? boundEntity.Dimensions.width : 0;

                    boundEntity.Position.x = parentPosition.x + parentWidth - offsetX - boundWidth;
                    boundEntity.Position.y = parentPosition.y + offsetY;

                    if(boundEntity.has('AnimatedSprite')) {
                        boundEntity.AnimatedSprite.direction = -1;
                    }

                } else {
                    if(boundEntity.has('AnimatedSprite')) {
                        boundEntity.AnimatedSprite.direction = 1;
                    }
                    boundEntity.Position.x = parentPosition.x + offsetX;
                    boundEntity.Position.y = parentPosition.y + offsetY;
                }
            }
        });
    });
}
        