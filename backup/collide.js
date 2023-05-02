import { getDistance } from "./utils.js";

function ballCollide(instance, other) {
    let dist = getDistance(instance.x, instance.y, other.x, other.y),
        angle = Math.atan2(other.y - instance.y, other.x - instance.x);

    if (dist < instance.size + other.size) {
        let overlap = instance.size + other.size - dist,
            mult = overlap / 20,
            cos = Math.cos(angle) * mult,
            sin = Math.sin(angle) * mult;
        instance.velocity.x -= cos;
        instance.velocity.y -= sin;
        other.velocity.x += cos;
        other.velocity.y += sin;
    }
}

function wallCollide(wall, other) {
    if (other.type === 2) {
        other.range = 0;
        return;
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

function collide(instance, other) {
    if (instance.collisionArray.has(other.id) || other.collisionArray.has(instance.id)) {
        return;
    }

    instance.collisionArray.set(other.id, other);
    other.collisionArray.set(instance.id, instance);

    if (instance.type === 1 || other.type === 1) {
        let wall = instance.type === 1 ? instance : other,
            entity = instance.type === 1 ? other : instance;

        if (entity.type === 1) {
            return;
        }
        
        wallCollide(wall, entity);
        return;
    }

    ballCollide(instance, other);
}

export default collide;