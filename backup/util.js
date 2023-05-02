export function lerp(from, to, time) {
    return from + (to - from) * time;
}

export function getDistance(x1, y1, x2, y2) {
    let x = x2 - x1;
    let y = y2 - y1;
    return Math.sqrt(x * x + y * y);
}