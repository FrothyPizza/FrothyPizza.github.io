ECS.Blueprints.createBigHatBoss = function(x, y, scene, bossCues) {
    const entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Dimensions(16, 16));
    entity.addComponent(new ECS.Components.Velocity(0, 0));
    entity.addComponent(new ECS.Components.Gravity(0.1));
    
    const state = new ECS.Components.BigHatBossState();
    state.bossCues = bossCues;
    entity.addComponent(state);
    
    entity.addComponent(new ECS.Components.AnimatedSprite(Loader.spriteSheets.BigHat, "Idle", 8));
    entity.addComponent(new ECS.Components.IsEnemy(true));
    entity.addComponent(new ECS.Components.CollidesWithMap(true));
    entity.addComponent(new ECS.Components.MapCollisionState());
    entity.addComponent(new ECS.Components.Hitbox([{x: 0, y: 0, w: 16, h: 16}]));
    entity.addComponent(new ECS.Components.Hurtbox([{x: 2, y: 0, w: 12, h: 16}]));
    
    // Bind Hat
    ECS.Helpers.addBigHatHatToBoss(entity, scene);

    return entity;
}

ECS.Blueprints.createBigHatHat = function(x, y) {
    const entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Dimensions(20, 20));
    entity.addComponent(new ECS.Components.BigHatHatState());
    entity.addComponent(new ECS.Components.AnimatedSprite(Loader.spriteSheets.BigHatHat, "Idle", 8));
    entity.addComponent(new ECS.Components.IsEnemy(true));
    entity.addComponent(new ECS.Components.Hitbox([{x: 0, y: 0, w: 20, h: 20}]));
    entity.addComponent(new ECS.Components.Hurtbox([{x: 0, y: 0, w: 20, h: 20}]));
    entity.addComponent(new ECS.Components.Velocity(0, 0));

    entity.interactWith = ECS.Blueprints.BigHatHatInteract;
    
    return entity;
}

ECS.Helpers.addBigHatHatToBoss = function(bossEntity, scene) {
    if(!bossEntity.has('BoundEntities')) {
        bossEntity.addComponent(new ECS.Components.BoundEntities());
    }
    
    // Initial offset for the hat on the boss's head
    const offsetX = -2; 
    const offsetY = -12;
    
    const hat = ECS.Blueprints.createBigHatHat(bossEntity.Position.x + offsetX, bossEntity.Position.y + offsetY);
    
    bossEntity.BoundEntities.entitiesWithOffsets.push({
        entity: hat,
        offsetX: offsetX,
        offsetY: offsetY
    });
    
    if (scene) {
        scene.addEntity(hat);
    } else {
        ECS.register(hat);
    }
}

ECS.Blueprints.createBigHatSmallHatProjectile = function(x, y, velocityX, velocityY) {
    const entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Dimensions(8, 8));
    entity.addComponent(new ECS.Components.Velocity(velocityX, velocityY));
    entity.addComponent(new ECS.Components.BigHatSmallHatProjectile());
    entity.addComponent(new ECS.Components.AnimatedSprite(Loader.spriteSheets.BigHatSmallHatProjectile, "Rotate", 6));
    entity.addComponent(new ECS.Components.IsEnemy(true));
    entity.addComponent(new ECS.Components.Hitbox([{x: 0, y: 0, w: 8, h: 8}]));
    entity.addComponent(new ECS.Components.Hurtbox([{x: 1, y: 1, w: 6, h: 6}]));
    entity.addComponent(new ECS.Components.DamagesPlayer(true));
    
    entity.interactWith = ECS.Blueprints.BigHatSmallHatProjectileInteract;
    
    return entity;
}

ECS.Blueprints.BigHatSmallHatProjectileInteract = function(other) {
    // If hit by player bullet
    if (other.has('Bullet') && !this.has('BigHatStunned')) {
        this.addComponent(new ECS.Components.BigHatStunned());
        this.AnimatedSprite.setAnimation("IdleUpsideDown");
        this.Velocity.x = 0;
        this.Velocity.y = 0;
        
        // Remove bullet
        other.addComponent(new ECS.Components.RemoveFromScene(true));
    }
    
    // If hit by player lasso while stunned
    if (other.has('Weapon') && other.Weapon.type === 'Lasso' && this.has('BigHatStunned')) {
        const speed = 4;
        this.Velocity.x = speed;
        this.Velocity.y = 0;

        
        this.BigHatSmallHatProjectile.state = "RETURNING";
        this.removeComponent('BigHatStunned'); // No longer stunned, now a projectile against boss
        this.removeComponent('DamagesPlayer');
        this.AnimatedSprite.setAnimation("Rotate");
    }
    
    // If hitting boss while returning
    if (other.has('BigHatBossState') && this.BigHatSmallHatProjectile.state === "RETURNING" && !other.has('Stunned')) {
        // Damage boss logic here
        console.log("Boss hit by returning hat!");
        this.addComponent(new ECS.Components.RemoveFromScene(true));

        const dir = Math.sign(this.Velocity.x) || 1;
        let duration = 120;
        other.addComponent(new ECS.Components.Stunned({x: 0, y: -1.5}, 20, duration, false));

        other.BigHatBossState.health -= 1;
        
        // Apply damage/stun to boss
        // other.addComponent(new ECS.Components.Stunned(...)); 
    }
}


ECS.Blueprints.BigHatHatInteract = function(other) {

    if(!this.BigHatHatState.isSineWave) return;

    if(this.has('InvincibilityFrames')) return;

    // If hit by player bullet
    if (other.has('Bullet') && !this.has('BigHatStunned')) {
        if (other.has('IsEnemy')) return;

        console.log("Big Hat Hat hit by bullet, stunning!");

        this.addComponent(new ECS.Components.BigHatStunned());
        this.AnimatedSprite.setAnimation("Idle");
        this.Velocity.x = 0;
        this.Velocity.y = 0;

        this.BigHatHatState.state = "STUNNED";
        
        // Remove bullet
        other.addComponent(new ECS.Components.RemoveFromScene(true));
    }
    
    // If hit by player lasso while stunned
    if (other.has('Weapon') && other.Weapon.type === 'Lasso' && this.has('BigHatStunned')) {
        const speed = 4;
        this.Velocity.x = speed;
        this.Velocity.y = 0;

        
        this.BigHatHatState.state = "RETURNING";
        this.removeComponent('BigHatStunned'); // No longer stunned, now a projectile against boss
        this.removeComponent('DamagesPlayer');
        this.AnimatedSprite.setAnimation("Rotate");
    }
    
    // If hitting boss while returning
    if (other.has('BigHatBossState') && this.BigHatHatState.state === "RETURNING") {
        // Damage boss logic here
        console.log("Boss hit by returning hat!");
        this.addComponent(new ECS.Components.RemoveFromScene(true));

        const dir = Math.sign(this.Velocity.x) || 1;
        let duration = 120;
        other.addComponent(new ECS.Components.Stunned({x: 0, y: -1.5}, 20, duration, false));

        other.BigHatBossState.health -= 1;
        
        // Apply damage/stun to boss
        // other.addComponent(new ECS.Components.Stunned(...)); 
    }
}


ECS.Blueprints.createBigHatBullet = function(x, y, vx, vy) {
    const entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Velocity(vx, vy));
    entity.addComponent(new ECS.Components.Dimensions(4, 4));
    entity.addComponent(new ECS.Components.IsEnemy(true)); // Damages player
    entity.addComponent(new ECS.Components.DamagesPlayer(true));
    entity.addComponent(new ECS.Components.Hitbox([{x: 0, y: 0, w: 4, h: 4}]));
    entity.addComponent(new ECS.Components.Hurtbox([{x: 0, y: 0, w: 4, h: 4}]));
    
    // Use bullet sprite or small dot
    entity.addComponent(new ECS.Components.AnimatedSprite(Loader.spriteSheets.BulletSmall, "Idle", 12));
    
    // Cleanup after some time
    entity.addComponent(new ECS.Components.Bullet(300)); // 5 seconds lifetime
    
    entity.interactWith = function(other) {
        if (other.has('MapCollisionState') && (other.MapCollisionState.leftHit || other.MapCollisionState.rightHit || other.MapCollisionState.topHit || other.MapCollisionState.bottomHit)) {
             this.addComponent(new ECS.Components.RemoveFromScene(true));
        }
    };

    return entity;
}


// uses animated sprite GunBigHat
ECS.Blueprints.createBigHatShotgun = function(x, y) {
    const entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Dimensions(16, 16));
    entity.addComponent(new ECS.Components.AnimatedSprite(Loader.spriteSheets.GunBigHat, "Idle", 8));

    return entity;
}

ECS.Blueprints.addBigHatShotgunToBoss = function(bossEntity, scene) {
    if(!bossEntity.has('BoundEntities')) {
        bossEntity.addComponent(new ECS.Components.BoundEntities());
    }
    
    const offsetX = 16; 
    const offsetY = 0;
    
    const shotgun = ECS.Blueprints.createBigHatShotgun(bossEntity.Position.x + offsetX, bossEntity.Position.y + offsetY);
    
    bossEntity.BoundEntities.entitiesWithOffsets.push({
        entity: shotgun,
        offsetX: offsetX,
        offsetY: offsetY
    });
    
    if (scene) {
        scene.addEntity(shotgun);
    } else {
        ECS.register(shotgun);
    }
}