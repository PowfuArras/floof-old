import Vector from "../Vector.js";
import Health from "../Health.js";
import * as util from "../util.js";

let entityID = 0;
class Entity {
    constructor(server, position) {
        this.id = entityID ++;

        this.server = server;

        this.x = position.x;
        this.y = position.y;

        this.velocity = new Vector(0, 0);
        this.acceleration = new Vector(0, 0);

        this.width = this.height = 1;

        this.size = 10;
        this.speed = 1;
        this.damage = 1;
        this.health = new Health(1000);
        this.collisions = new Map();

        this.server.entities.add(this.id);
    }
    update() {
        this.health.regenerate();

        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        this.acceleration.null();

        this.collisions.clear();

        return true;
    }
    destroy() {
        this.server.entities.delete(this.id);
    }
}

export default Entity;