export const cellSize = 100;

// Keep these a multiple of 12, so it lines up with the grid
export const roomWidth = 1200;
export const roomHeight = 1200;

export const port = 3001;

export const RARITY_INDEXES = {
    COMMON: 0,
    UNCOMMON: 1,
    RARE: 2,
    EPIC: 3,
    LEGENDARY: 4,
    MYTHIC: 5
};

export const RARITY_KEYS = Object.fromEntries(Object.entries(RARITY_INDEXES).map(([k, v]) => [v, k]));

export const ATTACK_TYPES = {
    PASSIVE: 0,
    NEUTRAL: 1,
    AGGRESSIVE: 2
};

export const GAME_TICKS_PER_SECOND = 45;
export const BASE_PETAL_SPIN_SPEED = .03;

export const VIEW_CONSTANT = 325;