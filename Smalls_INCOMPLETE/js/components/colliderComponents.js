
// Components for collision detection and physical dimensions

ECS.Components.Dimensions = class Dimensions {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
}

ECS.Components.Hitbox = class Hitbox {
    constructor(boxes = []) {
        // Array of {x, y, w, h} objects representing hitboxes relative to entity position
        // Hitboxes represent areas that can be hit by other entities
        this.boxes = boxes;
    }
}

ECS.Components.Hurtbox = class Hurtbox {
    constructor(boxes = []) {
        // Array of {x, y, w, h} objects representing hurtboxes relative to entity position
        // Hurtboxes represent areas that can hit other entities
        this.boxes = boxes;
    }
}
