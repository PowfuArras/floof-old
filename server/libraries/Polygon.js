function intersect(s1, s2) {
    if (((s2[1].x - s2[0].x) * (s1[0].y - s1[1].y) - (s1[0].x - s1[1].x) * (s2[1].y - s2[0].y)) === 0) {
        return true;
    }
    const tA = ((s2[0].y - s2[1].y) * (s1[0].x - s2[0].x) + (s2[1].x - s2[0].x) * (s1[0].y - s2[0].y)) / ((s2[1].x - s2[0].x) * (s1[0].y - s1[1].y) - (s1[0].x - s1[1].x) * (s2[1].y - s2[0].y));
    const tB = ((s1[0].y - s1[1].y) * (s1[0].x - s2[0].x) + (s1[1].x - s1[0].x) * (s1[0].y - s2[0].y)) / ((s2[1].x - s2[0].x) * (s1[0].y - s1[1].y) - (s1[0].x - s1[1].x) * (s2[1].y - s2[0].y));
    return [tA, tB];
}

/**
 * Do two polygon paths intersect?
 * @param {Array.<{x:Number,y:Number}>} instance The first polygon path
 * @param {Array.<{x:Number,y:Number}>} other The second polygon path
 * @returns {Object<{x:Number,y:Number}>|Boolean} The collision point, or false if no collision
 */
export function intersectTwoPolygons(instance, other) {
    for (let i = 0; i < instance.length; i++) {
        for (let j = 0; j < other.length; j++) {
            const t = intersect([
                instance[i],
                instance[(i + 1) % instance.length]
            ], [
                other[j],
                other[(j + 1) % other.length]
            ]);
            if (t === true) {
                continue;
            }
            if (t[0] <= 1 && t[0] >= 0 && t[1] <= 1 && t[1] >= 0) {
                return {
                    x: instance[i].x + (instance[(i + 1) % instance.length].x - instance[i].x) * t[0],
                    y: instance[i].y + (instance[(i + 1) % instance.length].y - instance[i].y) * t[0]
                };
            }
        }
    }
    return false;
}

/**
 * Get the largest point in a polygon
 * @param {Array.<{x:Number,y:Number}>} sides The polygon to check
 * @returns {Number} The largest point in the polygon
 * @see Polygon#getLargestPoint
 */
export function getLargestPoint(sides) {
    let largest = 0;
    for (let i = 0; i < sides.length; i ++) {
        largest = Math.max(largest, sides[i].x, sides[i].y);
    }
    return largest;
}

class Polygon {
    /**
     * Create a base Polygon
     * @param {Array<{x:Number,y:Number}} sides The raw polygon shape in an array of objects of (X, Y)
     * @returns {Polygon}
     */
    constructor(sides) {
        this._sides = sides;
        this.sides = sides;
    }

    /**
     * Get the transformed polygon
     * @param {Number} x The new x-value of the polygon
     * @param {Number} y The new y-value of the polygon
     * @param {Number} size The new size of the polygon
     * @param {Number} angle The angle (in radians) that the base polygon will be rotated
     * @returns {Array<{x:Number,y:Number}>} The transformed polygon
     */
    getTransformed(x, y, size, angle) {
        const sides = [];
        let cos = Math.cos(angle),
            sin = Math.sin(angle);

        for (let i = 0; i < this._sides.length; i++) {
            sides[i] = {
                x: x + (this._sides[i].x * cos - this._sides[i].y * sin) * size,
                y: y + (this._sides[i].y * cos + this._sides[i].x * sin) * size
            };
        }

        return sides;
    }

    /**
     * Set the transformed polygon
     * @param {Number} x The new x-value of the polygon
     * @param {Number} y The new y-value of the polygon
     * @param {Number} size The new size of the polygon
     * @param {Number} angle The angle (in radians) that the base polygon will be rotated
     * @returns {Polygon}
     * @see Polygon#getTransformed
     */
    setTransformed(x, y, size, angle) {
        this.sides = this.getTransformed(x, y, size, angle);
        return this;
    }

    /**
     * Reset the polygon to its most basic form
     * @returns {Polygon}
     */
    reset() {
        this.sides = this._sides;
        return this;
    }

    /**
     * Determines if the polygon intersects with another polygon
     * @param {Polygon | Array<{x: Number, y: Number}} other The other polygon or array of points to check
     * @returns {Boolean} Whether or not the polygons intersect
     */
    intersects(other) {
        if (other.isPolygon === true) {
            other = other.sides;
        }

        return intersectTwoPolygons(this.sides, other);
    }

    /**
     * Get the largest point in the polygon
     * @returns {Number} The largest point in the polygon
     */
    getLargestPoint() {
        let largest = 0;
        for (let i = 0; i < this._sides.length; i ++) {
            largest = Math.max(largest, this._sides[i].x, this._sides[i].y);
        }
        return largest;
    }
}

/**
 * Hitboxes
 * @type {Map<Number | String, Polygon>}
 * @see Polygon
 */
const hitboxes = new Map();

export function createHitbox(id, sides) {
    hitboxes.set(id, new Polygon(sides));
}

export function getHitbox(id, x, y, size, angle) {
    return hitboxes.get(id).getTransformed(x, y, size, angle);
}

export function deleteHitbox(id) {
    hitboxes.delete(id);
}

// We use an octogon for circles because it's the most efficient, and still has a good enough shape
const octogonPath = [];
for (let i = 0; i < 8; i++) {
    octogonPath.push({
        x: Math.cos(Math.PI * 2 * i / 8),
        y: Math.sin(Math.PI * 2 * i / 8)
    });
}

export const octogon = new Polygon(octogonPath);

export function getOctagonalHitbox(x, y, radius) {
    return octogon.getTransformed(x, y, radius, 0);
}

export function getBiggestWidth(sides) {
    let largest = 0;
    for (let i = 0; i < sides.length; i ++) {
        largest = Math.max(largest, Math.abs(sides[i].x));
    }
    return largest;
}

export function getBiggestHeight(sides) {
    let largest = 0;
    for (let i = 0; i < sides.length; i ++) {
        largest = Math.max(largest, Math.abs(sides[i].y));
    }
    return largest;
}

export function pointArrayToObjectArray(points) {
    const sides = [];
    for (let i = 0; i < points.length; i++) {
        sides.push({
            x: points[i][0],
            y: points[i][1]
        });
    }
    return sides;
}