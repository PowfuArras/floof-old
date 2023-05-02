export function lerp(from, to, time) {
    return from + (to - from) * time;
}


// Consider rewriting this to be more compiler-friendly (getDistance(x1, x2, y1, y2))
export function getDistance(v1, v2) {
    const xDiff = v1.x - v2.x,
        yDiff = v1.y - v2.y;
    
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
} 

export function randomWeighted(table) {
    let seed = Math.random(),
        choice;
    for (let key in table) {
        if (table[key] >= seed && (choice === undefined || table[key] < table[choice])) {
            choice = key;
        }
    }

    return choice;
}

// This is basically for things where we odn't need the exact distance, but we need to know if something is close or far
export function getRudamentaryDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}