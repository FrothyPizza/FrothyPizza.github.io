

ECS.Blueprints.createStunnedBirds = function(x, y) {
    let entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));

    entity.addComponent(new ECS.Components.AnimatedSprite(
        Loader.spriteSheets.StunnedBirds, 
        "Idle", 
        8
    ));
    entity.addComponent(new ECS.Components.Dimensions(8, 8));

    return entity;
}


ECS.Blueprints.createExclamation = function(x, y) {
    let entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.AnimatedSprite(
        Loader.spriteSheets.Exclamation, 
        "Init", 
        6
    ));
    entity.AnimatedSprite.onAnimationComplete = function() {
        entity.AnimatedSprite.setAnimation("Idle");
    };

    entity.addComponent(new ECS.Components.Dimensions(8, 8));
    return entity;
}




ECS.Helpers.addStunnedBirdsToEntity = function(entity, scene) {
    if(!entity.has('BoundEntities')) {
        entity.addComponent(new ECS.Components.BoundEntities());
    }

    const boundEntities = entity.BoundEntities;
    const offsetX = 0;
    const offsetY = -8;
    const birds = ECS.Blueprints.createStunnedBirds(entity.Position.x + offsetX, entity.Position.y + offsetY);
    boundEntities.entitiesWithOffsets.push({ entity: birds, offsetX: offsetX, offsetY: offsetY });

    // console.log("Adding stunned birds to entity", entity, "birds entity:", birds);

    if (scene && typeof scene.addEntity === 'function') {
        scene.addEntity(birds);
    } else {
        ECS.register(birds);
    }

    return birds;

}


ECS.Helpers.removeStunnedBirdsFromEntity = function(entity, scene) {
    if (!entity.has('BoundEntities')) return;

    const boundEntities = entity.BoundEntities;
    
    // Find birds to remove
    const birdsToRemove = boundEntities.entitiesWithOffsets.filter(item => {
        const e = item.entity;
        // Check if entity is valid and has AnimatedSprite with StunnedBirds sheet
        // Note: AnimatedSprite stores the sheet in 'jsonData' property
        return e && e.has && e.has('AnimatedSprite') && e.AnimatedSprite.jsonData === Loader.spriteSheets.StunnedBirds;
    });

    // Remove them from scene/ECS
    birdsToRemove.forEach(item => {
        const birdEntity = item.entity;
        if (scene && typeof scene.removeEntity === 'function') {
            scene.removeEntity(birdEntity.id);
        } else {
            ECS.removeEntity(birdEntity.id);
        }
    });

    // Update the bound entities list by filtering out the removed ones
    boundEntities.entitiesWithOffsets = boundEntities.entitiesWithOffsets.filter(item => {
        // Keep items that are NOT in the birdsToRemove list
        return !birdsToRemove.includes(item);
    });
}


ECS.Helpers.addExclamationToEntity = function(entity, scene) {
    if(!entity.has('BoundEntities')) {
        entity.addComponent(new ECS.Components.BoundEntities());
    }

    // Play sound here?

    const boundEntities = entity.BoundEntities;
    const offsetX = 0;
    const offsetY = -16;
    const exclamation = ECS.Blueprints.createExclamation(entity.Position.x + offsetX, entity.Position.y + offsetY);
    boundEntities.entitiesWithOffsets.push({ entity: exclamation, offsetX: offsetX, offsetY: offsetY });
    if (scene && typeof scene.addEntity === 'function') {
        scene.addEntity(exclamation);
    } else {
        ECS.register(exclamation);
    }
    return exclamation;

}

ECS.Helpers.scorePoints = function(points, x, y, color = 'yellow', duration = 60, floatSpeed = 0.5, applyToScore = true) {
    // Update player score if available
    if (applyToScore && GlobalState.currentScene && GlobalState.currentScene.player && GlobalState.currentScene.player.has('PlayerState')) {
        GlobalState.currentScene.player.PlayerState.score += points;
    }

    let entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.ScoreText(points.toString(), color, duration, floatSpeed));
    entity.addComponent(new ECS.Components.DoNotSave());
    
    if (GlobalState.currentScene) {
        GlobalState.currentScene.addEntity(entity);
    } else {
        ECS.register(entity);
    }
    return entity;
}