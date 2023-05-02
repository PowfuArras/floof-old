import { Vector } from "../libraries/vector.js";
import { Health } from "./health.js";
import mobs from "../setup/mobs.js";
import petals from "../setup/petals.js";
import { BASE_PETAL_SPIN_SPEED, RARITY_INDEXES, RARITY_KEYS } from "../setup/config.js";
import { Game } from "../setup/game.js";
import * as polyCollide from "../libraries/Polygon.js";

export const ENTITY_TYPES = {
    GENERIC: 0,
    PLAYER: 1,
    PETAL: 2,
    MOB: 3,
    PROJECTILE: 4,
    DROP: 5,
    WALL: 6,
    HARDCODED: 7
};

export const MOB_INDEXES = {
    LADYBUG: 0,
    BEE: 1,
    BABY_ANT: 2,
    WORKER_ANT: 3,
    SOLDIER_ANT: 4,
    QUEEN_ANT: 5,
    SURFACE_ANT_HOLE: 6
};

export const PETAL_INDEXES = {
    BASIC: 0,
    LIGHT: 1,
    FASTER: 2
};

export const BORDER_STRENGTH = .1;

let entityID = 0;
export class Entity {
    constructor(game, position) {
        this.id = entityID++;
        this.game = game;

        this.x = position.x;
        this.y = position.y;
        this.velocity = new Vector(0, 0);
        this.friction = .85;
        this.engine = .15;

        this.width = this.height = 1;
        this.size = 10;
        this.speed = 1;
        this.damage = 1;
        this.health = new Health(1);
        this.collisionArray = new Map();

        this.type = ENTITY_TYPES.GENERIC;

        this.game.entities.set(this.id, this);
    }

    destroy() {
        this.game.entities.delete(this.id);
    }

    update() {
        this.health.regenerate();
        this.x += this.velocity.x * this.speed;
        this.y += this.velocity.y * this.speed;

        this.velocity.multiply(this.friction);

        this.collisionArray.clear();

        return true;
    }

    aggro() { }

    get mass() {
        return this.width * this.height * this.size;
    }
}

export class Player extends Entity {
    constructor(game, socket, position) {
        super(game, position);

        this.socket = socket;
        this.socket.player = this;
        this.acceleration = new Vector(0, 0);
        this.rotation = 0;

        this.friction = .75;
        this.engine = .25;

        this.size = 10;
        this.speed = 2.5;

        this.name = "Player";
        this.health.set(100);
        this.damage = 25;

        this.attack = this.defend = false;

        this.type = ENTITY_TYPES.PLAYER;
        this.isInGrid = true;

        this.petalSlots = [];
        let petalConfig = ["BASIC", "LIGHT", "FASTER", "BASIC", "FASTER", "LIGHT", "FASTER", "LIGHT"];
        for (let i = 0; i < petalConfig.length; i++) {
            this.petalSlots.push(new PetalSlot(this, i, petalConfig[i], "LEGENDARY"));
        }

        this.totalPetals = 0;
        this.petalSpinSpeed = BASE_PETAL_SPIN_SPEED;
        this.petals = this.getPetals();
        this.needsPetalUpdate = false;
        this.petalSpin = 0;

        this.game.players.set(this.id, this);
    }

    update() {
        this.velocity.x += this.acceleration.x * this.engine;
        this.velocity.y += this.acceleration.y * this.engine;

        this.velocity.x -= Math.min(this.x - this.size + this.game.width, 0) * BORDER_STRENGTH;
        this.velocity.x -= Math.max(this.x + this.size - this.game.width, 0) * BORDER_STRENGTH;
        this.velocity.y -= Math.min(this.y - this.size + this.game.height, 0) * BORDER_STRENGTH;
        this.velocity.y -= Math.max(this.y + this.size - this.game.height, 0) * BORDER_STRENGTH;

        if (!super.update()) return false;

        for (let i = 0; i < this.petalSlots.length; i++) {
            this.petalSlots[i].update();
        }

        if (this.needsPetalUpdate) {
            this.petals = this.getPetals();
        }

        this.petalSpin += this.petalSpinSpeed;

        this._AABB = this.game.grid.getAABB(this);
        this.game.grid.insert(this);

        return true;
    }

    destroy() {
        super.destroy();
        this.game.players.delete(this.id);

        this.petalSlots.forEach(slot => {
            slot.destroy();
        });
    }

    getPetals() {
        this.needsPetalUpdate = false;
        let output = [];
        this.totalPetals = 0;
        let k = 0;

        this.petalSpinSpeed = BASE_PETAL_SPIN_SPEED;

        for (let i = 0; i < this.petalSlots.length; i++) {
            this.totalPetals += this.petalSlots[i].petal.max;
            this.petalSpinSpeed += this.petalSlots[i].petal.radians;
            for (let j = 0; j < this.petalSlots[i].petalEntities.length; j++) {
                let petal = this.petalSlots[i].petalEntities[j];
                if (!petal.isDead) {
                    petal.currentIndex = k + j;
                    output.push(petal);
                }
            }
            k += this.petalSlots[i].petal.max;
        }
        return output;
    }
}

class PetalSlot {
    /**
     * A petal slot that spawn the actual petal entities
     * @param {Player} player The player this petal slot is bound to
     * @param {Number} index The index of this petal slot
     * @param {Object} petal The configuration of this petal slot
     */
    constructor(player, index, petal, rarity) {
        this.player = player;
        this.index = index;
        this.petal = {
            ...defaultPetal,
            ...petals[petal].rarities[rarity],
            petal, rarity
        };

        this._index = PETAL_INDEXES[petal];
        this.rarity = RARITY_INDEXES[rarity];

        /**
         * @type {Array<Petal>}
         */
        this.petalEntities = [];
    }

    create() {
        for (let i = this.petalEntities.length; i < this.petal.max; i++) {
            this.petalEntities.push(new Petal(this.player.game, this.player, this, this.petal));
            this.player.needsPetalUpdate = true;
        }
    }

    getDeath() {
        return {
            time: Date.now() + this.petal.recharge,
            isDead: true,
            destroy: () => { }
        };
    }

    update() {
        let now = Date.now();
        // If we have dead petals, do some stuff
        for (let i = 0; i < this.petalEntities.length; i++) {
            if (now > this.petalEntities[i].time) {
                this.petalEntities.splice(i, 1);
                this.player.needsPetalUpdate = true;
                i--;
            }
        }


        // If we don't have enough petals, create more
        this.create();
    }

    getPrint() {
        let health = {
            max: 0,
            amount: 0
        };

        let respawning = -1,
            now = Date.now();

        for (let i = 0; i < this.petalEntities.length; i++) {
            if (this.petalEntities[i].time < now || this.petalEntities[i].isDead) {
                respawning = (this.petalEntities[i].time - now) / this.petal.recharge;
                break;
            }

            health.max += this.petalEntities[i].health.max;
            health.amount += this.petalEntities[i].health.amount;
        }

        if (respawning !== -1) {
            return [1, 1 - respawning];
        }

        return [0, health.amount / health.max];
    }

    destroy() {
        this.petalEntities.forEach(petal => {
            petal.destroy();
        });
    }
}

const defaultPetal = petals["DEFAULT_PROPERTIES"];
export class Petal extends Entity {
    /**
     * Create a new petal
     * @param {Game} game The game instance this petal is bound to
     * @param {Player} player The player instance this petal is bound to
     * @param {PetalSlot} sloSt The slot this petal is bound to
     * @param {Object} config The petal's configuration
     */
    constructor(game, player, slot, config) {
        super(game, player);

        this.player = player;
        this.slot = slot;
        this.type = ENTITY_TYPES.PETAL;
        this.index = PETAL_INDEXES[config.petal];
        this.rarity = RARITY_INDEXES[config.rarity];
        this.currentIndex = 0;
        this.speed = 6;
        this.acceleration = new Vector(0, 0);

        this.health.set(config.health ?? defaultPetal.health);
        this.damage = config.damage ?? defaultPetal.damage;
        this.friction = config.friction ?? defaultPetal.friction;
        this.engine = config.engine ?? defaultPetal.engine;
        this.recharge = config.recharge ?? defaultPetal.recharge;
        this.size = player.size * (config.size ?? defaultPetal.size);

        this.config = config;

        this.isInGrid = true;
        this.player.petals.push(this);
    }

    update() {
        if (!this.health.check()) {
            this.destroy();
            return false;
        }

        let strength = this.player.attack ? this.config.attackDistance : this.config.neutralDistance,
            dist = this.player.size + 30 * (this.player.defend ? this.config.defendDistance : strength),
            angle = this.currentIndex * Math.PI * 2 / this.player.totalPetals + this.player.petalSpin,
            atan = Math.atan2(this.player.y + dist * Math.sin(angle) - this.y, this.player.x + dist * Math.cos(angle) - this.x);

        this.acceleration.x = Math.cos(atan) * strength;
        this.acceleration.y = Math.sin(atan) * strength;

        this.velocity.x += this.acceleration.x * this.engine;
        this.velocity.y += this.acceleration.y * this.engine;

        if (!super.update()) return false;

        this._AABB = this.game.grid.getAABB(this);
        this.game.grid.insert(this);

        return true;
    }

    destroy() {
        super.destroy();
        this.slot.petalEntities[this.slot.petalEntities.indexOf(this)] = this.slot.getDeath();
        this.player.needsPetalUpdate = true;
    }
}

export class Mob extends Entity {
    constructor(game, position, rarity) {
        super(game, position);

        this.rarityKey = rarity;
        this.rarity = RARITY_INDEXES[rarity];
        this.type = ENTITY_TYPES.MOB;
        this.acceleration = new Vector(0, 0);
        this.rotation = 0;

        this.ticker = 0;
        this.isInGrid = true;
    }
}

export class PassiveMob extends Mob {
    constructor(game, position, rarity) {
        super(game, position, rarity);

        this.rarityKey = rarity;

        this.type = ENTITY_TYPES.MOB;
    }
    define(key) {
        this.index = MOB_INDEXES[key];

        let stats = mobs[key].rarities[this.rarityKey],
            defaultProperties = mobs[key].defaultProperties;

        this.friction = stats.friction ?? defaultProperties.friction;
        this.engine = stats.engine ?? defaultProperties.engine;
        this.size = stats.size ?? defaultProperties.size;
        this.speed = stats.speed ?? defaultProperties.speed;
        this.damage = stats.damage ?? defaultProperties.damage;
        this.health.set(stats.health ?? defaultProperties.health);
    }
    movement() {
        if (this.ticker <= 0) {
            if (Math.random() > .75) {
                this.acceleration.null();
                this.ticker = Math.random() * 101 + 50;
            } else {
                this.acceleration = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1);
                this.ticker = Math.random() * 101 + 50;
            }
        } else if (this.acceleration.length < .01 && this.ticker % 25 === 0) {
            this.velocity.add(new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1));
        }
        this.ticker--;
    }
    update() {
        if (!this.game.activate(this)) {
            return false;
        }

        if (!this.health.check()) {
            super.destroy();
            return false;
        }

        this.movement();

        this.velocity.x += this.acceleration.x * this.engine;
        this.velocity.y += this.acceleration.y * this.engine;

        this.velocity.x -= Math.min(this.x - this.size + this.game.width, 0) * BORDER_STRENGTH;
        this.velocity.x -= Math.max(this.x + this.size - this.game.width, 0) * BORDER_STRENGTH;
        this.velocity.y -= Math.min(this.y - this.size + this.game.height, 0) * BORDER_STRENGTH;
        this.velocity.y -= Math.max(this.y + this.size - this.game.height, 0) * BORDER_STRENGTH;

        if (!super.update()) return false;

        this.rotation = this.velocity.direction;

        this._AABB = this.game.grid.getAABB(this);
        this.game.grid.insert(this);

        return true;
    }
}

export class NeutralMob extends PassiveMob {
    constructor(game, position, rarity) {
        super(game, position, rarity);

        this.rarityKey = rarity;

        this.type = ENTITY_TYPES.MOB;
    }
    define(key) {
        this.index = MOB_INDEXES[key];

        let stats = mobs[key].rarities[this.rarityKey],
            defaultProperties = mobs[key].defaultProperties;

        this.friction = stats.friction ?? defaultProperties.friction;
        this.engine = stats.engine ?? defaultProperties.engine;
        this.size = stats.size ?? defaultProperties.size;
        this.speed = stats.speed ?? defaultProperties.speed;
        this._speed = stats.speed ?? defaultProperties.speed;
        this.damage = stats.damage ?? defaultProperties.damage;
        this.health.set(stats.health ?? defaultProperties.health);

        this.canAggro = stats.canAggro ?? defaultProperties.canAggro;

        this.aggroSpeed = stats.aggroSpeed ?? defaultProperties.aggroSpeed;
        this.target = null;
    }
    movement() {
        if (this.target !== null) {
            if (!this.target.health.check()) {
                this.target = null;
                return;
            }

            let atan = Math.atan2(this.target.y - this.y, this.target.x - this.x);

            this.acceleration.x = Math.cos(atan);
            this.acceleration.y = Math.sin(atan);

            this.speed = this.aggroSpeed * this._speed;
            return;
        }

        this.speed = this._speed;

        super.movement();
    }

    aggro(other) {
        if (!this.canAggro) {
            return;
        }

        if (other.type === ENTITY_TYPES.PETAL) {
            other = other.player;
        }

        if (other.type === ENTITY_TYPES.PLAYER && this.target === null) {
            this.target = other;
        }
    }
}

export class AggressiveMob extends NeutralMob {
    constructor(game, position, rarity) {
        super(game, position, rarity);

        this.rarityKey = rarity;

        this.type = ENTITY_TYPES.MOB;
        this.targetTick = 5;
    }
    define(key) {
        this.index = MOB_INDEXES[key];

        let stats = mobs[key].rarities[this.rarityKey],
            defaultProperties = mobs[key].defaultProperties;

        this.friction = stats.friction ?? defaultProperties.friction;
        this.engine = stats.engine ?? defaultProperties.engine;
        this.size = stats.size ?? defaultProperties.size;
        this.speed = stats.speed ?? defaultProperties.speed;
        this._speed = stats.speed ?? defaultProperties.speed;
        this.damage = stats.damage ?? defaultProperties.damage;
        this.health.set(stats.health ?? defaultProperties.health);
        this.viewDistance = stats.viewDistance ?? defaultProperties.viewDistance;
        this.canAggro = stats.canAggro ?? defaultProperties.canAggro;

        this.aggroSpeed = stats.aggroSpeed ?? defaultProperties.aggroSpeed;
        this.target = null;
    }

    targeting() {
        this.targetTick--;
        if (this.targetTick <= 0) {
            this.target = this.searchForEnemies() ?? null;
            this.targetTick = 10;
        }
    }

    searchForEnemies() {
        // Use the game's grid to find nearby entities
        let entities = this.game.grid.retrieve({
            _AABB: {
                x1: this.x - this.viewDistance,
                y1: this.y - this.viewDistance,
                x2: this.x + this.viewDistance,
                y2: this.y + this.viewDistance
            },
            currentQuery: -1
        });

        return entities.filter(entity => entity.type === ENTITY_TYPES.PLAYER)[0];
    }
}

export class Ladybug extends PassiveMob {
    constructor(game, position, rarity = "COMMON") {
        super(game, position, rarity);

        this.define("LADYBUG");
    }
}

export class Bee extends NeutralMob {
    constructor(game, position, rarity = "COMMON") {
        super(game, position, rarity);

        this.define("BEE");
    }
}

export class BabyAnt extends PassiveMob {
    constructor(game, position, rarity = "COMMON") {
        super(game, position, rarity);

        this.define("BABY_ANT");
    }
}

export class WorkerAnt extends NeutralMob {
    constructor(game, position, rarity = "COMMON") {
        super(game, position, rarity);

        this.define("WORKER_ANT");
    }
}

export class SoldierAnt extends AggressiveMob {
    constructor(game, position, rarity = "COMMON") {
        super(game, position, rarity);

        this.define("SOLDIER_ANT");
    }
}

export class QueenAnt extends AggressiveMob {
    constructor(game, position, rarity = "COMMON") {
        super(game, position, rarity);

        this.define("QUEEN_ANT");
    }
}

export class Projectile extends Entity {
    constructor(game, position) {
        super(game, position);

        this.type = ENTITY_TYPES.PROJECTILE;
    }
}

export class Drop extends Entity {
    constructor(game, position) {
        super(game, position);

        this.type = ENTITY_TYPES.DROP;
    }
}

export class Wall extends Entity {
    constructor(game, location) {
        super(game, location);
        this.width = 1;
        this.height = 1;
        this.type = ENTITY_TYPES.WALL;
        this._AABB = this.game.obstacleGrid.getAABB(this);
        this.game.obstacleGrid.insert(this);
    }
    update() {
        if (!this.game.activate(this)) {
            return false;
        }
        this._AABB = this.game.grid.getAABB(this);
        this.game.grid.insert(this);
        this.collisionArray.clear();
        return true;
    }
}

export class HarcodedGameObject extends Wall {
    constructor(game, location, size, hitbox) {
        super(game, location);
        this.type = ENTITY_TYPES.HARDCODED;

        this.size = size;
        polyCollide.createHitbox(this.id, hitbox);

        this.hitbox = polyCollide.getHitbox(this.id, this.x, this.y, this.size, 0);
        this.width = this.height = polyCollide.getLargestPoint(this.hitbox) * 1.15 / this.size;
    }
}

export class BorderEntity extends Wall {
    constructor(game, location, path) {
        super(game, location);
        this.type = ENTITY_TYPES.HARDCODED;

        this.size = 1;
        this.width = polyCollide.getBiggestWidth(path) * 1.1;
        this.height = polyCollide.getBiggestHeight(path) * 1.1;

        this.hitbox = path.map(point => {
            return {
                x: point.x + this.x,
                y: point.y + this.y
            };
        });

        this.game.harcodedPaths.push(this.hitbox);
    }
}

export class SurfaceAntHole extends Mob {
    constructor(game, location, rarity) {
        super(game, location, rarity);

        this.index = MOB_INDEXES.SURFACE_ANT_HOLE;

        this.define("SURFACE_ANT_HOLE");

        this.lastHP = this.health.amount;
        this.spawnTick = 0;

        for (let i = 0; i < 4; i ++) {
            this.spawnAnts();
        }
    }
    define(key) {
        this.index = MOB_INDEXES[key];

        let stats = mobs[key].rarities[this.rarityKey],
            defaultProperties = mobs[key].defaultProperties;

        this.friction = stats.friction ?? defaultProperties.friction;
        this.engine = stats.engine ?? defaultProperties.engine;
        this.size = stats.size ?? defaultProperties.size;
        this.speed = stats.speed ?? defaultProperties.speed;
        this.damage = stats.damage ?? defaultProperties.damage;
        this.health.set(stats.health ?? defaultProperties.health);
    }
    update() {
        if (!this.game.activate(this)) {
            return false;
        }

        if (this.health.amount < this.lastHP) {
            let amount = (this.lastHP - this.health.amount) / (this.health.max / 4);
            for (let i = 0; i < Math.round(amount); i ++) {
                for (let j = 0; j < 2 * (this.rarity + 1); j ++) {
                    new SoldierAnt(this.game, {
                        x: this.x + Math.random() * this.size * 4 - this.size * 2,
                        y: this.y + Math.random() * this.size * 4 - this.size * 2
                    }, this.getValidRarity());
                }

                // This is in the loop so we don't stop the damage from accumulating
                this.lastHP = this.health.amount;
            }
        }

        if (!this.health.check()) {
            // Spawn a bunch of ants
            for (let i = 0; i < 2 * (this.rarity + 1); i ++) {
                new SoldierAnt(this.game, {
                    x: this.x + Math.random() * this.size * 4 - this.size * 2,
                    y: this.y + Math.random() * this.size * 4 - this.size * 2
                }, this.getValidRarity());
            }
            new QueenAnt(this.game, {
                x: this.x,
                y: this.y
            }, this.rarityKey);
            super.destroy();
            return false;
        }

        this.velocity.null();
        if (!super.update()) return false;

        this._AABB = this.game.grid.getAABB(this);
        this.game.grid.insert(this);

        return true;
    }
    getValidRarity() {
        let base = Math.max(0, this.rarity - 2);
        return RARITY_KEYS[Math.floor(Math.random() * (this.rarity - base + 1) + base)];
    }
    spawnAnts() {
        new BabyAnt(this.game, {
            x: this.x + Math.random() * this.size * 2 - this.size,
            y: this.y + Math.random() * this.size * 2 - this.size
        }, this.getValidRarity());
        new WorkerAnt(this.game, {
            x: this.x + Math.random() * this.size * 2 - this.size,
            y: this.y + Math.random() * this.size * 2 - this.size
        }, this.getValidRarity());
        new SoldierAnt(this.game, {
            x: this.x + Math.random() * this.size * 2 - this.size,
            y: this.y + Math.random() * this.size * 2 - this.size
        }, this.getValidRarity());
    }
}