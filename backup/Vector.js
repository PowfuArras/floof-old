class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    null() {
        this.x = 0;
        this.y = 0;
    }
    update() {
        this.len = this.length;
        this.dir = this.direction;
    }
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    get direction() {
        return Math.atan2(this.y, this.x);
    }
}

export default Vector;