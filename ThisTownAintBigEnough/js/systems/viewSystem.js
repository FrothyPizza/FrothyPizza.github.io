
// View System: Handles the view

ECS.Systems.viewSystem = function(entities, context) {
    Object.values(entities).forEach(entity => {
        // Only render entities with Position
        if (!entity.has('ViewLock')) return;
        const viewLock = entity.ViewLock;

        if(viewLock.enabled && entity.has('Position')) {
            context.view.setTarget(entity.Position);
        }
        


    });
}