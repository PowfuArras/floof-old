class Health {
    constructor(amount) {
        this.max = amount;
        this.amount = amount;
        this.lastHit = 0;
        this.resist = .6;
        this.regen = 1 / 250;
    }
    set(amount) {
        let save = this.amount / this.max;
        this.max = amount;
        this.amount = amount * save;
    }
    regenerate() {
        if (Date.now() - this.lastHit <= 15000) {
            return;
        }

        this.amount = Math.min(this.max, this.amount + this.max * this.regen);
    }
    forceRegenerate(amount) {
        this.amount = Math.min(this.max, this.amount + this.max * amount);
    }
    damage(damage) {
        this.amount = Math.max(0, this.amount - (damage * this.resist));
        this.lastHit = Date.now();
    }
    check() {
        return this.amount > 0;
    }
    get percent() {
        return Math.round(Math.min(1, Math.max(0, this.amount / this.max)) * 100);
    }
}

export default Health;