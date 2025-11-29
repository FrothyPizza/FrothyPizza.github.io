ECS.Blueprints.createTownGoonsKnifeOutlaw = function(x, y, facingLeft = false) {
    let entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Velocity(0, -0.5));
    entity.addComponent(new ECS.Components.Gravity(0.08));
    entity.addComponent(new ECS.Components.Dimensions(8, 8));
    entity.addComponent(new ECS.Components.CollidesWithMap(true));
    entity.addComponent(new ECS.Components.MapCollisionState());
    entity.addComponent(new ECS.Components.Hitbox([{x: 1, y: 1, w: 7, h: 7}]));
    entity.addComponent(new ECS.Components.Hurtbox([{x: 2, y: 2, w: 5, h: 5}]));
    entity.addComponent(new ECS.Components.IsEnemy(true));
    entity.addComponent(new ECS.Components.DamagesPlayer(true));
    entity.addComponent(new ECS.Components.TownGoonsKnifeOutlaw());
    
    // Left side (facingLeft=false) gets Deputy, Right side (facingLeft=true) gets KnifeOutlaw
    const spriteName = facingLeft ? "KnifeOutlaw" : "KnifeOutlaw";
    const sprite = new ECS.Components.AnimatedSprite(
        Loader.spriteSheets[spriteName], 
        "Run", 
        12
    );
    // sprite.flipX = facingLeft;
    entity.addComponent(sprite);

    entity.addComponent(new ECS.Components.SpawnSide(facingLeft ? 'right' : 'left'));
    
    entity.interactWith = ECS.Blueprints.DesertOutlawInteract;
    
    return entity;
}

ECS.Blueprints.createTownGoonsCannonOutlaw = function(x, y, facingLeft = false, level = 'Middle', scene = null) {
    let entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Velocity(0, 0));
    entity.addComponent(new ECS.Components.Gravity());
    entity.addComponent(new ECS.Components.Dimensions(8, 8));
    entity.addComponent(new ECS.Components.CollidesWithMap(true));
    entity.addComponent(new ECS.Components.MapCollisionState());
    entity.addComponent(new ECS.Components.Hitbox([{x: 1, y: 1, w: 7, h: 7}]));
    entity.addComponent(new ECS.Components.Hurtbox([{x: 2, y: 2, w: 5, h: 5}]));
    entity.addComponent(new ECS.Components.IsEnemy(true));
    entity.addComponent(new ECS.Components.DamagesPlayer(true));


    const cannon = ECS.Blueprints.createTownGoonsCannon(0, 0);
    const targetScene = scene || GlobalState.currentScene;
    if (targetScene) {
        targetScene.addEntity(cannon);
    }
    entity.addComponent(new ECS.Components.BoundEntities());
    entity.BoundEntities.entitiesWithOffsets.push({
        entity: cannon,
        offsetX: 8,
        offsetY: -4
    });
    
    let gunOutlaw = new ECS.Components.TownGoonsCannonOutlaw();
    gunOutlaw.currentLevel = level;
    entity.addComponent(gunOutlaw);
    
    // Left side (facingLeft=false) gets Deputy, Right side (facingLeft=true) gets KnifeOutlaw
    const spriteName = facingLeft ? "KnifeOutlaw" : "KnifeOutlaw";
    const sprite = new ECS.Components.AnimatedSprite(
        Loader.spriteSheets[spriteName], 
        "Idle", 
        12
    );
    sprite.flipX = facingLeft;
    entity.addComponent(sprite);

    entity.addComponent(new ECS.Components.SpawnSide(facingLeft ? 'right' : 'left'));
    
    // entity.interactWith = ECS.Blueprints.DesertOutlawInteract;
    // entity.interactWith = ECS.Blueprints.townGoonCannonOutlawInteract;
    
    return entity;
}






ECS.Blueprints.createTownGoonsCannon = function(x, y) {
    let entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Dimensions(12, 10));
    entity.addComponent(new ECS.Components.AnimatedSprite(
        Loader.spriteSheets.Cannon,
        "Idle",
        12
    ));

    return entity;
}

ECS.Blueprints.TownGoonsOutlawInteract = function(other) {
    // Town Goons Outlaw vs Town Goons Outlaw Collision (Stun logic)
    if (other.has('IsEnemy') && !other.has('PlayerState')) { // Colliding with another enemy
         // Check if they are from different sides
         if (this.has('SpawnSide') && other.has('SpawnSide')) {
             if (this.SpawnSide.side === other.SpawnSide.side) return;
         }

         if (!this.has('Stunned') && !other.has('Stunned')) {
            const dir = Math.sign(this.Position.x - other.Position.x) || 1;

            // Entity A moves away from B (dir)
            this.addComponent(new ECS.Components.Stunned({x: 0.5 * dir, y: -1}, 40, 0, true));
            
            // Entity B moves away from A (-dir)
            other.addComponent(new ECS.Components.Stunned({x: 0.5 * -dir, y: -1}, 40, 0, true));
            // remove map collider component to prevent further collisions during stun
            this.removeComponent('CollidesWithMap');
            other.removeComponent('CollidesWithMap');
            shakeScreen(3);
            
            // Play sound here
            Loader.playSound("hit.wav");
        }
    }
}

ECS.Blueprints.createTownGoonsCannonBullet = function(x, y, direction, speed) {
    let entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Velocity(speed * direction, 0));
    entity.addComponent(new ECS.Components.Dimensions(4, 3));
    entity.addComponent(new ECS.Components.DamagesPlayer(true));

    entity.addComponent(new ECS.Components.Gravity(0.03));
    
    // add hitbox and hurtbox
    entity.addComponent(new ECS.Components.Hitbox([{x: 0, y: 0, w: 4, h: 3}]));
    entity.addComponent(new ECS.Components.Hurtbox([{x: 0, y: 0, w: 4, h: 3}]));
    
    entity.addComponent(new ECS.Components.AnimatedSprite(
        Loader.spriteSheets.Bullet,
        "Idle",
        8
    ));
    // entity.interactWith = ECS.Blueprints.DesertBulletInteract;
    return entity;
}

ECS.Blueprints.TownGoonsCannonInteract = function(other) {
    if (other.has('MapCollisionState') && (other.MapCollisionState.leftHit || other.MapCollisionState.rightHit || other.MapCollisionState.topHit || other.MapCollisionState.bottomHit)) {
         this.addComponent(new ECS.Components.RemoveFromScene(true));
    }
}
