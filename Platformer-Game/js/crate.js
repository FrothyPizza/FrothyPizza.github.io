

class Crate extends Entity {
    constructor(x, y, w, h, locations) {
        super(x, y, w, h);

        this.sprite = new AnimatedSprite(Loader.spriteSheets.crate, "Idle", 10);
        this.isHidden = false;

        this.locations = locations;

        this.target = null;

        this.collidesWithMap = false;

        this.gravity = this.defaultGravity/4;
    }

    draw(context) {
        this.sprite.draw(context, this.x, this.y);

        // // draw a crate at all locations
        // for(let location of this.locations) {
        //     context.fillStyle = "red";
        //     context.fillRect(location.x - context.view.x, location.y - context.view.y, 8, 8);
        // }
    }

    update(map, entities) {
        super.update(map, entities);

        if(this.velocity.y > 8) {
            this.velocity.y = 8;
        }

        // if distance between this and target is < 10, collides with map is true, otherwise false
        if(this.target && Math.abs(this.x - this.target.x) < 20 && Math.abs(this.y - this.target.y) < 20) {
            this.collidesWithMap = true;
        } else {
            this.collidesWithMap = false;
        }
    }

    relocate() {
        let location = this.locations[Math.floor(Math.random() * this.locations.length)];
        this.x = location.x;
        this.y = location.y - HEIGHT;
        this.target = location;
        this.isHidden = false;
    }

    hide() {
        this.x = -1000000;
        this.y = -1000000;
        this.isHidden = true;
    }
}

