
// Animation system - updates animated sprite frames

ECS.Systems.animationSystem = function(entities) {
    Object.values(entities).forEach(entity => {
        // Only process entities with AnimatedSprite
        if (!entity.has('AnimatedSprite')) return;

        const sprite = entity.AnimatedSprite;

                if(entity.has('LooksBackAndForthIntermittently')) {
            if(APP_ELAPSED_FRAMES % entity.LooksBackAndForthIntermittently.everyXFrames === 0) {
                sprite.direction *= -1;
            }
        }

        // Skip if paused
        if (sprite.paused) return;

        // Increment frame counter
        sprite.frameCount++;
        
        if (sprite.frameCount >= sprite.animationSpeed) {
            sprite.frameCount = 0;
            sprite.currentFrame++;
            
            // Loop animation if we've reached the end
            if (sprite.currentFrame > sprite.currentAnimationTo) {
                sprite.currentFrame = sprite.currentAnimationFrom;
                
                // Call animation complete callback if present
                if (sprite.onAnimationComplete) {
                    sprite.onAnimationComplete();
                }
                
                // Switch to next animation if queued
                if (sprite.nextAnimation) {
                    sprite.setAnimation(sprite.nextAnimation);
                    sprite.nextAnimation = "";
                }
            }
        }


    });
}
