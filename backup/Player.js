import Entity from "./Entity.js";

class Player extends Entity {
    constructor(server, socket, position) {
        super(server, position);

        this.socket = socket;
        this.socket.player = this;

        this.name = "Player";
        this.health.set(100);

        this.server.players.add(this.id);
    }
    update() {
        if (!super.update()) {
            return false;
        }

        if (this.health.value <= 0) {
            this.destroy();
        }

        return true;
    }
    destroy() {
        super.destroy();

        this.server.players.delete(this.id);
    }
}

export default Player;