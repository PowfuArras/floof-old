Map.prototype.find = function find(callback) {
    for (let [key, value] of this) {
        if (callback(value, key)) {
            return value;
        }
    }
    return undefined;
}

Map.prototype.filter = function filter(callback) {
    const output = new Map();
    this.forEach((value, key) => {
        if (callback(value, key)) {
            output.set(key, value);
        }
    });
    return output;
}

Map.prototype.filterSelf = function filterSelf(callback) {
    this.forEach((value, key) => {
        if (!callback(value, key)) {
            this.delete(key);
        }
    });
}

Map.prototype.filterToArray = function filterToArray(callback) {
    const output = [];
    this.forEach((value, key) => {
        if (callback(value, key)) {
            output.push(value);
        }
    });
    return output;
}

Map.prototype.map = function map(callback) {
    const output = new Map();
    this.forEach((value, key) => {
        output.set(key, callback(value, key));
    });
    return output;
}

Map.prototype.mapToArray = function mapToArray(callback) {
    const output = [];
    this.forEach((value, key) => {
        output.push(callback(value, key));
    });
    return output;
}

Map.prototype.some = function some(callback) {
    for (let [key, value] of this) {
        if (callback(value, key)) {
            return true;
        }
    }
    return false;
}

export default Map;