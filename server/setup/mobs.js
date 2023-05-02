// Not a .JSON file cuz of warnings that are stupid
import { ATTACK_TYPES } from "./config.js";

const mobs = {};

// Template
/*
mobs["CONFIG_NAME"] = {
    name: "MOB_NAME",
    description: "MOB_DESCRIPTION",
    rarities: {
        COMMON: {
            health: 100,
            speed: 1,
            damage: 1,
            engine: 1,
            friction: 1,
            size: 1
        }
    }
}
*/

mobs["LADYBUG"] = {
    name: "Ladybug",
    description: "Cute and harmless.",
    defaultProperties: {
        engine: .2,
        friction: .8,
        attackType: ATTACK_TYPES.PASSIVE
    },
    rarities: {
        "COMMON": {
            health: 125,
            damage: 10,
            speed: 1.5,
            size: 10
        },
        "UNCOMMON": {
            health: 275,
            damage: 20,
            speed: 1.3,
            size: 13
        },
        "RARE": {
            health: 605,
            damage: 40,
            speed: 1.15,
            size: 19,
            attackType: ATTACK_TYPES.NEUTRAL
        },
        "EPIC": {
            health: 1300,
            damage: 80,
            speed: 1,
            size: 25,
            attackType: ATTACK_TYPES.NEUTRAL
        },
        "LEGENDARY": {
            health: 6400,
            damage: 160,
            speed: .5,
            size: 38,
            attackType: ATTACK_TYPES.NEUTRAL
        }
    },
    spawnChances: {
        "COMMON": 1,
        "UNCOMMON": .4,
        "RARE": .1,
        "EPIC": .02,
        "LEGENDARY": .001
    }
};

mobs["BEE"] = {
    name: "Bee",
    description: "It strings. Don't touch it.",
    defaultProperties: {
        engine: .2,
        friction: .8,
        attackType: ATTACK_TYPES.PASSIVE,
        canAggro: false,
        aggroSpeed: 1
    },
    rarities: {
        "COMMON": {
            health: 75,
            damage: 50,
            speed: 1.2,
            size: 10
        },
        "UNCOMMON": {
            health: 165,
            damage: 100,
            speed: 1.2,
            size: 12
        },
        "RARE": {
            health: 363,
            damage: 200,
            speed: 1.2,
            size: 14,
            attackType: ATTACK_TYPES.NEUTRAL,
            canAggro: true,
            aggroSpeed: 1.4
        },
        "EPIC": {
            health: 798.6,
            damage: 400,
            speed: 1,
            size: 18,
            attackType: ATTACK_TYPES.NEUTRAL,
            canAggro: true,
            aggroSpeed: 2
        },
        "LEGENDARY": {
            health: 3900,
            damage: 800,
            speed: .75,
            size: 26,
            attackType: ATTACK_TYPES.NEUTRAL,
            canAggro: true,
            aggroSpeed: 3
        }
    },
    spawnChances: {
        "COMMON": 1,
        "UNCOMMON": .4,
        "RARE": .1,
        "EPIC": .02,
        "LEGENDARY": .001
    }
};

const antSizes = {
    baby: 5,
    worker: 6,
    soldier: 7,
    queen: 10
};

const raritySizes = {
    "COMMON": 1,
    "UNCOMMON": 1.1,
    "RARE": 1.2,
    "EPIC": 1.3,
    "LEGENDARY": 1.5,
    "MYTHIC": 1.8
};

mobs["BABY_ANT"] = {
    name: "Baby Ant",
    description: "Weak and defenseless, but big dreams.",
    defaultProperties: {
        engine: .2,
        friction: .8,
        attackType: ATTACK_TYPES.PASSIVE,
        canAggro: false,
        aggroSpeed: 1
    },
    rarities: {
        "COMMON": {
            health: 50,
            damage: 10,
            speed: 1.2,
            size: antSizes.baby * raritySizes.COMMON
        },
        "UNCOMMON": {
            health: 110,
            damage: 20,
            speed: 1.2,
            size: antSizes.baby * raritySizes.UNCOMMON
        },
        "RARE": {
            health: 242,
            damage: 40,
            speed: 1.2,
            size: antSizes.baby * raritySizes.RARE,
            attackType: ATTACK_TYPES.NEUTRAL,
            canAggro: true,
            aggroSpeed: 1.4
        },
        "EPIC": {
            health: 532.6,
            damage: 80,
            speed: 1,
            size: antSizes.baby * raritySizes.EPIC,
            attackType: ATTACK_TYPES.NEUTRAL,
            canAggro: true,
            aggroSpeed: 2
        },
        "LEGENDARY": {
            health: 2600,
            damage: 160,
            speed: .75,
            size: antSizes.baby * raritySizes.LEGENDARY,
            attackType: ATTACK_TYPES.NEUTRAL,
            canAggro: true,
            aggroSpeed: 3
        }
    },
    spawnChances: {
        "COMMON": 1,
        "UNCOMMON": .4,
        "RARE": .1,
        "EPIC": .02,
        "LEGENDARY": .001
    }
};

mobs["WORKER_ANT"] = {
    name: "Worker Ant",
    description: "It's a bit temperamental, probably from working all the time.", // Karen get the manager
    defaultProperties: {
        engine: .2,
        friction: .8,
        attackType: ATTACK_TYPES.PASSIVE,
        canAggro: true,
        aggroSpeed: 1
    },
    rarities: {
        "COMMON": {
            health: 125,
            damage: 10,
            speed: 1.2,
            size: antSizes.worker * raritySizes.COMMON,
            canAggro: true,
            aggroSpeed: 1.5
        },
        "UNCOMMON": {
            health: 275,
            damage: 20,
            speed: 1.2,
            size: antSizes.worker * raritySizes.UNCOMMON,
            canAggro: true,
            aggroSpeed: 1.5
        },
        "RARE": {
            health: 605,
            damage: 40,
            speed: 1.2,
            size: antSizes.worker * raritySizes.RARE,
            attackType: ATTACK_TYPES.NEUTRAL,
            canAggro: true,
            aggroSpeed: 1.5
        },
        "EPIC": {
            health: 1300,
            damage: 80,
            speed: 1.2,
            size: antSizes.worker * raritySizes.EPIC,
            attackType: ATTACK_TYPES.NEUTRAL,
            canAggro: true,
            aggroSpeed: 1.6
        },
        "LEGENDARY": {
            health: 6400,
            damage: 160,
            speed: 1.1,
            size: antSizes.worker * raritySizes.LEGENDARY,
            attackType: ATTACK_TYPES.NEUTRAL,
            canAggro: true,
            aggroSpeed: 1.75
        }
    },
    spawnChances: {
        "COMMON": 1,
        "UNCOMMON": .4,
        "RARE": .1,
        "EPIC": .02,
        "LEGENDARY": .001
    }
};

mobs["SOLDIER_ANT"] = {
    name: "Soldier Ant",
    description: "It's got wings and it's ready to use them.",
    defaultProperties: {
        engine: .2,
        friction: .8,
        attackType: ATTACK_TYPES.AGGRESSIVE,
        canAggro: true,
        aggroSpeed: 1,
        viewDistance: 800
    },
    rarities: {
        "COMMON": {
            health: 200,
            damage: 10,
            speed: 1.2,
            size: antSizes.soldier * raritySizes.COMMON,
            canAggro: true,
            aggroSpeed: 1.5
        },
        "UNCOMMON": {
            health: 440,
            damage: 20,
            speed: 1.2,
            size: antSizes.soldier * raritySizes.UNCOMMON,
            canAggro: true,
            aggroSpeed: 1.5
        },
        "RARE": {
            health: 968,
            damage: 40,
            speed: 1.2,
            size: antSizes.soldier * raritySizes.RARE,
            canAggro: true,
            aggroSpeed: 1.5
        },
        "EPIC": {
            health: 2100,
            damage: 80,
            speed: 1.2,
            size: antSizes.soldier * raritySizes.EPIC,
            canAggro: true,
            aggroSpeed: 1.6
        },
        "LEGENDARY": {
            health: 10300,
            damage: 160,
            speed: 1.1,
            size: antSizes.soldier * raritySizes.LEGENDARY,
            canAggro: true,
            aggroSpeed: 1.75
        }
    },
    spawnChances: {
        "COMMON": 1,
        "UNCOMMON": .4,
        "RARE": .1,
        "EPIC": .02,
        "LEGENDARY": .001
    }
};

mobs["QUEEN_ANT"] = {
    name: "Queen Ant",
    description: "You must have done something really bad if she's chasing you.",
    defaultProperties: {
        engine: .2,
        friction: .8,
        attackType: ATTACK_TYPES.AGGRESSIVE,
        canAggro: true,
        aggroSpeed: 1,
        viewDistance: 1000
    },
    rarities: {
        "COMMON": {
            health: 1000,
            damage: 10,
            speed: 1.2,
            size: antSizes.queen * raritySizes.COMMON,
            canAggro: true,
            aggroSpeed: 1.5
        },
        "UNCOMMON": {
            health: 2200,
            damage: 20,
            speed: 1.2,
            size: antSizes.queen * raritySizes.UNCOMMON,
            canAggro: true,
            aggroSpeed: 1.5
        },
        "RARE": {
            health: 4800,
            damage: 40,
            speed: 1.2,
            size: antSizes.queen * raritySizes.RARE,
            canAggro: true,
            aggroSpeed: 1.5
        },
        "EPIC": {
            health: 10600,
            damage: 80,
            speed: 1.2,
            size: antSizes.queen * raritySizes.EPIC,
            canAggro: true,
            aggroSpeed: 1.6
        },
        "LEGENDARY": {
            health: 51500,
            damage: 160,
            speed: 1.1,
            size: antSizes.queen * raritySizes.LEGENDARY,
            canAggro: true,
            aggroSpeed: 1.75
        },
        "MYTHIC": {
            health: 249000,
            damage: 320,
            speed: 1.1,
            size: antSizes.queen * raritySizes.MYTHIC,
            canAggro: true,
            aggroSpeed: 1.75
        }
    },
    spawnChances: {
        "COMMON": 1,
        "UNCOMMON": .4,
        "RARE": .1,
        "EPIC": .02,
        "LEGENDARY": .001
    }
};

mobs["SURFACE_ANT_HOLE"] = {
    name: "Ant Burrow",
    description: "Ants go in, and come out. Can't explain that.",
    defaultProperties: {
        engine: .2,
        friction: .8,
        attackType: ATTACK_TYPES.NEUTRAL
    },
    rarities: {
        "COMMON": {
            health: 750,
            damage: 15,
            speed: 0,
            size: 7.5
        },
        "UNCOMMON": {
            health: 1250,
            damage: 45,
            speed: 0,
            size: 10
        },
        "RARE": {
            health: 1750,
            damage: 85,
            speed: 0,
            size: 12.5
        },
        "EPIC": {
            health: 4000,
            damage: 100,
            speed: 0,
            size: 15
        },
        "LEGENDARY": {
            health: 10000,
            damage: 125,
            speed: 0,
            size: 20
        }
    },
    spawnChances: {
        "COMMON": 1,
        "UNCOMMON": .4,
        "RARE": .1,
        "EPIC": .02,
        "LEGENDARY": .001
    }
};

for (const mobName in mobs) {
    if (mobs[mobName].rarities["MYTHIC"] === undefined) {
        mobs[mobName].rarities["MYTHIC"] = mobs[mobName].rarities["LEGENDARY"];
    }
}

export default mobs;