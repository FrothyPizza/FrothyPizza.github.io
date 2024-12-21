

class Collider extends GameObject {
    constructor(x, y, w, h, damage, lifetime = 3) {
        super(x, y, w, h);
        this.damage = damage;
        this.lifetime = lifetime;

        this.entitesInteractedWith = [];

        this.lifeClock = new Clock();
    }

    update(map, entities) {
        if(this.lifeClock.getTime() > this.lifetime) {
            this.removeFromScene = true;
        }
    }

    interactWith(other) {
        if(this.entitesInteractedWith.includes(other)) return;
        if(other.isEnemy && this.colliding(other)) {
            other.hurtWithDamage(this.damage);
            this.entitesInteractedWith.push(other);
            // console.log("enemy hit");
        }
    }   

    draw(context) {
        // context.fillStyle = "rgba(200, 0, 0, 0.5)";
        // context.fillRect(this.x, this.y, this.width, this.height);
    }
}

