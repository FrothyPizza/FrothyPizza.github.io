ECS.Systems.DesertEnemySystem = function(entities) {
    ECS.getEntitiesWithComponents('DesertKnifeOutlaw').forEach(entity => {
        if (entity.has('Stunned')) return;

        const speed = entity.DesertKnifeOutlaw.runSpeed;
        const players = ECS.getEntitiesWithComponents('PlayerState');
        if (players.length > 0) {
            const player = players[0];
            const diff = player.Position.x - entity.Position.x;


            let totalDistToPlayer = Math.sqrt(Math.pow(player.Position.x - entity.Position.x, 2) + Math.pow(player.Position.y - entity.Position.y, 2));

            // Add a deadzone to prevent jittering when overlapping/close
            if (Math.abs(totalDistToPlayer) > 48) {
                const dir = Math.sign(diff);
                entity.Velocity.x = dir * speed;
                entity.AnimatedSprite.direction = dir;
            } else {
                // entity.Velocity.x = 0;
            }

            // if player is not on ground, return
            if (!player.has('MapCollisionState') || !player.MapCollisionState.bottomHit) {
                return;
            }
            // Jump up logic
            const knife = entity.DesertKnifeOutlaw;
            const yDiff = player.Position.y - entity.Position.y;
            if ((yDiff) < -24 && totalDistToPlayer < 40) {
                knife.framesPlayerAbove++;
                if (knife.framesPlayerAbove >= knife.jumpDelayFrames) {
                    if(entity.has('MapCollisionState') && entity.MapCollisionState.bottomHit) {
                        entity.Velocity.y = -2.6;
                        knife.framesPlayerAbove = 0;
                    }
                }
            } else {
                knife.framesPlayerAbove = 0;
            }
        }
    });

    ECS.getEntitiesWithComponents('DesertGunOutlaw').forEach(entity => {
        if (entity.has('Stunned')) return;

        const gunner = entity.DesertGunOutlaw;
        
        // Movement Logic
        let forwardDir = 1;
        if (entity.has('SpawnSide')) {
            forwardDir = entity.SpawnSide.side === 'left' ? 1 : -1;
        }
        const speed = 0.5;

        if (gunner.state === 'entering') {
            entity.Velocity.x = forwardDir * speed;
            gunner.timer--;
            if (gunner.timer <= 0) {
                gunner.state = 'strafing_back';
                gunner.timer = gunner.strafeTime;
            }
        } else if (gunner.state === 'strafing_back') {
            entity.Velocity.x = -forwardDir * speed;
            gunner.timer--;
            if (gunner.timer <= 0) {
                gunner.state = 'strafing_forward';
                gunner.timer = gunner.strafeTime;
            }
        } else if (gunner.state === 'strafing_forward') {
            entity.Velocity.x = forwardDir * speed;
            gunner.timer--;
            if (gunner.timer <= 0) {
                gunner.state = 'strafing_back';
                gunner.timer = gunner.strafeTime;
            }
        }
        
        const players = ECS.getEntitiesWithComponents('PlayerState');
        if (players.length > 0) {
            const player = players[0];
            entity.AnimatedSprite.flipX = player.Position.x < entity.Position.x;
        }

        // Shoot logic
        if (gunner.shootTimer > 0) {
            gunner.shootTimer--;
        } else {
            gunner.shootTimer = gunner.shootInterval;
            
            const dir = entity.AnimatedSprite.flipX ? -1 : 1;
            const bullet = ECS.Blueprints.createDesertBullet(entity.Position.x, entity.Position.y + 4, dir, 2);
            GlobalState.currentScene.addEntity(bullet);
            Loader.playSound("powerup.wav", 0.5);
            // Play sound here
        }

        // Jump logic
        if (gunner.jumpTimer > 0) {
            gunner.jumpTimer--;
        } else {
            gunner.jumpTimer = gunner.jumpInterval + (Math.random() * 120); // Add randomness

            let canJumpUp = false;
            let canJumpDown = false;
            const side = entity.SpawnSide ? entity.SpawnSide.side : 'left'; // 'left' or 'right'

            if (side === 'left') {
                // Left side: Middle <-> Bottom
                if (gunner.currentLevel === 'Middle') {
                    canJumpDown = true;
                } else if (gunner.currentLevel === 'Bottom') {
                    canJumpUp = true;
                }
            } else {
                // Right side: Top <-> Middle <-> Bottom
                if (gunner.currentLevel === 'Top') {
                    canJumpDown = true;
                } else if (gunner.currentLevel === 'Middle') {
                    canJumpUp = true;
                    canJumpDown = true;
                } else if (gunner.currentLevel === 'Bottom') {
                    canJumpUp = true;
                }
            }

            let jumpAction = 'none';
            if (canJumpUp && canJumpDown) {
                jumpAction = Math.random() > 0.5 ? 'up' : 'down';
            } else if (canJumpUp) {
                jumpAction = 'up';
            } else if (canJumpDown) {
                jumpAction = 'down';
            }

            if (jumpAction === 'up') {
                // Jump Up
                if (entity.has('MapCollisionState') && entity.MapCollisionState.bottomHit) {
                    entity.Velocity.y = -2.4;
                    // Update level
                    if (gunner.currentLevel === 'Bottom') gunner.currentLevel = 'Middle';
                    else if (gunner.currentLevel === 'Middle') gunner.currentLevel = 'Top';
                }
            } else if (jumpAction === 'down') {
                // Jump Down
                entity.Position.y += 2;
                // Update level
                if (gunner.currentLevel === 'Top') gunner.currentLevel = 'Middle';
                else if (gunner.currentLevel === 'Middle') gunner.currentLevel = 'Bottom';
            }
        }
    });
}
