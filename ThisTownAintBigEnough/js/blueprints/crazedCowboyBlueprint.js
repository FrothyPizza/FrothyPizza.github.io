ECS.Blueprints.CrazedCowboy = function(x, y, initialState = "IDLE") {
    let entity = new ECS.Entity();
    entity.addComponent(new ECS.Components.Position(x, y));
    entity.addComponent(new ECS.Components.Velocity(0, 0));
    entity.addComponent(new ECS.Components.Gravity());
    entity.addComponent(new ECS.Components.Dimensions(16, 16)); // Placeholder dimensions
    entity.addComponent(new ECS.Components.Hitbox([{x: 0, y: 0, w: 16, h: 16}]));
    entity.addComponent(new ECS.Components.Hurtbox([{x: 2, y: 2, w: 12, h: 12}]));
    entity.addComponent(new ECS.Components.BossState());
    entity.addComponent(new ECS.Components.BossHealth(CONSTANTS.SPEEDY_MODE ? 0 : 5));
    entity.addComponent(new ECS.Components.CrazedCowboy({
        phase: 1,
        health: 15,
        maxHealth: 15,
        state: initialState
    }));
    entity.addComponent(new ECS.Components.IsEnemy(true));
    entity.addComponent(new ECS.Components.CollidesWithMap(true));
    entity.addComponent(new ECS.Components.MapCollisionState());
    entity.addComponent(new ECS.Components.AnimatedSprite(
        Loader.spriteSheets.MadSheriff, 
        "Idle", 
        12
    ));

    entity.blueprint = 'CrazedCowboy';
    entity.interactWith = ECS.Blueprints.CrazedCowboyInteract;
    
    return entity;
}

ECS.Blueprints.CrazedCowboyInteract = function(other) {
    if (other.has('Bullet')) return;
    if(other.has('DamagesEnemy')) {
        // Destroy the projectile so it doesn't hit multiple times
        if (other.has('SaloonBottle')) {
            // ECS.removeEntity(other.id);
            GlobalState.currentScene.removeEntity(other.id);
        }

        if(!this.has('Stunned')) {
            // Take damage
            if(this.has('BossHealth')) {
                this.BossHealth.value -= 1;
                console.log("Boss Health:", this.BossHealth.value);
            }

            // score points for player
            if (GlobalState.currentScene && GlobalState.currentScene.player && GlobalState.currentScene.player.has('PlayerState')) {
                ECS.Helpers.scorePoints(150, this.Position.x + 8, this.Position.y - 10, 'yellow', 30);
            }

            shakeScreen(5);

            if(this.BossHealth.value > 0) {
                const isToLeft = Math.sign(other.Position.x - this.Position.x) || 1;
                this.addComponent(new ECS.Components.Stunned({x: 0.2 * -isToLeft, y: -1.5}, 20, 120, false));
            } else {
                this.addComponent(new ECS.Components.Stunned({x: 1.5, y: -2}, 44, 100000, false));
                setFrameTimeout(() => {
                    // remove invincibility frames after 120 frames
                    if(this.has('InvincibilityFrames')) {
                        this.removeComponent('InvincibilityFrames');
                    }

                    this.BossState.state = "DEFEATED";

                    // remove hitbox and hurtbox to prevent further interactions
                    if(this.has('Hitbox')) {
                        this.removeComponent('Hitbox');
                    }
                    if(this.has('Hurtbox')) {
                        this.removeComponent('Hurtbox');
                    }

                    // spawn items
                    const scene = GlobalState.currentScene;
                    if(scene) {
                        const gun = ECS.Blueprints.createFloatingItemToCollect(this.Position.x + 8, this.Position.y, 'Gun', -1);
                        scene.addEntity(gun);
                        const lasso = ECS.Blueprints.createFloatingItemToCollect(this.Position.x + 8, this.Position.y, 'Lasso', 1);
                        scene.addEntity(lasso);
                    }

                }, 120);
            }
            
            if (this.has('CrazedCowboy')) {
                this.CrazedCowboy.state = "IDLE";
                this.CrazedCowboy.strafeTimer = 0;
                this.CrazedCowboy.attackTimer = 0;
            }
            if (this.has('BossState')) {
                this.BossState.timer = 0;
            }
        }
    }
}
