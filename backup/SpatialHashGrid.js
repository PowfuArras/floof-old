const cellSize = 100;
class SpatialHashGrid {
    constructor() {
        this.grid = new Map();
        this.currentQuery = 0;
    }
    clear() {
        this.grid.clear();
        this.currentQuery = 0;
    }
    insert(object) {
        const startX = object._AABB.x1 >> cellSize;
        const startY = object._AABB.y1 >> cellSize;
        const endX = object._AABB.x2 >> cellSize;
        const endY = object._AABB.y2 >> cellSize;
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const key = x | (y << 10);
                if (!this.grid.has(key)) {
                    this.grid.set(key, [object]);
                } else {
                    this.grid.get(key).push(object);
                }
            }
        }
    }
    retrieve(object) {
        const result = [];
        const startX = object._AABB.x1 >> cellSize;
        const startY = object._AABB.y1 >> cellSize;
        const endX = object._AABB.x2 >> cellSize;
        const endY = object._AABB.y2 >> cellSize;
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const key = x | (y << 10);
                if (!this.grid.has(key)) {
                    continue;
                }
                const cell = this.grid.get(key);
                for (let i = 0; i < cell.length; i++) {
                    if (cell[i]._AABB.currentQuery != this.currentQuery) {
                        cell[i]._AABB.currentQuery = this.currentQuery;
                        if (cell[i].hash !== 0) {
                            result.push(cell[i]);
                        }
                    }
                }
            }
        }
        this.currentQuery++;
        return result.filter(other => object.id !== other.id && this.hitDetection(object, other));
    }
    hitDetection(object, other) {
        if (
            object._AABB.x1 > other._AABB.x2 ||
            object._AABB.y1 > other._AABB.y2 ||
            object._AABB.x2 < other._AABB.x1 ||
            object._AABB.y2 < other._AABB.y1
        ) {
            return false;
        }
        return true;
    }
    // Used to get the AABB of the entity, so that we aren't calculating it a bajillion times
    getAABB(object) {
        let size = object.realSize || object.size || object.radius || 1,
            width = (object.width || 1) * size,
            height = (object.height || 1) * size;
        return {
            x1: object.x - width,
            y1: object.y - height,
            x2: object.x + width,
            y2: object.y + height,
            currentQuery: -1
        };
    }
}

export default SpatialHashGrid;