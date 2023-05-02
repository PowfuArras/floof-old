import { GAME_TICKS_PER_SECOND } from "./config.js";

const petals = {};

petals["DEFAULT_PROPERTIES"] = {
    engine: .6,
    friction: .4,
    neutralDistance: 1,
    attackDistance: 2,
    defendDistance: .5,
    health: 10,
    damage: 1,
    recharge: 2500,
    size: .3,
    max: 1,
    radians: 0
};

petals["BASIC"] = {
    name: "Basic",
    description: "A nice petal, not too strong but not too weak.",
    rarities: {
        "COMMON": {
            health: 10,
            damage: 10,
            recharge: 2500
        },
        "UNCOMMON": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 20,
            damage: 20,
            recharge: 2500
        },
        "RARE": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 40,
            damage: 40,
            recharge: 2500
        },
        "EPIC": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 80,
            damage: 80,
            recharge: 2500
        },
        "LEGENDARY": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 160,
            damage: 160,
            recharge: 2500
        }
    }
};

petals["LIGHT"] = {
    name: "Light",
    description: "Weaker than most petals, but recharges quickly.",
    rarities: {
        "COMMON": {
            health: 5,
            damage: 13,
            recharge: 800,
            size: .25
        },
        "UNCOMMON": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 5,
            damage: 13,
            recharge: 800,
            max: 2,
            size: .225
        },
        "RARE": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 10,
            damage: 26,
            recharge: 800,
            max: 2,
            size: .225
        },
        "EPIC": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 13.3,
            damage: 34.7,
            recharge: 800,
            max: 3,
            size: .2
        },
        "LEGENDARY": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 26.7,
            damage: 69.3,
            recharge: 800,
            max: 3,
            size: .2
        }
    }
};

petals["FASTER"] = {
    name: "Faster",
    description: "It's so light it makes your other petals spin faster",
    rarities: {
        "COMMON": {
            health: 5,
            damage: 8,
            size: .275,
            radians: .5
        },
        "UNCOMMON": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 10,
            damage: 16,
            size: .275,
            radians: .7
        },
        "RARE": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 20,
            damage: 32,
            size: .275,
            radians: .9
        },
        "EPIC": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 40,
            damage: 64,
            size: .275,
            radians: 1.1
        },
        "LEGENDARY": {
            ...petals["DEFAULT_PROPERTIES"],
            health: 80,
            damage: 128,
            size: .275,
            radians: 1.3
        }
    }
};

// I'm lazy, so we need to convert radians/s to radians/tick
Object.keys(petals).forEach(petal => {
    if (petals[petal].rarities) {
        Object.keys(petals[petal].rarities).forEach(rarity => {
            if (petals[petal].rarities[rarity].radians) {
                petals[petal].rarities[rarity].radians = petals[petal].rarities[rarity].radians / GAME_TICKS_PER_SECOND;
            }
        });
    }
});

export default petals;