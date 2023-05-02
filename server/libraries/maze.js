export class MazeRemap {
    constructor(maze) {
        this._ref = JSON.parse(JSON.stringify(maze));
        this.maze = maze;
        this.blocks = [];
    }
    get width() {
        return this.maze.length;
    }
    get height() {
        return this.maze.length === 0 ? 0 : this.maze[0].length;
    }
    findBiggest() {
        let best = {
            x: 0,
            y: 0,
            size: 0,
        };
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (!this.maze[x][y]) {
                    continue;
                }
                let size = 1;
                loop: while (x + size < this.width && y + size < this.height) {
                    for (let i = 0; i <= size; i++) {
                        if (!this.maze[x + size][y + i] || !this.maze[x + i][y + size]) {
                            break loop;
                        }
                    }
                    size++;
                }
                if (size > best.size) {
                    best = {
                        x: x,
                        y: y,
                        size: size,
                    };
                }
            }
        }
        for (let x = 0; x < best.size; x++) {
            for (let y = 0; y < best.size; y++) {
                this.maze[best.x + x][best.y + y] = false;
            }
        }
        return {
            x: best.x,
            y: best.y,
            size: best.size,
            width: 1,
            height: 1,
        };
    }
    lookup(x, y, size, width, height) {
        return this.blocks.find(
            (cell) => cell.x === x && cell.y === y && cell.size === size && cell.width === width && cell.height === height);
    }
    remove(id) {
        this.blocks = this.blocks.filter((entry) => entry.id != id);
        return this.blocks;
    }
    remap() {
        this.blocks = [];
        let biggest;
        while (
            (biggest = this.findBiggest()) && !this.blocks.includes(biggest) && biggest.size > 0) {
            this.blocks.push(biggest);
        }
        this.blocks.forEach((block, i) => {
            block.id = i;
        });
        let i = 0;
        while (i < this.blocks.length) {
            const my = this.blocks[i];
            if (Math.random() > 0.5) {
                let width = 1;
                for (let x = my.x + my.size; x <= this.width - my.size; x += my.size) {
                    const other = this.lookup(x, my.y, my.size, my.width, my.height);
                    if (!other) {
                        break;
                    }
                    this.remove(other.id);
                    width++;
                }
                my.width = width;
                let height = 1;
                for (let y = my.y + my.size; y <= this.height - my.size; y += my.size) {
                    const other = this.lookup(my.x, y, my.size, my.width, my.height);
                    if (!other) {
                        break;
                    }
                    this.remove(other.id);
                    height++;
                }
                my.height = height;
            } else {
                let height = 1;
                for (let y = my.y + my.size; y <= this.height - my.size; y += my.size) {
                    const other = this.lookup(my.x, y, my.size, my.width, my.height);
                    if (!other) {
                        break;
                    }
                    this.remove(other.id);
                    height++;
                }
                my.height = height;
                let width = 1;
                for (let x = my.x + my.size; x <= this.width - my.size; x += my.size) {
                    const other = this.lookup(x, my.y, my.size, my.width, my.height);
                    if (!other) {
                        break;
                    }
                    this.remove(other.id);
                    width++;
                }
                my.width = width;
            }
            i++;
        }
        return this.blocks;
    }
}

export class MazeGenerator {
    constructor(options = {}) {
        if (options.width == null) {
            options.width = 32;
        } if (!Number.isFinite(options.width) || options.width < 10 || options.width !== options.width | 0) {
            throw new RangeError("If specified, options.width must be a finite integer greater than 10! (Defaults to 32)");
        }
        if (options.height == null) {
            options.height = 32;
        } if (!Number.isFinite(options.height) || options.height < 10 || options.height !== options.height | 0) {
            throw new RangeError("If specified, options.height must be a finite integer greater than 10! (Defaults to 32)");
        }
        if (options.clumpSize == null) {
            options.clumpSize = [1, 2];
        } else if (!Array.isArray(options.clumpSize) || options.clumpSize.length !== 2 || options.clumpSize.some(thing => thing < 1 || thing !== thing | 0)) {
            throw new RangeError("If specified, options.clumpSize must be an array of two positive integers! (Defaults to [1, 2])");
        }
        if (options.lineThreshold == null) {
            options.lineThreshold = 1;
        } else if (Array.isArray(options.lineThreshold)) {
            if (options.lineThreshold.some(thing => thing < 0 || thing !== thing | 0)) {
                throw new RangeError("If specified as an array, options.lineThreshold must be an array of two zero or positive integers! (Defaults to 1)");
            }
        } else if (!Number.isFinite(options.lineThreshold) || options.lineThreshold < 0 || options.lineThreshold !== options.lineThreshold | 0) {
            throw new RangeError("If specified, options.lineThreshold must be a finite positive or zero integer! (Defaults to 1)");
        }
        if (options.soloThreshold == null) {
            options.soloThreshold = .95;
        } else if (options.soloThreshold !== Math.min(1, Math.max(.5, options.soloThreshold))) {
            throw new RangeError("If specified, options.soloThreshold must be a decimal from .5 to 1! (Defaults to .95)");
        }
        if (options.loopCap == null) {
            options.loopCap = 10000000000;
        } if (!Number.isFinite(options.loopCap) || options.loopCap < 1000000 || options.loopCap !== options.loopCap | 0) {
            throw new RangeError("If specified, options.loopCap must be a finite integer greater than 999999! (Defaults to 10000000)");
        }
        options.cardinals = !!options.cardinals;
        options.openMiddle = !!options.openMiddle;
        this.options = options;
        this.eroded = 0;
        this.maze = options.mapString != null ? this.parseMapString(options.mapString) : JSON.parse(JSON.stringify(Array(options.width || 32).fill(Array(options.height || 32).fill(false))));
        if (options.mapString == null) {
            this.clearRing(0);
            this.clearRing(5);
            let cx = (this.width / 2) | 0,
                cy = (this.height / 2) | 0,
                cs = (this.width / 5) | 0;
            if (cs % 2) {
                cs++;
            }
            for (let i = cx - cs / 2; i < cx + cs / 2; i++) {
                for (let j = cy - cs / 2; j < cy + cs / 2; j++) {
                    this.maze[i | 0][j | 0] = false;
                }
            }
        }
        this.run(this.maze.flat().length * 0.325);
    }
    get width() {
        return this.maze.length;
    }
    get height() {
        return this.maze[0].length;
    }
    parseMapString(mapString) {
        const map = mapString.trim().split("\n").map((r) => r.trim().split("").map((r) => (r === "#" ? 1 : r === "@")));
        return Array(map[0].length).fill().map((_, y) => Array(map.length).fill().map((_, x) => map[x][y]));
    }
    randomPosition(typeSearch) {
        let x = Math.floor(Math.random() * this.width),
            y = Math.floor(Math.random() * this.height);
        while (this.maze[x][y] != typeSearch) {
            x = Math.floor(Math.random() * this.width);
            y = Math.floor(Math.random() * this.height);
        }
        return [x, y];
    }
    clearRing(dist) {
        for (let i = dist; i < this.width - dist; i++) {
            this.maze[i][dist] = false;
            this.maze[i][this.height - 1 - dist] = false;
        }
        for (let i = dist; i < this.height - dist; i++) {
            this.maze[dist][i] = false;
            this.maze[this.width - 1 - dist][i] = false;
        }
    }
    getDistance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }
    run(amount) {
        let clumps = [];
        for (let i = 0; i < amount * 0.04; i++) {
            let size = this.options.clumpSize[0] + Math.round(Math.random() * (this.options.clumpSize[1] - this.options.clumpSize[0])),//1 + Math.round(Math.random()),
                x, y, i = 100;
            do {
                [x, y] = this.randomPosition(0);
            } while (clumps.some((clump) => clump.id !== i && this.getDistance(clump, {
                    x,
                    y,
                }) < clump.size + size + i / 5) && i--);
            clumps.push({
                x,
                y,
                size,
                id: i,
            });
        }
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (clumps.some((clump) => this.getDistance(clump, {
                        x,
                        y,
                    }) < clump.size)) {
                    this.maze[x][y] = true;
                    this.eroded ++;
                }
            }
        }
        let loops = 0;
        mainAddingLoop: while (this.maze.flat().filter((cell) => !!cell).length < amount && loops ++ < this.options.loopCap) {
            this.disposeOfBadAreas();
            if (this.maze.flat().filter((cell) => !!cell).length >= amount) {
                break mainAddingLoop;
            }
            xAddingLoop: for (let x = 1; x < this.width - 1; x++) {
                yAddingLoop: for (let y = 1; y < this.height - 1; y++) {
                    const adjacentWalls = [
                        this.maze[x + 1][y],
                        this.maze[x - 1][y],
                        this.maze[x][y + 1],
                        this.maze[x][y - 1]
                    ].concat(this.options.cardinals ? [] : [
                        this.maze[x + 1][y + 1],
                        this.maze[x - 1][y + 1],
                        this.maze[x + 1][y - 1],
                        this.maze[x - 1][y - 1]
                    ]).filter((pos) => !!pos).length;
                    if (Math.random() > .45) {
                        if (this.options.lineThreshold instanceof Array && adjacentWalls >= this.options.lineThreshold[0] && adjacentWalls <= this.options.lineThreshold[1]) {
                            this.maze[x][y] = true;
                            this.eroded ++;
                        } else if (adjacentWalls === this.options.lineThreshold) {
                            this.maze[x][y] = true;
                            this.eroded ++;
                        }
                    } else if (adjacentWalls === 0 && Math.random() > this.options.soloThreshold) {
                        this.maze[x][y] = true;
                        this.eroded ++;
                    }
                    if (this.maze.flat().filter((cell) => !!cell).length >= amount) {
                        break mainAddingLoop;
                    }
                }
                if (this.maze.flat().filter((cell) => !!cell).length >= amount) {
                    break xAddingLoop;
                }
            }
        }
        this.disposeOfBadAreas();
        this.test = [this.maze.flat().filter((cell) => cell === true).length, amount];
        this.isFail = this.maze.flat().filter((cell) => cell === true).length !== amount;
    }
    disposeOfBadAreas() {
        this.clearRing(0);
        if (this.options.openMiddle) {
            let cx = (this.width / 2) | 0,
                cy = (this.height / 2) | 0,
                cs = (this.width / 5) | 0;
            if (cs % 2) {
                cs++;
            }
            for (let i = cx - cs / 2; i < cx + cs / 2; i++) {
                for (let j = cy - cs / 2; j < cy + cs / 2; j++) {
                    this.maze[i | 0][j | 0] = false;
                    this.eroded --;
                }
            }
        }
        for (let x = 1; x < this.width - 1; x++) {
            for (let y = 1; y < this.height - 1; y++) {
                if (this.maze[x][y] === false && [
                        this.maze[x + 1][y],
                        this.maze[x - 1][y],
                        this.maze[x][y + 1],
                        this.maze[x][y - 1],
                    ].filter((pos) => !!pos).length > 0) {
                    let floodResult = this.floodFill(x, y, false);
                    if (floodResult.fill) {
                        floodResult.positions.forEach((position) => {
                            this.maze[position.x][position.y] = true;
                            this.eroded ++;
                        });
                    }
                }
            }
        }
    }
    floodFill(x, y, type = 1) {
        let visited = [];
        let isShit = true;
        let visitNeighbors = (x, y) => {
            if (visited.some((cell) => cell.x === x && cell.y === y)) {
                return;
            }
            visited.push({
                x,
                y,
            });
            if (x + 1 >= this.width || y + 1 >= this.height || x - 1 < 0 || y - 1 < 0) {
                isShit = false;
                return;
            }
            if (!!this.maze[x + 1][y] === type) {
                visitNeighbors(x + 1, y);
            }
            if (!!this.maze[x - 1][y] === type) {
                visitNeighbors(x - 1, y);
            }
            if (!!this.maze[x][y + 1] === type) {
                visitNeighbors(x, y + 1);
            }
            if (!!this.maze[x][y - 1] === type) {
                visitNeighbors(x, y - 1);
            }
        };
        visitNeighbors(x, y);
        return {
            fill: isShit,
            positions: visited,
        };
    }
}