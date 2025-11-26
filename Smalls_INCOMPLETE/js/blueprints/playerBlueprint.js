// Player blueprint - creates a player entity with all necessary components

ECS.Blueprints.createPlayer = function(x, y) {
    const player = new ECS.Entity();

    // Core components
    player.addComponent(new ECS.Components.Position(x, y));
    player.addComponent(new ECS.Components.Velocity(0, 0));
    player.addComponent(new ECS.Components.Gravity(0.12));
    player.addComponent(new ECS.Components.Dimensions(8, 8));

    // Collision components
    player.addComponent(new ECS.Components.CollidesWithMap(true));
    player.addComponent(new ECS.Components.MapCollisionState());
    player.addComponent(new ECS.Components.Hitbox([{x: 1, y: 0, w: 6, h: 8}]));
    player.addComponent(new ECS.Components.Hurtbox([{x: 0, y: 0, w: 8, h: 8}]));

    // Sprite
    const sprite = new ECS.Components.AnimatedSprite(
        Loader.spriteSheets.Smalls, 
        "Run", 
        6
    );
    player.addComponent(sprite);
    player.addComponent(new ECS.Components.ViewLock(true));

    // Player-specific components
    player.addComponent(new ECS.Components.PlayerState());
    // Initialize score from GlobalState if available
    if (typeof GlobalState !== 'undefined' && GlobalState.score !== undefined) {
        player.PlayerState.score = GlobalState.score;
    }
    player.addComponent(new ECS.Components.PlayerMovement());
    player.addComponent(new ECS.Components.PlayerJump());
    player.addComponent(new ECS.Components.PlayerDash());
    player.addComponent(new ECS.Components.PlayerLives(CONSTANTS.playerMaxLives));
    player.addComponent(new ECS.Components.PlayerInvincibility());
    player.addComponent(new ECS.Components.PlayerSpawn(x, y));
    player.addComponent(new ECS.Components.PlayerFlying());
    player.addComponent(new ECS.Components.PlayerSpikeDamage());
    player.addComponent(new ECS.Components.PlayerEnemyCollision());

    // Game state
    player.addComponent(new ECS.Components.Dead(false));

    player.blueprint = 'Player';
    player.interactWith = ECS.Blueprints.PlayerInteract;

    return player;
}

ECS.Blueprints.PlayerInteract = function(other) {
    if(other.has('DamagesPlayer')) {
        if (this.has('PlayerInvincibility') && this.PlayerInvincibility.isInvincible) return;
        if (this.has('InvincibilityFrames') && this.InvincibilityFrames.duration > 0) return;
        if (other.has('Stunned')) return;

        // Play sound here

        if (this.has('Dead')) {
            freezeFrame(30);
            setFrameTimeout(() => {
                shakeScreen(5);

            }, 30);

            // remove a bunch of components to "disable" the player
            this.removeComponent('PlayerMovement');
            this.removeComponent('PlayerJump');
            this.removeComponent('PlayerDash');
            this.removeComponent('PlayerFlying');
            this.removeComponent('PlayerEnemyCollision');
            this.removeComponent('Hurtbox');
            this.removeComponent('Hitbox');
            this.removeComponent('CollidesWithMap');
            this.removeComponent('MapCollisionState');
            // this.removeComponent('PlayerState');
            this.removeComponent('PlayerSpawn');
            // this.removeComponent('Dimensions');
            this.AnimatedSprite.setAnimation("Fall");
            
            this.Velocity.x = 0;
            this.Velocity.y = -3;

            this.Gravity.gravity = {x: 0, y: 0.06};

            setFrameTimeout(() => {
                
                this.Dead.dead = true;
            }, 180);

        }
    }


    if(other.has('SaloonItemCollectible')) {
        const itemType = other.SaloonItemCollectible.type;
        // Handle item collection logic
        console.log(`Collected item: ${itemType}`);
        // For example, add to inventory or increase stats

        if(itemType === 'Gun') {
            this.PlayerState.hasCollectedGun = true;
            ECS.Helpers.addWeaponToPlayer(this, 'Gun');

        }
        if(itemType === 'Lasso') {
            this.PlayerState.hasCollectedLasso = true;
            ECS.Helpers.addWeaponToPlayer(this, 'Lasso');

        }

        // Remove the collectible from the game world
        GlobalState.currentScene.removeEntity(other.id);
    }
}

ECS.Blueprints.WeaponInteract = function(other) {
    if (this.has('AnimatedSprite') && this.AnimatedSprite.hidden) return;

    if (other.has('IsEnemy') && other.has('Stunned')) {
        if (other.has('CrazedCowboy')) return;

        // Double check that the entity is actually stunned (has the component in its list)
        // This is redundant if 'has' works correctly, but good for safety
        if (other.Stunned) {
            other.addComponent(new ECS.Components.RemoveFromScene(true));
            Loader.playSound("damage.wav", 0.5);

            ECS.Helpers.scorePoints(100, other.Position.x, other.Position.y - 10, 'yellow', 30);
        }
    }
}

ECS.Blueprints.BulletInteract = function(other) {
    if (other.has('IsEnemy')) {
        if (other.has('CrazedCowboy')) return;
        if (other.has('BigHatSmallHatProjectile')) return; // Handled by projectile's own interact logic
        if (other.has('BigHatBossState')) return; // Handled by boss's own interact logic
        if (other.has('BigHatHatState')) return; // Handled by hat's own interact logic

        if (!other.has('Stunned')) {
            const dir = Math.sign(this.Velocity.x) || 1;
            let duration = 180;
            if (this.has('CausesStun')) {
                duration = this.CausesStun.duration;
            }
            other.addComponent(new ECS.Components.Stunned({x: 0.33 * dir, y: -1.5}, 20, duration, false));
        }
        this.addComponent(new ECS.Components.RemoveFromScene(true));
    } else if (other.has('MapCollisionState') && (other.MapCollisionState.leftHit || other.MapCollisionState.rightHit || other.MapCollisionState.topHit || other.MapCollisionState.bottomHit)) {
         this.addComponent(new ECS.Components.RemoveFromScene(true));
    }
}


ECS.Blueprints.Weapon = function(x, y, weaponType) {
    let entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Dimensions(8, 8));
    if(weaponType === 'Gun') {
        entity.addComponent(new ECS.Components.Dimensions(8, 8));
        entity.addComponent(new ECS.Components.Weapon('Gun', 30));
    } else if(weaponType === 'Lasso') {
        entity.addComponent(new ECS.Components.Dimensions(16, 8));
        entity.addComponent(new ECS.Components.Weapon('Lasso', 45));
        entity.addComponent(new ECS.Components.Hitbox([{x: 0, y: 0, w: 16, h: 8}]));
        // entity.addComponent(new ECS.Components.Hurtbox([{x: 0, y: 0, w: 16, h: 8}]));
        entity.interactWith = ECS.Blueprints.WeaponInteract;
    }

    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.AnimatedSprite(
        Loader.spriteSheets[weaponType], 
        "Idle", 
        6
    ));
    entity.blueprint = 'Weapon';
    return entity;
}

ECS.Helpers.addWeaponToPlayer = function(playerEntity, weaponType) {
    if(!playerEntity.has('BoundEntities')) {
        playerEntity.addComponent(new ECS.Components.BoundEntities());
    }

    const boundEntities = playerEntity.BoundEntities;
    const offsetX = 8
    const offsetY = -2;
    const weapon = ECS.Blueprints.Weapon(playerEntity.Position.x + offsetX, playerEntity.Position.y + offsetY, weaponType);
    boundEntities.entitiesWithOffsets.push({ entity: weapon, offsetX: offsetX, offsetY: offsetY });
    weapon.AnimatedSprite.hidden = true;
    GlobalState.currentScene.addEntity(weapon);


    return weapon;
}


ECS.Blueprints.createBullet = function(x, y, direction, speed) {
    let entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Velocity(speed * direction, 0));
    entity.addComponent(new ECS.Components.Dimensions(4, 3));
    entity.addComponent(new ECS.Components.DamagesEnemy(true));
    entity.addComponent(new ECS.Components.CausesStun(180));
    // add hitbox and hurtbox
    entity.addComponent(new ECS.Components.Hitbox([{x: 0, y: 0, w: 4, h: 3}]));
    entity.addComponent(new ECS.Components.Hurtbox([{x: 0, y: 0, w: 4, h: 3}]));
    // entity.addComponent(new ECS.Components.MapCollisionState());
    // entity.addComponent(new ECS.Components.CollidesWithMap(true));
    entity.addComponent(new ECS.Components.Bullet());
    entity.addComponent(new ECS.Components.AnimatedSprite(
        Loader.spriteSheets.BulletSmall,
        "Idle",
        12
    ));
    entity.interactWith = ECS.Blueprints.BulletInteract;
    entity.blueprint = 'Bullet';
    return entity;
}