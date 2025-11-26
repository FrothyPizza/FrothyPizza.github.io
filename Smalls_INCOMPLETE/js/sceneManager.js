class SceneManager {
    constructor() {
        this.currentScene = null;
        this.nextScene = null;
        this.transitionState = 'NONE'; // 'SLIDE_LEFT'
        this.transitionProgress = 0;
        this.transitionDuration = 60;
    }

    setScene(scene) {
        this.currentScene = scene;
        GlobalState.currentScene = scene;
        // Reset view to start of map or player spawn?
        // context.view.update() will handle it if target is set.
    }

    switchScene(newScene, duration = 120) {
        // Save score from current player to GlobalState before destroying entities
        if (this.currentScene && this.currentScene.player && this.currentScene.player.has('PlayerState')) {
            GlobalState.score = this.currentScene.player.PlayerState.score;
        }

        this.nextScene = newScene;
        this.transitionState = 'SLIDE_LEFT';
        this.transitionProgress = 0;
        this.transitionDuration = duration;

        // clear ECS
        ECS.removeAllEntities();

        // Initialize the new scene
        if (typeof this.nextScene.init === 'function') {
            this.nextScene.init();
        }
        
        // Run one update on the new scene to spawn entities and set view target
        // We suppress inputs so the player doesn't move in the new scene yet
        const savedInputs = { ...Inputs };
        Object.keys(Inputs).forEach(key => Inputs[key] = false);
        
        // Temporarily set global current scene so view update works
        const oldGlobal = GlobalState.currentScene;
        GlobalState.currentScene = this.nextScene;
        
        this.nextScene.update();
        context.view.update(); // Force view update to center on player in new scene
        
        GlobalState.currentScene = oldGlobal;
        Object.assign(Inputs, savedInputs);
    }

    update() {
        if (this.transitionState === 'SLIDE_LEFT') {
            this.transitionProgress += 1 / this.transitionDuration;

            if (this.transitionProgress >= 1) {
                this.currentScene = this.nextScene;
                this.nextScene = null;
                this.transitionState = 'NONE';
                this.transitionProgress = 0;
                GlobalState.currentScene = this.currentScene;
            }
        } else {
            if (this.currentScene) {
                this.currentScene.update();
            }
        }
    }

    draw(context) {
        if (this.transitionState === 'SLIDE_LEFT') {
            // Ease in-out
            const t = this.transitionProgress < 0.5 
                ? 2 * this.transitionProgress * this.transitionProgress 
                : -1 + (4 - 2 * this.transitionProgress) * this.transitionProgress;
            
            const offset = Math.round(t * WIDTH);

            // Save current view state
            const viewStateA = { ...context.view };

            // --- Draw Current Scene (Moving Left) ---
            context.save();
            context.translate(-offset, 0);
            // Ensure view is correct for Scene A
            // (It should be, as it was the last active one)
            this.currentScene.draw(context);
            context.restore();

            // --- Draw Next Scene (Coming from Right) ---
            context.save();
            context.translate(WIDTH - offset, 0);

            // Swap GlobalState so view.update() constrains to the new map
            GlobalState.currentScene = this.nextScene;
            
            // We need to restore the view target/position for Scene B
            // Since we can't easily store/restore the internal state of view.update's target logic
            // we rely on the fact that we ran update() on Scene B in switchScene, 
            // so its entities are there. We just need to re-run view.update() to set context.view.x/y correctly.
            context.view.update(); 

            this.nextScene.draw(context);

            // Restore GlobalState
            GlobalState.currentScene = this.currentScene;
            
            // Restore View A
            Object.assign(context.view, viewStateA);
            
            context.restore();

        } else {
            if (this.currentScene) {
                this.currentScene.draw(context);
            }
        }
    }
}
