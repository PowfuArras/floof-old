import Grid from "../libraries/grid.js";
import collide from "../live/collide.js";
import { GAME_TICKS_PER_SECOND, VIEW_CONSTANT } from "./config.js";
import Zone from "./Zone.js";
import { Ladybug, Bee, ENTITY_TYPES, BabyAnt, WorkerAnt, Wall, SoldierAnt, QueenAnt, HarcodedGameObject, BorderEntity, SurfaceAntHole } from "../live/entities.js";
import { MazeGenerator, MazeRemap } from "../libraries/maze.js";
import * as polyCollide from "../libraries/Polygon.js";
import generateBorder from "../libraries/generateBorders.js";

function placeWalls(game, walls) {
    walls.forEach(function place(wall) {
        let entity = new Wall(game, {
            x: wall.x,
            y: wall.y
        });
        entity.width = wall.width;
        entity.height = wall.height;
        entity.size = wall.size;
    });
}

let gameID = 0;
export class Game {
    constructor(config) {
        this.id = gameID++;
        this.width = config.width;
        this.height = config.height;
        this.grid = new Grid();
        this.players = new Map();
        this.entities = new Map();

        this.recentTicks = 0;
        this.mspt = 0;

        this.mapType = 0;
        this.zones = new Map();

        // Should never be cleared, used for wall spawning
        this.obstacleGrid = new Grid();

        setInterval(() => this.update(), 1000 / GAME_TICKS_PER_SECOND);
        setInterval(() => this.updateClients(), 1000 / 30);
        setInterval(() => this.secondLoop(), 5000);


        this.harcodedPaths = [];
        //this.generateBorders();
    }

    generateBorders() {
        function place(x, y, w, h, f) {

            let path = generateBorder(w, h, f);
            
            new BorderEntity(this, {
                x: x,
                y: y
            }, polyCollide.pointArrayToObjectArray(path));
        }

        place.call(this, -this.width, 0, 50, this.height, 0);
        place.call(this, this.width, 0, 50, this.height, 1);

        place.call(this, 0, this.height, this.width, 50, 2);
        place.call(this, 0, -this.height, this.width, 50, 3);
    }

    random() {
        return {
            x: Math.random() * this.width * 2 - this.width,
            y: Math.random() * this.height * 2 - this.height
        };
    }

    randomBox(x1, y1, x2, y2) {
        return {
            x: Math.random() * (x2 - x1) + x1,
            y: Math.random() * (y2 - y1) + y1
        };
    }

    activate(entity, player = false) {
        /*
         * We need to rework this for FOV and shit, but,
         * it's supposed to say if a player can see an entity
        */

        let width = entity.size * entity.width,
            height = entity.size * entity.height;

        if (player) {
            return Math.abs(player.x - entity.x) < (VIEW_CONSTANT + width) && Math.abs(player.y - entity.y) < (VIEW_CONSTANT + height);
        }

        return this.players.some(player => {
            return Math.abs(player.x - entity.x) < (VIEW_CONSTANT + width) && Math.abs(player.y - entity.y) < (VIEW_CONSTANT + height);
        });
    }

    update() {
        let now = performance.now();
        this.grid.clear();
        this.entities.filter(entity => entity.update()).forEach(entity => {
            if (entity.isInGrid) {
                let collisions = this.grid.retrieve(entity);
                collisions.forEach(other => collide(entity, other));
            }

            if (entity.targeting) {
                entity.targeting();
            }
        });

        this.recentTicks++;

        this.mspt += performance.now() - now;
    }

    updateClients() {
        this.players.forEach(player => {
            player.socket.talk({
                type: 1,
                playerID: player.id,
                player: player,
                width: this.width,
                height: this.height,
                mapType: this.mapType,
                entities: this.entities.filter(entity => this.activate(entity, player) && entity.type !== ENTITY_TYPES.HARDCODED)
            })
        });
    }

    getSum() {
        let output = {
            walls: 0,
            players: 0,
            petals: 0,
            mobs: 0
        };

        this.entities.forEach(entity => {
            switch (entity.type) {
                case ENTITY_TYPES.PLAYER:
                    output.players++;
                    break;
                case ENTITY_TYPES.WALL:
                    output.walls++;
                    break;
                case ENTITY_TYPES.PETAL:
                    output.petals++;
                    break;
                case ENTITY_TYPES.MOB:
                    output.mobs++;

                    output[entity.index] = output[entity.index] || 0;
                    output[entity.index]++;
                    break;
            }
        });

        return output;
    }

    secondLoop() {
        this.zones.forEach(zone => zone.spawn());

        let sum = this.getSum();

        console.log(`[Game #${this.id} ${this.width}x${this.height}] ${sum.players} players, ${sum.walls} walls, ${sum.petals} petals, ${sum.mobs} mobs, ${(this.mspt / this.recentTicks).toFixed(3)} mspt (avg)`);

        this.recentTicks = 0;
        this.mspt = 0;
    }
}

export class Garden extends Game {
    constructor(config) {
        super(config);

        this.mapType = 0;

        this.createZones();
    }

    createZones() {
        { // Ladybugs
            let zone = new Zone(this, "ladybugs", -this.width, -this.height, this.width, this.height);
            zone.setMaximumMobs(10);
            zone.setSpawnFrequency(.9);

            zone.addMob(Ladybug, "COMMON", 1);
            zone.addMob(Ladybug, "UNCOMMON", 1 / 3);
            zone.addMob(Ladybug, "RARE", 1 / 6);
            zone.addMob(Ladybug, "EPIC", 1 / 12);
            zone.addMob(Ladybug, "LEGENDARY", 1 / 24);

            this.zones.set(zone.name, zone);
        } { // Bees
            let zone = new Zone(this, "bees", -this.width, -this.height, this.width, this.height);
            zone.setMaximumMobs(10);
            zone.setSpawnFrequency(.9);

            zone.addMob(Bee, "COMMON", 1);
            zone.addMob(Bee, "UNCOMMON", 1 / 3);
            zone.addMob(Bee, "RARE", 1 / 6);
            zone.addMob(Bee, "EPIC", 1 / 12);
            zone.addMob(Bee, "LEGENDARY", 1 / 24);

            this.zones.set(zone.name, zone);
        } { // BabyAnts
            let zone = new Zone(this, "babyAnts", -this.width, -this.height, this.width, this.height);
            zone.setMaximumMobs(10);
            zone.setSpawnFrequency(.5);

            zone.addMob(BabyAnt, "COMMON", 1);
            zone.addMob(BabyAnt, "UNCOMMON", 1 / 4);
            zone.addMob(BabyAnt, "RARE", 1 / 16);
            zone.addMob(BabyAnt, "EPIC", 1 / 64);
            zone.addMob(BabyAnt, "LEGENDARY", 1 / 256);

            this.zones.set(zone.name, zone);
        } { // WorkerAnts
            let zone = new Zone(this, "workerAnts", -this.width, -this.height, this.width, this.height);
            zone.setMaximumMobs(10);
            zone.setSpawnFrequency(.5);

            zone.addMob(WorkerAnt, "COMMON", 1);
            zone.addMob(WorkerAnt, "UNCOMMON", 1 / 4);
            zone.addMob(WorkerAnt, "RARE", 1 / 16);
            zone.addMob(WorkerAnt, "EPIC", 1 / 64);
            zone.addMob(WorkerAnt, "LEGENDARY", 1 / 256);

            this.zones.set(zone.name, zone);
        } { // Ant holes
            let zone = new Zone(this, "antHoles", -this.width, -this.height, this.width, this.height);
            zone.setMaximumMobs(2);
            zone.setSpawnFrequency(.01);

            zone.addMob(SurfaceAntHole, "COMMON", 1);
            zone.addMob(SurfaceAntHole, "UNCOMMON", 1 / 4);
            zone.addMob(SurfaceAntHole, "RARE", 1 / 16);
            zone.addMob(SurfaceAntHole, "EPIC", 1 / 64);
            zone.addMob(SurfaceAntHole, "LEGENDARY", 1 / 256);
            zone.addMob(SurfaceAntHole, "MYTHIC", 1 / 1024);

            this.zones.set(zone.name, zone);
        }
    }
}

export class AntHole extends Game {
    constructor(config) {
        super(config);

        this.mapType = 1;

        this.createZones();
    }

    withinWall(x, y, width, height) {
        // Query the grid for entities within the given area
        let entities = this.obstacleGrid.retrieve({
            _AABB: {
                x1: x - width,
                y1: y - height,
                x2: x + width,
                y2: y + height,
                currentQuery: -1
            }
        });

        // Check if any of the entities are walls
        return !entities.some(entity => entity.type === ENTITY_TYPES.WALL);
    }

    createZones() {
        { // Whole thing: Baby Ants
            let zone = new Zone(this, "babyAnts", -this.width, -this.height, this.width, this.height);
            zone.setMaximumMobs(5);
            zone.setSpawnFrequency(.5);

            zone.addSpawnCheck(this.withinWall.bind(this));

            zone.addMob(BabyAnt, "COMMON", 1);
            zone.addMob(BabyAnt, "UNCOMMON", 1 / 3);
            zone.addMob(BabyAnt, "RARE", 1 / 6);
            zone.addMob(BabyAnt, "EPIC", 1 / 12);
            zone.addMob(BabyAnt, "LEGENDARY", 1 / 24);

            this.zones.set(zone.name, zone);
        } { // Whole thing: Worker Ants
            let zone = new Zone(this, "workerAnts", -this.width, -this.height, this.width, this.height);
            zone.setMaximumMobs(10);
            zone.setSpawnFrequency(.9);

            zone.addSpawnCheck(this.withinWall.bind(this));

            zone.addMob(WorkerAnt, "COMMON", 1);
            zone.addMob(WorkerAnt, "UNCOMMON", 1 / 3);
            zone.addMob(WorkerAnt, "RARE", 1 / 6);
            zone.addMob(WorkerAnt, "EPIC", 1 / 12);
            zone.addMob(WorkerAnt, "LEGENDARY", 1 / 24);

            this.zones.set(zone.name, zone);
        } { // Whole thing: Soldier Ants
            let zone = new Zone(this, "soldierAnts", -this.width, -this.height, this.width, this.height);
            zone.setMaximumMobs(20);
            zone.setSpawnFrequency(.9);

            zone.addSpawnCheck(this.withinWall.bind(this));

            zone.addMob(SoldierAnt, "COMMON", 1);
            zone.addMob(SoldierAnt, "UNCOMMON", 1 / 3);
            zone.addMob(SoldierAnt, "RARE", 1 / 6);
            zone.addMob(SoldierAnt, "EPIC", 1 / 12);
            zone.addMob(SoldierAnt, "LEGENDARY", 1 / 24);

            this.zones.set(zone.name, zone);
        } { // Whole thing: Queen Ants
            let zone = new Zone(this, "queenAnt", -this.width, -this.height, this.width, this.height);
            zone.setMaximumMobs(1);
            zone.setSpawnFrequency(.95);

            zone.addSpawnCheck(this.withinWall.bind(this));

            zone.addMob(QueenAnt, "RARE", 1);
            zone.addMob(QueenAnt, "EPIC", 1 / 8);
            zone.addMob(QueenAnt, "LEGENDARY", 1 / 32);
            zone.addMob(QueenAnt, "MYTHIC", 1 / 128);

            this.zones.set(zone.name, zone);
        }

        const maze = new MazeGenerator({
            width: 10,
            height: 10,
            clumpSize: [1, 1],
            cardinals: 1,
            lineThreshold: [1, 1],
            soloThreshold: .5,
            openMiddle: true
        });
        const remapper = new MazeRemap(maze.maze);
        const remapped = remapper.remap();
        const scale = this.width * 2 / maze.width;
        placeWalls(this, remapped.map((wall) => {
            let width = wall.width || 1,
                height = wall.height || 1,
                x = wall.x * scale + (width * wall.size * scale / 2),
                y = wall.y * scale + (height * wall.size * scale / 2);
            return {
                x: x - this.width,
                y: y - this.height,
                width: width,
                height: height,
                size: wall.size * scale / 2
            };
        }));
    }
}

export class Desert extends Game {
    constructor(config) {
        super(config);

        this.mapType = 2;

        this.createZones();
    }

    createZones() {
        { // Ant holes
            let zone = new Zone(this, "antHoles", -this.width, -this.height, this.width, this.height);
            zone.setMaximumMobs(8);
            zone.setSpawnFrequency(.8);

            zone.addMob(SurfaceAntHole, "RARE", 1);
            zone.addMob(SurfaceAntHole, "EPIC", 1 / 8);
            zone.addMob(SurfaceAntHole, "LEGENDARY", 1 / 32);
            zone.addMob(SurfaceAntHole, "MYTHIC", 1 / 128);

            this.zones.set(zone.name, zone);
        }
    }
}

export class Portal {
    /**
     * Create a portal to teleport people between
     * @param {Game} game1 The first game
     * @param {Game} game2 Second Game
     * @param {{x:Number,y:Number}} loc1 The location of the portal in the first game
     * @param {{x:Number.y:Number}} loc2 The location of the portal in the second game
     */
    constructor(game1, game2, loc1, loc2) {
        this.game1 = game1;
        this.game2 = game2;

        this.loc1 = loc1;
        this.loc2 = loc2;
    }
    teleport(body) {
        if (body.constructor.name !== "Player") {
            return;
        }

        switch (body.game.id) {
            case this.game1.id:
                body.socket.changeGame(this.game2, this.loc2);
                break;
            case this.game2.id:
                body.socket.changeGame(this.game1, this.loc2);
                break;
        }
    }
}