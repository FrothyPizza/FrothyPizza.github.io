
// Render system - draws entities with sprites and debug visualizations

ECS.Systems.renderSystem = function(entities, context) {
    Object.values(entities).forEach(entity => {
        // Only render entities with Position
        if (!entity.has('Position')) return;

        const position = entity.Position;

        // Draw AnimatedSprite if present
        if (entity.has('AnimatedSprite')) {
            if(entity.AnimatedSprite.hidden) return;
            const sprite = entity.AnimatedSprite;
            const x = Math.round(position.x);
            const y = Math.round(position.y);

            // Handle player invincibility flashing
            if (entity.has('PlayerInvincibility') && entity.PlayerInvincibility.isInvincible) {
                if (APP_ELAPSED_FRAMES % 20 >= 10) {
                    return; // Skip rendering this frame for flashing effect
                }
            }

            if (entity.has('InvincibilityFrames') && entity.InvincibilityFrames.duration > 0) {
                if (APP_ELAPSED_FRAMES % 20 >= 10) {
                    return; // Skip rendering this frame for flashing effect
                }
            }

            // Handle player death tint
            if (entity.has('Dead') && entity.Dead.dead) {
                sprite.tint = "rgba(255, 0, 0, 0.5)";
            } else {
                // sprite.tint = null;
            }

            // Cull off-screen
            if (x + sprite.width < context.view.x || x > context.view.x + context.canvas.width ||
                y + sprite.height < context.view.y || y > context.view.y + context.canvas.height) {
                return;
            }

            let frame = sprite.jsonData.frames[sprite.currentFrame];
            let sourceCanvas = sprite.image;
            let sourceX = frame.frame.x;
            let sourceY = frame.frame.y;
            let sourceW = frame.frame.w;
            let sourceH = frame.frame.h;

            // Only use offscreen canvas if tint is applied
            if (sprite.tint) {
                sprite.offscreenContext.clearRect(0, 0, sprite.width, sprite.height);
                sprite.offscreenContext.drawImage(
                    sprite.image,
                    frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h,
                    0, 0, frame.frame.w, frame.frame.h
                );
                
                sprite.offscreenContext.fillStyle = sprite.tint;
                sprite.offscreenContext.globalCompositeOperation = 'source-atop';
                sprite.offscreenContext.fillRect(0, 0, frame.frame.w, frame.frame.h);
                sprite.offscreenContext.globalCompositeOperation = 'source-over';

                sourceCanvas = sprite.offscreenCanvas;
                sourceX = 0;
                sourceY = 0;
                sourceW = frame.frame.w;
                sourceH = frame.frame.h;
            }

            // Compute effective scale for horizontal flipping
            let scaleX = sprite.isBackwards ? -1 : 1;
            scaleX *= sprite.direction;

            // Apply rotation and flip
            context.save();
            const cx = x - context.view.x + sprite.width / 2;
            const cy = y - context.view.y + sprite.height / 2;
            context.translate(cx, cy);
            context.rotate(sprite.rotation * Math.PI / 180);
            context.scale(scaleX, 1);
            context.drawImage(
                sourceCanvas,
                sourceX, sourceY, sourceW, sourceH,
                -sprite.width / 2,
                -sprite.height / 2,
                sprite.width, sprite.height
            );
            context.restore();
        }
        // Draw static Sprite if present (and no AnimatedSprite)
        else if (entity.has('Sprite')) {
            const sprite = entity.Sprite;
            const x = Math.round(position.x);
            const y = Math.round(position.y);

            if (sprite.tint) {
                context.fillStyle = sprite.tint;
                context.globalCompositeOperation = 'source-atop';
                context.fillRect(x - context.view.x, y - context.view.y, sprite.width, sprite.height);
                context.globalCompositeOperation = 'source-over';
            }
            context.drawImage(sprite.image, x - context.view.x, y - context.view.y);
        }

        // Draw debug visualizations if CONSTANTS.DEBUG is true
        if (typeof CONSTANTS !== 'undefined' && CONSTANTS.DEBUG) {
            if (entity.has('Dimensions')) {
                const dimensions = entity.Dimensions;
                const x = Math.round(position.x);
                const y = Math.round(position.y);

                // Draw transparent white on the entire bounding box
                context.fillStyle = "rgba(255, 255, 255, 0.5)";
                context.fillRect(x - context.view.x, y - context.view.y, dimensions.width, dimensions.height);

                // Draw hitboxes (green)
                if (entity.has('Hitbox') && CONSTANTS.DRAW_HITBOXES) {
                    context.fillStyle = "rgba(0, 255, 0, 0.5)";
                    for (let hitbox of entity.Hitbox.boxes) {
                        context.fillRect(
                            x + hitbox.x - context.view.x, 
                            y + hitbox.y - context.view.y, 
                            hitbox.w, 
                            hitbox.h
                        );
                    }
                }

                // Draw hurtboxes (blue)
                if (entity.has('Hurtbox') && CONSTANTS.DRAW_HURTBOXES) {
                    context.fillStyle = "rgba(0, 0, 255, 0.5)";
                    for (let hurtbox of entity.Hurtbox.boxes) {
                        context.fillRect(
                            x + hurtbox.x - context.view.x, 
                            y + hurtbox.y - context.view.y, 
                            hurtbox.w, 
                            hurtbox.h
                        );
                    }
                }
            }
        }

        // Draw Score Texts
        if (entity.has('ScoreText')) {
            const score = entity.ScoreText;
            const pos = entity.Position;
            
            // Calculate alpha based on timer
            // Fade out in last 20 frames
            let alpha = 1;
            if (score.timer > score.duration - 20) {
                alpha = 1 - (score.timer - (score.duration - 20)) / 20;
            }
            
            context.save();
            context.globalAlpha = alpha;
            
            if (GlobalState.currentScene && typeof GlobalState.currentScene.drawBitmapText === 'function') {
                GlobalState.currentScene.drawBitmapText(context, score.text, Math.round(pos.x - context.view.x), Math.round(pos.y - context.view.y), 'center', score.color);
            } else {
                context.fillStyle = score.color;
                context.font = "8px monospace";
                context.fillText(score.text, pos.x - context.view.x, pos.y - context.view.y);
            }
            
            context.restore();
        }
    });
}

ECS.Systems.scoreTextSystem = function(entities) {
    Object.values(entities).forEach(entity => {
        if (!entity.has('ScoreText', 'Position')) return;
        
        const score = entity.ScoreText;
        const pos = entity.Position;
        
        score.timer++;
        
        // Float up
        pos.y -= score.floatSpeed;
        
        if (score.timer >= score.duration) {
            entity.addComponent(new ECS.Components.RemoveFromScene(true));
        }
    });
}
