import { Game } from "./game.js";
import { randomWeighted } from "../libraries/util.js";
import * as entityConstructors from "../live/entities.js";

class Zone {
    /**
     * Create a zone that can spawn specific groups of entities
     * @param {Game} game The game that this zone belongs to
     * @param {String} name The name of the zone
     * @param {Number} x1 The x coordinate of the top left corner
     * @param {Number} y1 The y coordinate of the top left corner
     * @param {Number} x2 The x coordinate of the bottom right corner
     * @param {Number} y2 The y coordinate of the bottom right corner
     */
    constructor(game, name, x1, y1, x2, y2) {
        this.game = game;
        this.name = name;
        
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        /**
         * The maximum number of mobs that can be spawned in this zone
         * @type {Number}
         * @default 1
         */
        this.maximumMobs = 1;

        /**
         * The number which Math.random() must be greater than to spawn a mob
         * @type {Number}
         * @default .5
         */
        this.spawnFrequency = .5;

        /**
         * The table of mobs that can be spawned in this zone
         * @type {Object}
         * @default {}
         */
        this.table = {};

        /**
         * The mobs that are currently alive in this zone
         * @type {Set}
         * @default new Set()
         */
        this.livingMobs = new Set();

        /**
         * The checks that must be passed to spawn a mob
         * @type {Array<Function>}
         * @default []
         */
        this.spawnChecks = [];
    }

    /**
     * Set the maximum number of mobs that can be spawned in this zone
     * @param {Number} maximumMobs The maximum number of mobs that can be spawned in this zone
     * @returns {Zone} This zone
     */
    setMaximumMobs(maximumMobs) {
        this.maximumMobs = maximumMobs;

        return this;
    }

    /**
     * Set the number which Math.random() must be greater than to spawn a mob
     * @param {Number} spawnFrequency The number which Math.random() must be greater than to spawn a mob
     * @returns {Zone} This zone
     */
    setSpawnFrequency(spawnFrequency) {
        this.spawnFrequency = spawnFrequency;

        return this;
    }

    /**
     * Add a mob to the table of mobs that can be spawned in this zone
     * @param {entityConstructors.Mob} mob The mob constructor object
     * @param {String} rarity The rarity of the mob
     * @param {Number} weight The weight of the mob
     * @returns {Zone} This zone
     */
    addMob(mob, rarity, weight) {
        this.table[`${rarity}_${mob.name}`] = weight;

        return this;
    }

    addSpawnCheck(check) {
        this.spawnChecks.push(check);

        return this;
    }

    spawn() {
        this.livingMobs.forEach(mobID => {
            if (!this.game.entities.has(mobID)) {
                this.livingMobs.delete(mobID);
            }
        });

        if (this.livingMobs.size < this.maximumMobs) {
            for (let i = this.livingMobs.size; i < this.maximumMobs; i++) {
                if (Math.random() > this.spawnFrequency) {
                    let mob = randomWeighted(this.table);

                    let [rarity, name] = mob.split("_");

                    let loc,
                        tries = 0;

                    do {
                        loc = this.game.randomBox(this.x1, this.y1, this.x2, this.y2);
                        tries++;
                    } while (this.spawnChecks.some(check => !check(loc.x, loc.y, 20, 20)) && tries < 50);

                    let entity = new entityConstructors[name](this.game, loc, rarity);

                    this.livingMobs.add(entity.id);
                }
            }
        }
    }
}

export default Zone;