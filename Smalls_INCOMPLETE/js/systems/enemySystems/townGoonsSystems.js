ECS.Systems.TownGoonEnemySystem = function(entities) {
    ECS.getEntitiesWithComponents('TownGoonsKnifeOutlaw').forEach(entity => {
        if (entity.has('Stunned')) return;

        const speed = entity.TownGoonsKnifeOutlaw.runSpeed;
        const players = ECS.getEntitiesWithComponents('PlayerState');
        if (players.length > 0) {
            const player = players[0];
            const diff = player.Position.x - entity.Position.x;


            let totalDistToPlayer = Math.sqrt(Math.pow(player.Position.x - entity.Position.x, 2) + Math.pow(player.Position.y - entity.Position.y, 2));

            // Add a deadzone to prevent jittering when overlapping/close
            if (Math.abs(totalDistToPlayer) > 48) {
                const dir = Math.sign(diff);
                entity.Velocity.x = dir * speed;
                // entity.AnimatedSprite.flipX = dir < 0;
            } else {
                // entity.Velocity.x = 0;
            }

            // if player is not on ground, return
            if (!player.has('MapCollisionState') || !player.MapCollisionState.bottomHit) {
                return;
            }
            // Jump up logic
            // const knife = entity.TownGoonsKnifeOutlaw;
            // const yDiff = player.Position.y - entity.Position.y;
            // if ((yDiff) < -24 && totalDistToPlayer < 40) {
            //     knife.framesPlayerAbove++;
            //     if (knife.framesPlayerAbove >= knife.jumpDelayFrames) {
            //         if(entity.has('MapCollisionState') && entity.MapCollisionState.bottomHit) {
            //             entity.Velocity.y = -2.6;
            //             knife.framesPlayerAbove = 0;
            //         }
            //     }
            // } else {
            //     knife.framesPlayerAbove = 0;
            // }
        }
    });

    ECS.getEntitiesWithComponents('TownGoonsCannonOutlaw').forEach(entity => {
        if (entity.has('Stunned')) return;

        const cannoneer = entity.TownGoonsCannonOutlaw;
        
        if (cannoneer.state === 'waiting') return;

        // Movement Logic
        let forwardDir = 1;
        if (entity.has('SpawnSide')) {
            forwardDir = entity.SpawnSide.side === 'left' ? 1 : -1;
        }
        const speed = 0.33333333;

        if (cannoneer.state === 'entering') {
            // entity.Velocity.x = forwardDir * speed;
            cannoneer.timer--;
            if (cannoneer.timer <= 0) {
                cannoneer.state = 'strafing_back';
                cannoneer.timer = cannoneer.strafeTime;
            }
        } else if (cannoneer.state === 'strafing_back') {
            entity.Velocity.x = -forwardDir * speed;
            cannoneer.timer--;
            if (cannoneer.timer <= 0) {
                cannoneer.state = 'strafing_forward';
                cannoneer.timer = cannoneer.strafeTime;
            }
        } else if (cannoneer.state === 'strafing_forward') {
            entity.Velocity.x = forwardDir * speed;
            cannoneer.timer--;
            if (cannoneer.timer <= 0) {
                cannoneer.state = 'strafing_back';
                cannoneer.timer = cannoneer.strafeTime;
            }
        }
        
        // Sprite Direction Logic
        if (entity.has('SpawnSide')) {
            const isLeft = entity.SpawnSide.side === 'left';
            // Left side -> flipX = 1 (True). Right side -> flipX = 0 (False).
            // entity.AnimatedSprite.flipX = isLeft; 
            entity.AnimatedSprite.direction = isLeft ? 1 : -1;
        }

        // Shoot logic
        // Want to make it an Arc, will look at the bottle throw code
        if (cannoneer.shootTimer > 0) {
            cannoneer.shootTimer--;
        } else {
            cannoneer.shootTimer = cannoneer.shootInterval;
            
            let shootDir = 1;
            if (entity.has('SpawnSide') && entity.SpawnSide.side === 'right') {
                shootDir = -1;
            }

            const speed = 1.5;
            const angle = 45 * (Math.PI / 180); // 45 degrees
            const vx = speed * Math.cos(angle) * shootDir;
            const vy = -speed * Math.sin(angle);

            let offsetX = entity.AnimatedSprite.direction === 1 ? 14 : -6;

            const bullet = ECS.Blueprints.createTownGoonsCannonBullet(entity.Position.x + offsetX, entity.Position.y + 4, shootDir, speed);
            bullet.Velocity.x = vx;
            bullet.Velocity.y = vy;
            // bullet.addComponent(new ECS.Components.Gravity(0.08));

            GlobalState.currentScene.addEntity(bullet);
            Loader.playSound("shotgunshot.wav", 0.5);

            // get bound entities (the cannon) and play its shoot animation
            if (entity.has('BoundEntities')) {
                entity.BoundEntities.entitiesWithOffsets.forEach(boundObj => {
                    const boundEntity = boundObj.entity;
                    if (boundEntity.has('AnimatedSprite')) {
                        boundEntity.AnimatedSprite.setAnimation('Shoot');
                        boundEntity.AnimatedSprite.onAnimationComplete = () => {
                            boundEntity.AnimatedSprite.setAnimation('Idle');
                            boundEntity.AnimatedSprite.onAnimationComplete = null;
                        };
                    }
                });
            }
            // Play sound here
        }

        // No jumping for the cannoneer.

        // Backwards-compatible alias: some scenes expect the pluralized name
        ECS.Systems.TownGoonsEnemySystem = ECS.Systems.TownGoonEnemySystem;
        // // Jump logic
        // if (cannoneer.jumpTimer > 0) {
        //     cannoneer.jumpTimer--;
        // } else {
        //     cannoneer.jumpTimer = cannoneer.jumpInterval + (Math.random() * 120); // Add randomness

        //     let canJumpUp = false;
        //     let canJumpDown = false;
        //     const side = entity.SpawnSide ? entity.SpawnSide.side : 'left'; // 'left' or 'right'

        //     if (side === 'left') {
        //         // Left side: Middle <-> Bottom
        //         if (cannoneer.currentLevel === 'Middle') {
        //             canJumpDown = true;
        //         } else if (cannoneer.currentLevel === 'Bottom') {
        //             canJumpUp = true;
        //         }
        //     } else {
        //         // Right side: Top <-> Middle <-> Bottom
        //         if (cannoneer.currentLevel === 'Top') {
        //             canJumpDown = true;
        //         } else if (cannoneer.currentLevel === 'Middle') {
        //             canJumpUp = true;
        //             canJumpDown = true;
        //         } else if (cannoneer.currentLevel === 'Bottom') {
        //             canJumpUp = true;
        //         }
        //     }

        //     let jumpAction = 'none';
        //     if (canJumpUp && canJumpDown) {
        //         jumpAction = Math.random() > 0.5 ? 'up' : 'down';
        //     } else if (canJumpUp) {
        //         jumpAction = 'up';
        //     } else if (canJumpDown) {
        //         jumpAction = 'down';
        //     }

        //     if (jumpAction === 'up') {
        //         // Jump Up
        //         if (entity.has('MapCollisionState') && entity.MapCollisionState.bottomHit) {
        //             entity.Velocity.y = -2.4;
        //             // Update level
        //             if (cannoneer.currentLevel === 'Bottom') cannoneer.currentLevel = 'Middle';
        //             else if (cannoneer.currentLevel === 'Middle') cannoneer.currentLevel = 'Top';
        //         }
        //     } else if (jumpAction === 'down') {
        //         // Jump Down
        //         entity.Position.y += 2;
        //         // Update level
        //         if (cannoneer.currentLevel === 'Top') cannoneer.currentLevel = 'Middle';
        //         else if (cannoneer.currentLevel === 'Middle') cannoneer.currentLevel = 'Bottom';
        //     }
        //}
    });
}
