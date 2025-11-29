class MenuScene extends Scene {
    constructor() {
        super();
        // Mock map for view system constraints
        this.map = {
            getWidthInPixels: () => WIDTH,
            getHeightInPixels: () => HEIGHT
        };
    }

    init() {
        super.init();

        // Reset score
        if (typeof GlobalState !== 'undefined') {
            GlobalState.score = 0;
        }

        // Create Title Screen Entity
        const titleEntity = new ECS.Entity();
        titleEntity.addComponent(new ECS.Components.Position(0, 0));
        
        if (Loader.spriteSheets['TitleScreen']) {
             titleEntity.addComponent(new ECS.Components.AnimatedSprite(Loader.spriteSheets['TitleScreen'], "Idle"));
        } else {
            console.error("TitleScreen sprite sheet not found!");
        }
        
        this.addEntity(titleEntity);

        // Load high scores
        this.highScores = this.loadHighScores();
    }

    loadHighScores() {
        const stored = localStorage.getItem('smalls_world_high_scores');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse high scores", e);
                return [];
            }
        }
        return [];
    }

    update() {
        super.update();

        // Check for any input to start game
        let anyKeyPressed = false;
        for (let key in Inputs) {
            if (Inputs[key]) {
                anyKeyPressed = true;
                break;
            }
        }

        if (anyKeyPressed) {
            // Transition to Saloon
            if (Loader.levels["saloon"]) {
                GlobalState.sceneManager.switchScene(new SaloonScene(Loader.levels["saloon"].xml));
            } else {
                console.error("Saloon level not loaded!");
            }
        }
        
        // Update entities (animation system needs to run)
        ECS.Systems.animationSystem(this.entities);
    }

    draw(context) {
        // Clear screen
        context.fillStyle = 'black';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);

        // Draw entities (Title Screen)
        ECS.Systems.renderSystem(this.entities, context);

        // Draw High Scores
        const centerX = WIDTH / 2;
        const centerY = HEIGHT / 2;
        
        this.drawBitmapText(context, "HIGH SCORES", centerX, centerY - 20, "center", "white");
        
        if (this.highScores.length > 0) {
            this.highScores.slice(0, 5).forEach((score, index) => {
                this.drawBitmapText(context, `${index + 1}. ${score}`, centerX, centerY + (index * 10), "center", "white");
            });
        } else {
             this.drawBitmapText(context, "NO SCORES YET", centerX, centerY, "center", "gray");
        }
        
        // Blink "PRESS ANY BUTTON"
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.drawBitmapText(context, "PRESS ANY BUTTON", centerX, HEIGHT - 20, "center", "white");
        }
    }
}
