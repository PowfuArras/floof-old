import SpatialHashGrid from "./SpatialHashGrid.js";

let id = 0;
class Game {
    constructor(config) {
        this.id = id++;
        this.width = config.width;
        this.height = config.height;
        this.players = new Map();
        this.entities = new Map();
        this.grid = new SpatialHashGrid();

        // Set intervals
        setInterval(() => this.update(), 1000 / 45);
        setInterval(() => this.updateClients(), 1000 / 40);
    }
    random() {
        return {
            x: Math.random() * this.width * 2 - this.width,
            y: Math.random() * this.height * 2 - this.height
        };
    }
    activate(entity, player = false) {
        /*
         * We need to rework this for FOV and shit, but, it's supposed to say if a player can see an entity
        */
        if (player) {
            return Math.abs(player.x - entity.x) < (1920 + entity.size * entity.width) && Math.abs(player.y - entity.y) < (1920 + entity.size * entity.height);
        }

        return this.players.some(player => {
            return Math.abs(player.x - entity.x) < (1920 + entity.size * entity.width) && Math.abs(player.y - entity.y) < (1920 + entity.size * entity.height);
        });
    }
    update() {
        this.grid.clear();
        this.entities.filter(entity => entity.update()).forEach(entity => {
            if (entity.isInGrid) {
                let collisions = this.grid.retrieve(entity);
                collisions.forEach(other => collide(entity, other));
            }
        });
    }
    updateClients() {
        this.players.forEach(player => {
            player.socket.talk({
                type: 1,
                playerID: player.id,
                width: this.width,
                height: this.height,
                entities: this.entities.filter(entity => this.activate(entity, player))
            })
        });
    }
}

export default Game;