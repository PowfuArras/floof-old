export class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    null() {
        this.x = 0;
        this.y = 0;
    }

    normalize() {
        let length = this.length;
        if (length) {
            this.x /= length;
            this.y /= length;
        }
    }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;

        return this;
    }

    divide(scalar) {
        this.x /= scalar;
        this.y /= scalar;

        return this;
    }
    
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;

        return this;
    }

    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;

        return this;
    }

    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    
    get direction() {
        return Math.atan2(this.y, this.x);
    }
}