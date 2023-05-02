import { getDistance } from "../libraries/util.js";
import { ENTITY_TYPES } from "./entities.js";
import { Game } from "../setup/game.js";
import * as polyCollide from "../libraries/Polygon.js";

function ballCollide(instance, other) {

    if (
        (instance.player && instance.player.id === other.id) ||
        (other.player && other.player.id === instance.id) ||
        (instance.player && instance.player === other.player) ||
        !validateCollision(instance, other)
    ) {
        return;
    }

    const angle = Math.atan2(other.y - instance.y, other.x - instance.x);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const instanceStrength = other.mass / instance.mass / 1.3;
    const otherStrength = instance.mass / other.mass / 1.3;
    instance.velocity.x -= cos * instanceStrength;
    instance.velocity.y -= sin * instanceStrength;
    other.velocity.x += cos * otherStrength;
    other.velocity.y += sin * otherStrength;

    let doDamage = true;
    if (
        (instance.type === other.type && instance.type === ENTITY_TYPES.MOB)
    ) {
        doDamage = false;
    }

    if (doDamage) {
        // Do damage
        instance.health.damage(other.damage);
        other.health.damage(instance.damage);

        instance.aggro(other);
        other.aggro(instance);
    }
}

function firmCollide(wall, other) {
    let point
    if (other.type === ENTITY_TYPES.PETAL || (point = validateCollision(wall, other), !point)) {
        return;
    }
    
    let /*atanWall = Math.atan2(wall.y - point.y, wall.x - point.x),*/
        atanPoint = Math.atan2(other.y - point.y, other.x - point.x);

    /*if (Math.abs(atanWall - atanPoint) > Math.PI / 2) {
        other.velocity.x += Math.cos(atanPoint);
        other.velocity.y += Math.sin(atanPoint);
        return;
    }

    other.velocity.x += Math.cos(atanWall);
    other.velocity.y += Math.sin(atanWall);*/

    other.velocity.x += Math.cos(atanPoint) * .5;
    other.velocity.y += Math.sin(atanPoint) * .5;
}

function wallCollide(wall, other) {
    if (other.type === ENTITY_TYPES.PETAL) {
        return;
    }

    if (other.type === ENTITY_TYPES.MOB) {
        let atan = Math.atan2(other.y - wall.y, other.x - wall.x);
        other.acceleration.x = Math.cos(atan);
        other.acceleration.y = Math.sin(atan);
    }

    let width = wall.width * wall.size,
        height = wall.height * wall.size,

        left = wall.x - width,
        right = wall.x + width,
        top = wall.y - height,
        bottom = wall.y + height,
        majorX = other.x + other.size,
        minorX = other.x - other.size,
        majorY = other.y + other.size,
        minorY = other.y - other.size,

        xDist = Math.min(majorX - left, right - minorX),
        yDist = Math.min(majorY - top, bottom - minorY);

    if (xDist < yDist) {
        if (other.x < wall.x) {
            other.x -= xDist;
            if (other.velocity.x > 0) {
                other.velocity.x = 0;
            }
        } else {
            other.x += xDist;
            if (other.velocity.x < 0) {
                other.velocity.x = 0;
            }
        }
    } else {
        if (other.y < wall.y) {
            other.y -= yDist;
            if (other.velocity.y > 0) {
                other.velocity.y = 0;
            }
        } else {
            other.y += yDist;
            if (other.velocity.y < 0) {
                other.velocity.y = 0;
            }
        }
    }
}

/**
 * A more complex collision check, the grid returns the AABB overlaps, not specific hitbox collisions
 * @param {Entity} instance The first entity in the collision
 * @param {Entity} other The second entity in the collision
 * @returns {Boolean} True or false
 */
function validateCollision(instance, other) {
    if (instance.hitbox === undefined && other.hitbox == undefined) {
        return getDistance(instance, other) < instance.size + other.size;
    }

    // If only one has a hitbox, generate a "circle" hitbox
    const instanceHitbox = instance.hitbox ?? polyCollide.getOctagonalHitbox(instance.x, instance.y, instance.size),
        otherHitbox = other.hitbox ?? polyCollide.getOctagonalHitbox(other.x, other.y, other.size);

    return polyCollide.intersectTwoPolygons(instanceHitbox, otherHitbox);
}

export default function collide(instance, other) {
    if (instance.collisionArray.has(other.id) || other.collisionArray.has(instance.id)) return;

    instance.collisionArray.set(other.id, other);
    other.collisionArray.set(instance.id, instance);

    switch (true) {
        case instance.type === ENTITY_TYPES.WALL || other.type === ENTITY_TYPES.WALL:
            if (instance.type === other.type) {
                return;
            }
            wallCollide(
                instance.type === ENTITY_TYPES.WALL ? instance : other,
                instance.type === ENTITY_TYPES.WALL ? other : instance
            );
            break;
        case instance.type === ENTITY_TYPES.HARDCODED || other.type === ENTITY_TYPES.HARDCODED:
            if (instance.type === other.type) {
                return;
            }
            firmCollide(
                instance.type === ENTITY_TYPES.HARDCODED ? instance : other,
                instance.type === ENTITY_TYPES.HARDCODED ? other : instance
            );
            break;
        default:
            ballCollide(instance, other);
    }
}