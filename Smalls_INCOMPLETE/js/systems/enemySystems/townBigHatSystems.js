ECS.Systems.bigHatBossSystem = function(entities) {
    entities.forEach(entity => {
        if (entity.has('BigHatBossState')) {
            const state = entity.BigHatBossState;

            // Phase Logic
            let nextPhase = 1;
            if (state.health < 4) nextPhase = 2;
            if (state.health < 2) nextPhase = 3;

            if (nextPhase > state.phase) {
                state.phase = nextPhase;
                console.log("Boss entering Phase " + state.phase);

                if (state.phase === 3) {
                    // Phase 3 Init
                    let hatEntity = null;
                    
                    // Detach if bound
                    if (entity.has('BoundEntities')) {
                        const boundHatIndex = entity.BoundEntities.entitiesWithOffsets.findIndex(e => e.entity.has('BigHatHatState'));
                        if (boundHatIndex !== -1) {
                            const boundHat = entity.BoundEntities.entitiesWithOffsets[boundHatIndex];
                            hatEntity = boundHat.entity;
                            
                            // Unbind
                            entity.BoundEntities.entitiesWithOffsets.splice(boundHatIndex, 1);
                            if (entity.BoundEntities.entitiesWithOffsets.length === 0) {
                                entity.removeComponent('BoundEntities');
                            }
                        }
                    } 
                    
                    if (!hatEntity) {
                        // Already detached
                        const hats = ECS.getEntitiesWithComponents('BigHatHatState');
                        if (hats.length > 0) hatEntity = hats[0];
                    }

                    // Setup Hat for Phase 3
                    if (hatEntity && hatEntity.has('BigHatHatState')) {
                        hatEntity.AnimatedSprite.animationSpeed = 8;
                        const hatState = hatEntity.BigHatHatState;
                        hatState.state = "CENTERING";
                        hatState.cues = state.bossCues;
                        
                        // Sine params
                        if (state.bossCues && state.bossCues.top && state.bossCues.bottom) {
                            const topY = state.bossCues.top.y;
                            const bottomY = state.bossCues.bottom.y;
                            hatState.sineCenterY = (topY + bottomY) / 2;
                            hatState.sineAmplitude = (bottomY - topY) / 2;
                        } else {
                            hatState.sineCenterY = 100; 
                            hatState.sineAmplitude = 80;
                        }

                        if (state.bossCues && state.bossCues.hatTopLeft && state.bossCues.hatTopRight) {
                            hatState.sineCenterX = (state.bossCues.hatTopLeft.x + state.bossCues.hatTopRight.x) / 2;
                        } else {
                            hatState.sineCenterX = 100;
                        }
                    }

                    // Add Shotgun
                    ECS.Blueprints.addBigHatShotgunToBoss(entity, GlobalState.currentScene);
                }
            }

            if(state.phase === 2 && entity.has('BoundEntities')) {
                // Find the hat in bound entities
                const boundHatIndex = entity.BoundEntities.entitiesWithOffsets.findIndex(e => e.entity.has('BigHatHatState'));
                
                if (boundHatIndex !== -1) {
                    const boundHat = entity.BoundEntities.entitiesWithOffsets[boundHatIndex];
                    const hatEntity = boundHat.entity;
                    
                    // Unbind
                    entity.BoundEntities.entitiesWithOffsets.splice(boundHatIndex, 1);
                    if (entity.BoundEntities.entitiesWithOffsets.length === 0) {
                        entity.removeComponent('BoundEntities');
                    }

                    // Setup Hat
                    if (hatEntity.has('BigHatHatState')) {
                        hatEntity.AnimatedSprite.animationSpeed = 10;
                        const hatState = hatEntity.BigHatHatState;
                        hatState.state = "DETACHING";
                        hatState.cues = state.bossCues; // Pass cues to hat
                    }
                }
            }


            if(entity.has('Stunned')) {
                state.state = "STUNNED";
            } else {
                // If not stunned, revert to IDLE if currently stunned
                if(state.state === "STUNNED") {
                    state.state = "IDLE";
                }
            }

            // Basic state machine placeholder
            switch (state.state) {
                case "IDLE":
                    // Check if hat is detaching (Phase 2 transition)
                    const hats = ECS.getEntitiesWithComponents('BigHatHatState');
                    if (hats.length > 0 && hats[0].BigHatHatState.state === "DETACHING") {
                        if (entity.has('Velocity')) entity.Velocity.x = 0;
                        entity.AnimatedSprite.setAnimation("Idle");
                        break; 
                    }

                    // --- Strafing Logic ---
                    state.strafeTimer++;
                    
                    if (state.isStrafing) {
                        entity.AnimatedSprite.setAnimation("Run");

                        if (entity.has('Velocity')) {
                            entity.Velocity.x = state.strafeDirection * state.strafeSpeed;
                        }
                        
                        if (state.strafeTimer >= state.strafeDuration) {
                            state.isStrafing = false;
                            state.strafeTimer = 0;
                            if (entity.has('Velocity')) {
                                entity.Velocity.x = 0;
                            }
                        }
                    } else {
                        // Paused
                        if (entity.has('Velocity')) {
                            entity.Velocity.x = 0;
                        }

                        entity.AnimatedSprite.setAnimation("Idle");

                        
                        if (state.strafeTimer >= state.strafePauseDuration) {
                            state.isStrafing = true;
                            state.strafeTimer = 0;
                            state.strafeDirection *= -1; // Switch direction
                        }
                    }

                    // --- Level Jumping Logic ---
                    if (!state.isJumpWarning) {
                        state.jumpTimer++;
                        if (state.jumpTimer >= state.jumpInterval) {
                            // Pick a random level (0, 1, 2)
                            let targetLevel = Math.floor(Math.random() * 3);
                            
                            // Prevent jumping more than 1 level at a time
                            // If current is 0 (bottom), can only go to 1 (middle)
                            // If current is 2 (top), can only go to 1 (middle)
                            // If current is 1 (middle), can go to 0 or 2
                            
                            if (Math.abs(targetLevel - state.currentLevel) > 1) {
                                // If trying to jump 2 levels, force it to middle (1)
                                targetLevel = 1;
                            }

                            if (targetLevel !== state.currentLevel) {
                                state.jumpTimer = 0;
                                state.isJumpWarning = true;
                                state.targetLevel = targetLevel;
                                state.jumpWarningTimer = 0;

                                // Spawn exclamation at target level cue
                                let cueName = "";
                                if (targetLevel === 0) cueName = "bottom";
                                if (targetLevel === 1) cueName = "middle";
                                if (targetLevel === 2) cueName = "top";

                                if (state.bossCues && state.bossCues[cueName]) {
                                    const cue = state.bossCues[cueName];
                                    // Spawn exclamation
                                    const exclamation = ECS.Blueprints.createExclamation(cue.x, cue.y - 4);
                                    if (GlobalState.currentScene) {
                                        GlobalState.currentScene.addEntity(exclamation);
                                    }
                                    state.jumpExclamationEntity = exclamation;
                                }
                            }
                        }
                    } else {
                        // In warning state
                        state.jumpWarningTimer++;
                        if (state.jumpWarningTimer >= state.jumpWarningDuration) {
                            state.isJumpWarning = false;
                            
                            // Remove exclamation
                            if (state.jumpExclamationEntity) {
                                if (GlobalState.currentScene) {
                                    GlobalState.currentScene.removeEntity(state.jumpExclamationEntity.id);
                                } else {
                                    ECS.removeEntity(state.jumpExclamationEntity.id);
                                }
                                state.jumpExclamationEntity = null;
                            }

                            // Perform Jump
                            const targetLevel = state.targetLevel;
                            if (targetLevel > state.currentLevel) {
                                // Jump Up
                                if (entity.has('Velocity')) {
                                    entity.Velocity.y = -2.8;
                                }
                                state.currentLevel = targetLevel; 
                            } else if (targetLevel < state.currentLevel) {
                                // Fall Down
                                if (entity.has('Position')) {
                                    entity.Position.y += 2; // Clip through floor
                                }
                                state.currentLevel = targetLevel; 
                            }
                        }
                    }

                    // --- Shotgun Logic (Phase 3) ---
                    if (state.phase === 3) {
                        state.shotgunTimer = (state.shotgunTimer || 0) + 1;
                        if (state.shotgunTimer >= 120) {
                            state.shotgunTimer = 0;
                            
                            if (entity.has('BoundEntities')) {
                                const boundShotgun = entity.BoundEntities.entitiesWithOffsets.find(e => e.entity.AnimatedSprite && e.entity.AnimatedSprite.jsonData === Loader.spriteSheets.GunBigHat);
                                if (boundShotgun) {
                                    const shotgun = boundShotgun.entity;
                                    shotgun.AnimatedSprite.setAnimation("Shot");
                                    shotgun.AnimatedSprite.nextAnimation = "Idle";
                                    
                                    // Shoot Bullet
                                    const players = ECS.getEntitiesWithComponents('PlayerState');
                                    if (players.length > 0) {
                                        const player = players[0];
                                        const dx = player.Position.x - shotgun.Position.x;
                                        const dy = player.Position.y - shotgun.Position.y;
                                        const speed = 1.5;
                                        
                                        const baseAngle = Math.atan2(dy, dx);
                                        const angleStep = 2 * (Math.PI / 180); // 2 degrees in radians

                                        Loader.playSound("shotgunshot.wav", 0.3);

                                        for (let i = -2; i <= 2; i++) {
                                            const angle = baseAngle + (i * angleStep);
                                            const vx = Math.cos(angle) * speed;
                                            const vy = Math.sin(angle) * speed;

                                            const bullet = ECS.Blueprints.createBigHatBullet(shotgun.Position.x + (vx > 0 ? 16 : 0), shotgun.Position.y + 4, vx, vy);
                                            if (GlobalState.currentScene) {
                                                GlobalState.currentScene.addEntity(bullet);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // --- Hat Burst Logic ---
                    if (state.phase < 3) {
                        if (!state.isWarning && !state.isBursting) {
                            state.burstTimer++;
                            if (state.burstTimer >= state.burstInterval) {
                                state.isWarning = true;
                                state.warningTimer = 0;
                                
                                // Add exclamation to the left
                                const exX = entity.Position.x - 12;
                                const exY = entity.Position.y;
                                const exclamation = ECS.Blueprints.createExclamation(exX, exY);
                                
                                if (GlobalState.currentScene) {
                                    GlobalState.currentScene.addEntity(exclamation);
                                }
                                
                                // Bind it so it moves with boss
                                if(!entity.has('BoundEntities')) {
                                    entity.addComponent(new ECS.Components.BoundEntities());
                                }
                                entity.BoundEntities.entitiesWithOffsets.push({ 
                                    entity: exclamation, 
                                    offsetX: 12, 
                                    offsetY: 0 
                                });
                                
                                state.exclamationEntity = exclamation;
                            }
                        } else if (state.isWarning) {
                            state.warningTimer++;
                            if (state.warningTimer >= state.warningDuration) {
                                state.isWarning = false;
                                state.isBursting = true;
                                state.burstCurrentCount = 0;
                                state.burstDelayTimer = state.burstDelay; // Ready to fire immediately
                                
                                // Remove exclamation
                                if (state.exclamationEntity) {
                                    if (GlobalState.currentScene) {
                                        GlobalState.currentScene.removeEntity(state.exclamationEntity.id);
                                    } else {
                                        ECS.removeEntity(state.exclamationEntity.id);
                                    }
                                    // Remove from bound entities
                                    if (entity.has('BoundEntities')) {
                                        entity.BoundEntities.entitiesWithOffsets = entity.BoundEntities.entitiesWithOffsets.filter(
                                            b => b.entity.id !== state.exclamationEntity.id
                                        );
                                    }
                                    state.exclamationEntity = null;
                                }
                            }
                        } else if (state.isBursting) {
                            state.burstDelayTimer++;
                            if (state.burstDelayTimer >= state.burstDelay) {
                                state.burstDelayTimer = 0;
                                
                                // Throw Hat
                                const players = ECS.getEntitiesWithComponents('PlayerState');
                                if (players.length > 0) {
                                    const player = players[0];
                                    const dx = player.Position.x - entity.Position.x;
                                    const dy = player.Position.y - entity.Position.y;
                                    const dist = Math.sqrt(dx*dx + dy*dy);
                                    
                                    const speed = 1.5;
                                    const vx = (dx / dist) * speed;
                                    const vy = (dy / dist) * speed;
                                    
                                    const projectile = ECS.Blueprints.createBigHatSmallHatProjectile(entity.Position.x, entity.Position.y, vx, vy);
                                    if (GlobalState.currentScene) {
                                        GlobalState.currentScene.addEntity(projectile);
                                        Loader.playSound("hatthrow.wav", 0.2);
                                    }
                                }
                                
                                state.burstCurrentCount++;
                                if (state.burstCurrentCount >= state.burstCount) {
                                    state.isBursting = false;
                                    state.burstTimer = 0;
                                }
                            }
                        }
                    }
                    break;
                    
                case "ATTACK":
                    // Attack behavior
                    break;
                case "VULNERABLE":
                    // Vulnerable behavior
                    break;
                case "STUNNED":
                    // Stunned behavior
                    break;
                case "DEAD":
                    // Dead behavior
                    break;
            }
        }
    });
}

ECS.Systems.bigHatHatSystem = function(entities) {
    entities.forEach(entity => {
        if (entity.has('BigHatHatState') && entity.has('Position')) {
            const state = entity.BigHatHatState;
            const pos = entity.Position;

            switch (state.state) {
                case "ATTACHED":
                    // Do nothing, moved by boss via BoundEntities
                    break;
                case "RETURNING":
                    // if off screen, switch back to CENTERING
                    if (pos.x > WIDTH - 24) {
                        // remove DamagesPlayer component
                        console.log("Hat returned offscreen, centering.");
                        if(entity.has('DamagesPlayer')) entity.removeComponent('DamagesPlayer');
                        // remove velocity
                        if(entity.has('Velocity')) {
                            entity.Velocity.x = 0;
                            entity.Velocity.y = 0;
                        }
                        if(!entity.has('InvincibilityFrames')) {
                            entity.addComponent(new ECS.Components.InvincibilityFrames(300));
                        }
                        state.state = "CENTERING";
                    }
                    break;

                case "DETACHING":
                    // Move to Top Right Cue
                    if (state.cues && state.cues.hatTopRight) {
                        const target = state.cues.hatTopRight;
                        const dx = target.x - pos.x;
                        const dy = target.y - pos.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        
                        if (dist < 2) {
                            pos.x = target.x;
                            pos.y = target.y;
                            state.state = "MOVING_LEFT";
                        } else {
                            const speed = 0.5; // Much slower rise
                            pos.x += (dx/dist) * speed;
                            pos.y += (dy/dist) * speed;
                        }
                    }
                    break;

                case "CENTERING":
                    console.log("Hat centering...");
                    // Move to Center
                    const targetX = state.sineCenterX;
                    const targetY = state.sineCenterY;
                    const dx = targetX - pos.x;
                    const dy = targetY - pos.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);

                    // set animation to Idle
                    entity.AnimatedSprite.setAnimation("Idle");

                    if (dist < 2) {
                        pos.x = targetX;
                        pos.y = targetY;
                        state.state = "MOVING_LEFT"; // Start moving left
                        state.isSineWave = true;
                        state.sineTime = 0; // Start sine at 0 (center)
                        if(!entity.has('DamagesPlayer')) {
                            entity.addComponent(new ECS.Components.DamagesPlayer(true));
                        }

                        // remove all small hats from scene (stunned or not stunned). They should all have their map colliders removed and be given gravity so they fall off screen.
                        ECS.getEntitiesWithComponents('BigHatSmallHatProjectile').forEach(smallHat => {
                            if(smallHat.has('CollidesWithMap')) smallHat.removeComponent('CollidesWithMap');
                            if(smallHat.has('MapCollisionState')) smallHat.removeComponent('MapCollisionState');
                            
                            // Stop system from freezing velocity if stunned
                            if(smallHat.has('BigHatSmallHatProjectile')) smallHat.removeComponent('BigHatSmallHatProjectile');
                            if(smallHat.has('DamagesPlayer')) smallHat.removeComponent('DamagesPlayer');

                            if (!smallHat.has('Gravity')) {
                                smallHat.addComponent(new ECS.Components.Gravity(0.2));
                            } else {
                                smallHat.Gravity.gravity = 0.2;
                            }
                            if(smallHat.has('Velocity')) {
                                smallHat.Velocity.x = 0;
                                smallHat.Velocity.y = -1.5;
                            }
                        });  
                        shakeScreen(5);                      
                        if(entity.has('InvincibilityFrames')) {
                            entity.removeComponent('InvincibilityFrames');
                        }
                    } else {
                        const speed = 0.5; // Slow move to center
                        pos.x += (dx/dist) * speed;
                        pos.y += (dy/dist) * speed;
                    }
                    break;

                case "MOVING_LEFT":
                    if(entity.has('InvincibilityFrames')) entity.removeComponent('InvincibilityFrames');
                    // Move to Top Left Cue
                    if (state.cues && state.cues.hatTopLeft) {
                        const target = state.cues.hatTopLeft;
                        const dx = target.x - pos.x;
                        
                        // Check if reached left side (X only)
                        if (Math.abs(dx) < 2) {
                            pos.x = target.x;
                            state.state = "MOVING_RIGHT"; // Loop back
                        } else {
                            if (state.isSineWave) {
                                // Sine Wave Movement
                                const speed = state.sineSpeed;
                                pos.x -= speed; // Move left
                                
                                state.sineTime += state.sineFrequency;
                                pos.y = state.sineCenterY + Math.sin(state.sineTime) * state.sineAmplitude;
                            } else {
                                // Linear Movement
                                const dy = target.y - pos.y;
                                const dist = Math.sqrt(dx*dx + dy*dy);
                                const speed = (state.moveSpeed || 1) * 0.5; // Half speed
                                pos.x += (dx/dist) * speed;
                                pos.y += (dy/dist) * speed;
                            }
                        }

                        if(!state.isSineWave) {
                            entity.AnimatedSprite.setAnimation("Shooting");
                            entity.AnimatedSprite.direction = -1;

                            // Shoot
                            state.shootTimer++;
                            if (state.shootTimer >= state.shootInterval) {
                                state.shootTimer = 0;
                                // Shoot 45 degrees down-left
                                // vx = -1, vy = 1 (normalized direction)
                                const bulletSpeed = 2;
                                const vx = -0.707 * bulletSpeed;
                                const vy = 0.707 * bulletSpeed;

                                Loader.playSound("HatGunshot.wav", 0.3);
                                
                                const bullet = ECS.Blueprints.createBigHatBullet(pos.x + 3, pos.y + 12, vx, vy);
                                const bullet2 = ECS.Blueprints.createBigHatBullet(pos.x + 9, pos.y + 12, vx, vy);
                                if (GlobalState.currentScene) {
                                    GlobalState.currentScene.addEntity(bullet);
                                    GlobalState.currentScene.addEntity(bullet2);
                                }
                            }
                        }
                    }
                    break;

                case "MOVING_RIGHT":
                    if(entity.has('InvincibilityFrames')) entity.removeComponent('InvincibilityFrames');
                    // Move back to Top Right
                    if (state.cues && state.cues.hatTopRight) {
                        const target = state.cues.hatTopRight;
                        const dx = target.x - pos.x;
                        
                        // Check if reached right side (X only)
                        if (Math.abs(dx) < 2) {
                            pos.x = target.x;
                            state.state = "MOVING_LEFT"; // Loop
                        } else {
                            if (state.isSineWave) {
                                // Sine Wave Movement
                                const speed = state.sineSpeed;
                                pos.x += speed; // Move right
                                
                                state.sineTime += state.sineFrequency;
                                pos.y = state.sineCenterY + Math.sin(state.sineTime) * state.sineAmplitude;
                            } else {
                                // Linear Movement
                                const dy = target.y - pos.y;
                                const dist = Math.sqrt(dx*dx + dy*dy);
                                const speed = (state.returnSpeed || 0.5) * 0.5; // Half speed
                                pos.x += (dx/dist) * speed;
                                pos.y += (dy/dist) * speed;
                            }
                        }

                        // set animation to idle when moving right
                        entity.AnimatedSprite.setAnimation("Moving");
                    }
                    break;
            }
        }
    });
}

ECS.Systems.bigHatProjectileSystem = function(entities) {
    entities.forEach(entity => {
        if (entity.has('BigHatSmallHatProjectile')) {
            // If stunned, ensure velocity is 0 (redundant safety)
            if (entity.has('BigHatStunned')) {
                entity.Velocity.x = 0;
                entity.Velocity.y = 0;
            }
        }
    });
}