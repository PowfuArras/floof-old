void !(function () {

    let harcodedPaths = [];

    let curtainAnimationTick = 0,
        curtainAnimationDestination = 1;
    const canvasElement = document.getElementById("canvas");
    /**
     * @type { CanvasRenderingContext2D }
     */
    const ctx = canvasElement.getContext("2d", { alpha: false });
    const color = [
        "#1EA761", // 0: Garden Background
        "#7EEF6D", // 1: Common 
        "#FFE65D", // 2: uncommon
        "#455FCF", // 3: rare
        "#7633CB", // 4: epic
        "#C13328", // 5: legendary
        "#1ED2CB", // 6: mythic
        "#FFE763", // 7: flower color
        "#04190E", // 8: dark
        "#BB5555", // 9: ui exit
        "#AAAAAA", // 10: ui settings
        "#FFFFFF", // 11: text color
        "#FFFFFF", // 12: flower eye color
        "#75DD34", // 13: health bar
        "#EB4034", // 14: Ladybug
        "#000000", // 15: dark tint + grid
        "#FFE763", // 16: BEE
        "#A8711E", // 17: ANT HOLE
        "#69462E", // 18: ANT HOLE BORDER
        "#1A9658", // 19: GARDEN BORDER
        "#DDD17B", // 20: desert background
        "#C7BB6F", // 21: desert border
        "#4E79B0", // 22: ocean background
        "#476FA3", // 23: ocean border
        "#555555", // 24: ants
        "#9fa0a0", // 25: wings of ants
        "#2a2a2a", // 26: Pincer
    ];

    const images = (function () {
        const cache = {};
        for (const source of [
            ["./resources/tiles/grass.svg", "grass"],
            ["./resources/tiles/ant.svg", "ant"],
            ["./resources/tiles/dirt.svg", "dirt"],
            ["./resources/tiles/desert.svg", "desert"],
            ["./resources/tiles/ocean.svg", "ocean"],
            ["./resources/tiles/water.svg", "water"]
        ]) {
            const image = new Image();
            image.src = source[0];
            image.ready = true;
            cache[source[1]] = image;
            image.addEventListener("load", () => image.ready = true);
        }
        return cache;
    })();

    const ENTITY_TYPES = {
        GENERIC: 0,
        PLAYER: 1,
        PETAL: 2,
        MOB: 3,
        PROJECTILE: 4,
        DROP: 5,
        WALL: 6
    };

    const WORLD_SCENE = {
        GRASS: 0,
        ANT: 1,
        DESERT: 2,
        OCEAN: 3
    };

    const PETAL_INDEXES = {
        0: "Basic",
        1: "Light",
        2: "Faster"
    };

    const RARITIES = {
        0: {
            name: "Common",
            color: color[1],
            index: 0
        },
        1: {
            name: "Uncommon",
            color: color[2],
            index: 1
        },
        2: {
            name: "Rare",
            color: color[3],
            index: 2
        },
        3: {
            name: "Epic",
            color: color[4],
            index: 3
        },
        4: {
            name: "Legendary",
            color: color[5],
            index: 4
        },
        5: {
            name: "Mythic",
            color: color[6],
            index: 5
        }
    };

    function lerp(to, from, x) {
        return to + x * (from - to);
    }

    function lerpAngle(to, from, x) {
        return Math.atan2(lerp(Math.sin(to), Math.sin(from), x), lerp(Math.cos(to), Math.cos(from), x));
    }

    class Controller {
        constructor() {    // 1       2      4      8      16     32
            this.commands = [false, false, false, false, false, false];
            this.mouse = { x: 0, y: 0 };
            this.target = { x: 0, y: 0 };
            this.elements = new Map();
            canvasElement.addEventListener("mousedown", event => this.mouseEvent(event, true), false);
            canvasElement.addEventListener("mouseup", event => this.mouseEvent(event, false), false);
            canvasElement.addEventListener("mousemove", event => this.mouseMoveEvent(event), false);
            document.addEventListener("keydown", event => this.keyEvent(event, true), false);
            document.addEventListener("keyup", event => this.keyEvent(event, false), false);
        }

        keyEvent(event, state) {
            switch (event.keyCode) {
                case 16: // SHIFT
                    this.commands[5] = state;
                    break;
                case 32: // SPACE
                    this.commands[4] = state;
                    break;
                case 38:
                case 87: // W
                    this.commands[0] = state;
                    break;
                case 40:
                case 83: // S
                    this.commands[1] = state;
                    break;
                case 37:
                case 65: // A
                    this.commands[2] = state;
                    break;
                case 39:
                case 68: // D
                    this.commands[3] = state;
                    break;
            }
        }

        mouseMoveEvent(event) {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        }

        mouseEvent(event, state) {
            if (event.button === 0) {
                this.commands[4] = state;
                if (state === true) {
                    this.mouseMoveEvent(event);
                    this.getElements().forEach(id => this.elements.get(id).click());
                }
            } else if (event.button === 2) this.commands[5] = state;
        }

        update() {
            let flags = 0,
                and = 1;
            for (let i = 0; i < this.commands.length; i++) {
                if (this.commands[i]) {
                    flags += and;
                }
                and *= 2;
            }
            return flags;
        }

        clearElements() {
            this.elements.clear();
        }

        addElement(id, x1, y1, x2, y2, click = () => {}) {
            this.elements.set(id, { x1, y1, x2, y2, click });
        }

        getElements() {
            let output = [];
            for (const [id, { x1, y1, x2, y2 }] of this.elements) {
                if (this.mouse.x >= x1 && this.mouse.x <= x2 && this.mouse.y >= y1 && this.mouse.y <= y2) {
                    output.push(id);
                }
            }
            return output;
        }
    }

    class Writer {
        constructor(littleEndian) {
            this.writer = true;
            this.tmpBuf = new DataView(new ArrayBuffer(8));
            this._e = littleEndian;
            this.reset();
            return this;
        }

        reset(littleEndian = this._e) {
            this._e = littleEndian;
            this._b = [];
            this._o = 0;
        }

        setUint8(a) {
            if (a >= 0 && a < 256) this._b.push(a);
            return this;
        }

        setInt8(a) {
            if (a >= -128 && a < 128) this._b.push(a);
            return this;
        }

        setUint16(a) {
            this.tmpBuf.setUint16(0, a, this._e);
            this._move(2);
            return this;
        }

        setInt16(a) {
            this.tmpBuf.setInt16(0, a, this._e);
            this._move(2);
            return this;
        }

        setUint32(a) {
            this.tmpBuf.setUint32(0, a, this._e);
            this._move(4);
            return this;
        }

        setInt32(a) {
            this.tmpBuf.setInt32(0, a, this._e);
            this._move(4);
            return this;
        }

        setFloat32(a) {
            this.tmpBuf.setFloat32(0, a, this._e);
            this._move(4);
            return this;
        }

        setFloat64(a) {
            this.tmpBuf.setFloat64(0, a, this._e);
            this._move(8);
            return this;
        }

        _move(b) {
            for (let i = 0; i < b; i++) this._b.push(this.tmpBuf.getUint8(i));
        }

        setStringUTF8(s) {
            const bytesStr = unescape(encodeURIComponent(s));
            for (let i = 0, l = bytesStr.length; i < l; i++) this._b.push(bytesStr.charCodeAt(i));
            this._b.push(0);
            return this;
        }

        build() {
            return new Uint8Array(this._b);
        }
    }

    class Reader {
        constructor(view, offset, littleEndian) {
            this.reader = true;
            this._e = littleEndian;
            if (view) this.repurpose(view, offset);
        }

        repurpose(view, offset) {
            this.view = view;
            this._o = offset || 0;
        }

        getUint8() {
            return this.view.getUint8(this._o++, this._e);
        }

        getInt8() {
            return this.view.getInt8(this._o++, this._e);
        }

        getUint16() {
            return this.view.getUint16((this._o += 2) - 2, this._e);
        }

        getInt16() {
            return this.view.getInt16((this._o += 2) - 2, this._e);
        }

        getUint32() {
            return this.view.getUint32((this._o += 4) - 4, this._e);
        }

        getInt32() {
            return this.view.getInt32((this._o += 4) - 4, this._e);
        }

        getFloat32() {
            return this.view.getFloat32((this._o += 4) - 4, this._e);
        }

        getFloat64() {
            return this.view.getFloat64((this._o += 8) - 8, this._e);
        }

        getStringUTF8() {
            let s = '';
            let b;
            while ((b = this.view.getUint8(this._o++)) !== 0) s += String.fromCharCode(b);
            return decodeURIComponent(escape(s));
        }
    }

    class World {
        constructor() {
            this.width = 0;
            this.height = 0;
            this.playerID = -1;
            /**
             * @type { Map<number, { id: number, type: number, x: number, y: number, rx: number, ry: number, size: number, rsize: number, rotation: number, rrotation: number }> }
             */
            this.entities = new Map();
            this.player = null;
            /**
             * @type { { index: Number, alive: Boolean, ratio: Number }[] }
             */
            this.petals = [];
            this.scene = 0;
            this.camera = {
                x: 0,
                y: 0,
                fov: 1000,
                getRatio() {
                    const fov = this.fov;
                    return Math.max(innerWidth / fov, innerHeight / fov / 1080 * 1920);
                }
            };
        }
        update(playerID, width, height, scene) {
            this.width = width;
            this.height = height;
            this.scene = scene;
            if (playerID !== -1) {
                this.playerID = playerID;
                this.player = this.entities.get(playerID);
            }
        }
        filterEntities(validIDs) {
            for (const id of this.entities.keys()) {
                if (validIDs.indexOf(id) === -1) {
                    this.entities.delete(id);
                }
            }
        }
    }

    class Socket {
        constructor() {
            this.socket = null;
            this.inbound = 0;
            this.outbound = 0;
            this.latency = 0;

            this.world = new World();
        }

        connect(url) {
            const socket = new WebSocket(url);
            socket.binaryType = "arraybuffer";
            socket.addEventListener("open", () => this.openEvent());
            socket.addEventListener("close", () => this.closeEvent());
            socket.addEventListener("message", event => this.messageEvent(event));

            this.url = url;
            this.socket = socket;
        }

        openEvent() {
            console.log(`Connected to ${this.url}`);
            this.talk({ type: 0 });
            this.talk({ type: 1 });
        }

        closeEvent() {
            console.log(`Disconnected from ${this.url}`);
            curtainAnimationDestination = 0;
        }

        talk(data) {
            if (this.socket?.readyState !== 1) return;
            const writer = new Writer(true);
            writer.setUint8(data.type);
            switch (data.type) {
                case 0: {
                    writer.setFloat64(Date.now());
                }; break;
                case 1: // Empty, flag
                    break;
                case 2: // Inputs
                    writer.setUint8(data.inputs);
                    writer.setFloat32(data.mouseAngle);
                    if (data.inputs & 64) {
                        writer.setFloat32(data.intensity);
                    }
                    break;
                default: {
                    throw new Error(`Unknown outgoing packet type "${data.type}"`);
                };
            }

            const build = writer.build();
            this.outbound += build.byteLength;
            this.socket.send(build.buffer);
        }

        messageEvent({ data }) {
            const view = new DataView(data);
            this.inbound += view.byteLength;

            const reader = new Reader(view, 0, true);
            const type = reader.getUint8();
            switch (type) {
                case 0: {
                    this.latency = reader.getFloat64();
                    console.log(`Pong ${this.latency}ms`);

                    setTimeout(() => this.talk({ type: 0 }), 1000);
                }; break;
                case 1: {
                    let playerID = reader.getUint32(),
                        entityAmount = reader.getUint32(),
                        entityIDs = [];
                    for (let i = 0; i < entityAmount; i++) {
                        let id = reader.getUint32(),
                            type = reader.getUint8(),
                            x = reader.getFloat32(),
                            y = reader.getFloat32(),
                            size = reader.getFloat32();

                        entityIDs.push(id);

                        let entity = this.world.entities.get(id);
                        if (entity === undefined) {
                            entity = {
                                id,
                                type,
                                x,
                                y,
                                rx: x,
                                ry: y,
                                size: 1,
                                rsize: size,
                                rotation: 0,
                                rrotation: 0,
                                health: {
                                    draws: false,
                                    real: 1,
                                    display: 1,
                                    backbar: 1,
                                    backbarTicker: 50,
                                    alpha: 0
                                }
                            };
                        } else {
                            entity.rx = x;
                            entity.ry = y;
                            entity.rsize = size;
                        }

                        switch (type) {
                            case ENTITY_TYPES.PLAYER:
                                entity.rrotation = reader.getFloat32();
                                entity.health.real = reader.getUint8() / 255;
                                entity.health.draws = true;
                                break;
                            case ENTITY_TYPES.PETAL:
                                entity.index = reader.getUint8();
                                entity.rarity = RARITIES[reader.getUint8()];
                                break;
                            case ENTITY_TYPES.MOB:
                                entity.index = reader.getUint8();
                                entity.rrotation = reader.getFloat32();
                                entity.health.real = reader.getUint8() / 255;
                                entity.health.draws = true;
                                entity.rarity = RARITIES[reader.getUint8()];
                                break;
                            case ENTITY_TYPES.WALL:
                                entity.width = reader.getFloat32();
                                entity.height = reader.getFloat32();
                                break;
                        }

                        this.world.entities.set(id, entity);
                    }

                    // Get petals if our id is not -1
                    if (playerID !== -1) {
                        this.world.camera.fov = reader.getFloat32();
                        let newPetals = [];
                        const petalAmount = reader.getUint8();
                        for (let i = 0; i < petalAmount; i++) {
                            let index = reader.getUint8(),
                                rarity = reader.getUint8(),
                                alive = reader.getUint8() === 0,
                                ratio = reader.getFloat32(),
                                old = this.world.petals.find((p, j) => j === i && p.alive === alive && p.index === index && p.rarity === RARITIES[rarity]);

                            newPetals.push({
                                index,
                                rarity: RARITIES[rarity],
                                alive: alive,
                                ratio: old ? old.ratio : ratio,
                                rratio: ratio
                            });
                        }

                        this.world.petals = newPetals;
                    }

                    this.world.filterEntities(entityIDs);
                    this.world.update(playerID, this.world.width, this.world.height, this.world.scene);
                } break;
                case 2: {
                    const walls = JSON.parse(reader.getStringUTF8());
                    console.log("New walls!", walls.length);
                    harcodedPaths = walls;
                } break;
                case 3:
                    this.world.update(-1, reader.getFloat32(), reader.getFloat32(), reader.getUint8());
                    break;
                default: {
                    throw new Error(`Unknown incoming packet type "${data.type}"`);
                };
            }
        }
    }

    const controller = new Controller();
    const socket = new Socket();

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight//;

        ctx.textBaseline = "middle";
    }

    window.addEventListener("resize", resize);
    resize();

    const mixColors = (function () {
        const cache = {};
        return function (primary, secondary, x) {
            const target = `${primary}${secondary}${x}`;
            if (cache[target] !== undefined) return cache[target];
            var [primary, a, o] = primary.match(/\w\w/g).map(e => parseInt(e, 16)), [secondary, n, r] = secondary.match(/\w\w/g).map(e => parseInt(e, 16));
            return cache[target] = `#${Math.round(primary + (secondary - primary) * x).toString(16).padStart(2, "0")}${Math.round(a + (n - a) * x).toString(16).padStart(2, "0")}${Math.round(o + (r - o) * x).toString(16).padStart(2, "0")}`;
        }
    })();

    function renderBackground(ratio, cx, cy, world = socket.world) {
        let chosenImage;
        switch (world.scene) {
            case WORLD_SCENE.ANT:
                chosenImage = images.ant;
                break;
            case WORLD_SCENE.DESERT:
                chosenImage = images.desert;
                break;
            case WORLD_SCENE.OCEAN:
                chosenImage = images.ocean;
                break;
            default:
                chosenImage = images.grass;
                break;
        }

        if (chosenImage === undefined || chosenImage.ready === false) {
            const gridsize = 12 * ratio;
            let fill, border;
            switch (world.scene) {
                case WORLD_SCENE.ANT: {
                    fill = color[18];
                    border = color[17];
                }; break;
                case WORLD_SCENE.DESERT: {
                    fill = color[20];
                    border = color[21];
                }; break;
                case WORLD_SCENE.OCEAN: {
                    fill = color[22];
                    border = color[23];
                }; break;
                default: {
                    fill = color[0];
                    border = color[19];
                };
            }
            ctx.fillStyle = border;
            ctx.strokeStyle = color[15];
            ctx.fillRect(0, 0, innerWidth, innerHeight);
            ctx.fillStyle = fill;
            ctx.fillRect(
                -cx + innerWidth * 0.5 - world.width * ratio,
                -cy + innerHeight * 0.5 - world.height * ratio,
                world.width * ratio * 2,
                world.height * ratio * 2
            );

            ctx.globalAlpha = .04;
            ctx.lineWidth = ratio;
            for (let x = (innerWidth * .5 - cx) % gridsize; x <= innerWidth; x += gridsize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, innerHeight);
                ctx.stroke();
            }
            for (let y = (innerHeight * .5 - cy) % gridsize; y <= innerHeight; y += gridsize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(innerWidth, y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            return;
        }

        ctx.clearRect(0, 0, innerWidth, innerHeight);
        ctx.save();
        // Clip within the world
        ctx.beginPath();
        ctx.rect(
            -cx + innerWidth * 0.5 - world.width * ratio,
            -cy + innerHeight * 0.5 - world.height * ratio,
            world.width * ratio * 2,
            world.height * ratio * 2
        );
        ctx.clip();
        let width = chosenImage.width * ratio,
            height = chosenImage.height * ratio;
        const gridsize = width;
        for (let x = (-cx % width) - height; x <= innerWidth; x += gridsize) {
            for (let y = (-cy % width) - width; y <= innerHeight; y += gridsize) {
                ctx.drawImage(chosenImage, x - 1 | 0, y - 1 | 0, width + 2 | 0, height + 2 | 0);
            }
        }
        ctx.restore();
    }

    function setStyle(fillStyle) {
        ctx.strokeStyle = mixColors(fillStyle, color[15], .2);
        ctx.fillStyle = fillStyle;
    }

    function renderPolygon(shape, x, y, drawSize, rotation, stroke = true) {
        ctx.beginPath();
        switch (shape) {
            case 0: {
                const fill = ctx.fillStyle;
                if (stroke) {
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.arc(x, y, drawSize + ctx.lineWidth, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.closePath();
                    ctx.beginPath();
                }
                ctx.arc(x, y, drawSize, 0, Math.PI * 2);
                ctx.fillStyle = fill;
                ctx.fill();
                return ctx.closePath();
            } break;
            default: {
                ctx.translate(x, y);
                ctx.rotate(rotation);
                if (shape > 0) {
                    for (let i = 0; i < shape; i++) {
                        const theta = (i / shape) * Math.PI * 2;
                        ctx.lineTo(drawSize * Math.cos(theta), drawSize * Math.sin(theta));
                    }
                } else {
                    const dip = 1 - (7 / shape / shape);
                    shape = -shape;

                    ctx.moveTo(drawSize, 0);
                    for (let i = 0; i < shape; i++) {
                        const theta = (i + 1) / shape * Math.PI * 2;
                        const htheta = (i + .5) / shape * Math.PI * 2;
                        ctx.quadraticCurveTo(drawSize * dip * Math.cos(htheta), drawSize * dip * Math.sin(htheta), drawSize * Math.cos(theta), drawSize * Math.sin(theta));
                    }
                }
                ctx.rotate(-rotation);
                ctx.translate(-x, -y);
            }; break;
        }

        ctx.closePath();
        ctx.fill();
        if (stroke) ctx.stroke();
    }

    function renderBar(x1, x2, y, thickness, color) {
        ctx.lineCap = ctx.lineJoin = "round";
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
    }

    function renderText(text, x, y, size, color, align = "center") {
        ctx.fillStyle = color;
        ctx.font = `${size | 0}px 'Ubuntu'`;
        ctx.textAlign = align;
        ctx.strokeStyle = mixColors(color, "#000000", .8);
        ctx.lineWidth = size * .15;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
    }

    const paths = {
        ladybug: new Path2D("M -0.0001 -1 A 1 1 0 0 0 -1 0 A 1 1 0 0 0 0 1 A 1 1 0 0 0 0.8 0.618 A 0.625 0.625 0 0 1 0.25 0 A 0.625 0.625 0 0 1 0.8 -0.6181 A 1 1 0 0 0 0 -1 z"),
        inventory: new Path2D("M 0.5237 0.0027 C 0.5062 0.0029 0.494 0.011 0.4866 0.0305 C 0.4553 0.1126 0.4179 0.1981 0.3998 0.2949 C 0.4049 0.2972 0.4099 0.2998 0.4148 0.3027 C 0.4279 0.3104 0.4405 0.3203 0.4515 0.3322 C 0.5007 0.2627 0.5555 0.2093 0.6078 0.1542 C 0.6281 0.1328 0.6297 0.1173 0.626 0.0976 C 0.6223 0.0779 0.6084 0.0531 0.5893 0.0346 C 0.5703 0.016 0.5466 0.0037 0.5272 0.0028 C 0.526 0.0027 0.5248 0.0027 0.5237 0.0027 Z M 0.4003 0.0047 C 0.3824 0.0043 0.3685 0.0221 0.3576 0.0598 C 0.3416 0.1147 0.3393 0.2051 0.355 0.2859 C 0.3552 0.2859 0.3555 0.2859 0.3558 0.2859 C 0.3594 0.2856 0.3629 0.2857 0.3665 0.2859 C 0.3834 0.1913 0.4165 0.11 0.4452 0.0371 C 0.4268 0.014 0.4115 0.0051 0.4003 0.0047 Z M 0.2264 0.163 L 0.2076 0.2051 C 0.2341 0.2324 0.2596 0.2587 0.2788 0.2904 C 0.2858 0.3019 0.292 0.3141 0.2972 0.3274 C 0.304 0.3145 0.3125 0.3046 0.3217 0.298 C 0.3224 0.2975 0.3232 0.2971 0.3239 0.2966 C 0.3178 0.2818 0.3109 0.2683 0.3033 0.2559 C 0.2805 0.2183 0.2529 0.1903 0.2264 0.163 Z M 0.6264 0.1964 C 0.5741 0.2514 0.5217 0.3028 0.4756 0.3671 C 0.4764 0.3686 0.4772 0.3702 0.4779 0.3718 C 0.5149 0.3535 0.5664 0.3302 0.61 0.3191 C 0.6306 0.3139 0.638 0.3013 0.6414 0.2831 C 0.6449 0.265 0.6422 0.2377 0.6319 0.2097 C 0.6303 0.2053 0.6284 0.2008 0.6264 0.1964 Z M 0.2261 0.3265 C 0.1994 0.3271 0.173 0.3382 0.1475 0.3612 L 0.1646 0.4048 C 0.2033 0.3698 0.2408 0.3664 0.2812 0.3924 C 0.2822 0.3772 0.2844 0.3634 0.2879 0.3511 C 0.2885 0.3489 0.2892 0.3467 0.2899 0.3447 C 0.2687 0.3324 0.2473 0.3261 0.2261 0.3265 Z M 0.3616 0.3372 C 0.3516 0.337 0.3427 0.3392 0.3358 0.3441 C 0.328 0.3496 0.3225 0.3574 0.3186 0.3712 C 0.317 0.3768 0.3158 0.3835 0.315 0.3916 C 0.3158 0.3915 0.3167 0.3915 0.3175 0.3915 C 0.3462 0.3913 0.3757 0.399 0.4056 0.4165 C 0.4194 0.4245 0.4325 0.4367 0.445 0.4523 C 0.4508 0.4457 0.454 0.4395 0.4554 0.4345 C 0.4575 0.4269 0.4573 0.4204 0.4542 0.4106 C 0.448 0.3908 0.427 0.3645 0.4026 0.35 C 0.3904 0.3428 0.3776 0.3385 0.3659 0.3375 C 0.3645 0.3373 0.363 0.3373 0.3616 0.3372 Z M 0.3174 0.4418 C 0.2763 0.442 0.2374 0.4619 0.2012 0.4956 C 0.1432 0.5495 0.0929 0.64 0.0575 0.7403 C 0.0222 0.8407 0.0019 0.9508 0.0018 1.0409 C 0.0017 1.1308 0.0201 1.1966 0.0604 1.2252 C 0.0605 1.2252 0.0606 1.2253 0.0607 1.2253 H 0.0607 C 0.1052 1.2566 0.178 1.2779 0.2545 1.28 C 0.331 1.282 0.4115 1.2651 0.4724 1.2251 C 0.5116 1.1993 0.5341 1.1477 0.5448 1.0778 C 0.5554 1.0079 0.5529 0.9211 0.5405 0.835 C 0.5282 0.7489 0.5062 0.6635 0.4796 0.5961 C 0.453 0.5286 0.4213 0.4801 0.3937 0.464 C 0.3675 0.4487 0.342 0.4417 0.3174 0.4418 Z")
    };

    function renderAntHead(x, y, size, id, col) {
        setStyle(col);

        // Draw pincers
        ctx.save();

        ctx.lineWidth = size * .35;
        ctx.strokeStyle = color[26];

        const rotate = Math.sin(performance.now() * .02 + id) * .1;

        ctx.beginPath();
        ctx.moveTo(0, -size * .8);
        ctx.rotate(rotate);
        ctx.lineTo(size * 1.4, -size * .4);
        ctx.closePath();
        ctx.stroke();

        ctx.rotate(-rotate);

        ctx.beginPath();
        ctx.moveTo(0, size * .8);
        ctx.rotate(-rotate);
        ctx.lineTo(size * 1.4, size * .4);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();

        renderPolygon(0, x, y, size, 0, true);
    }

    function renderEntity(type, index, x, y, size, ratio, rotation, seed = 0, entity = {}) {
        const drawSize = size * ratio;
        const borderSize = drawSize * 0.2;
        ctx.lineWidth = borderSize;
        ctx.translate(x, y);
        ctx.rotate(rotation);
        const dist = Math.abs(entity.health.display - entity.health.real),
            colorMixture = (dist && entity.health.display > entity.health.real) > .025 ? .5 : 0;
        entity.health.display = lerp(entity.health.display, entity.health.real, .075);
        if (dist < .01) {
            entity.health.backbar = lerp(entity.health.backbar, entity.health.real, .1);
        }
        switch (type) {
            case ENTITY_TYPES.PLAYER: {
                let col = color[7];
                setStyle(mixColors(col, "#FFFFFF", colorMixture));
                renderPolygon(0, 0, 0, drawSize, rotation);
            }; break;
            case ENTITY_TYPES.PETAL: {
                setStyle(mixColors("#FFFFFF", "#FF0000", colorMixture));
                renderPolygon(0, 0, 0, drawSize, rotation);
            } break;
            case ENTITY_TYPES.MOB: {
                switch (index) {
                    case 0: {
                        const lineWidth = ctx.lineWidth;
                        ctx.lineWidth = 0;
                        ctx.fillStyle = mixColors(color[8], "#FFFFFF", colorMixture);
                        renderPolygon(0, drawSize * 0.23, 0, drawSize * 0.68, rotation, false);
                        ctx.save();
                        ctx.scale(drawSize, drawSize);
                        ctx.lineWidth = lineWidth / drawSize;
                        setStyle(mixColors(color[14], "#FFFFFF", colorMixture));
                        ctx.fill(paths.ladybug);
                        ctx.save();
                        ctx.clip(paths.ladybug);
                        ctx.fillStyle = mixColors(color[8], "#FFFFFF", colorMixture);
                        for (let i = 0, length = seed % 2 === 0 ? 2 : 3; i < length; i++) {
                            seed %= 60;
                            const angle = Math.PI * 0.4 + (i - 0.1 + 0.2 * (seed % 6) / 6) / length * Math.PI * 1.6;
                            const travel = 0.4 + 0.3 * (((seed = (seed + 3) * ++seed) % 12) / 12);
                            seed %= 100;
                            renderPolygon(0, Math.cos(angle) * travel, Math.sin(angle) * travel, 0.13 + 0.18 * ((seed = (seed + 1) * ++seed) % 4) / 4, 0, false);
                        }
                        ctx.restore();
                        ctx.stroke(paths.ladybug);
                        ctx.restore();
                    }; break;
                    case 1: {
                        ctx.fillStyle = mixColors(color[8], "#FFFFFF", colorMixture);
                        renderPolygon(3, -drawSize * 1.05, 0, drawSize * 0.3, Math.PI, false);
                        setStyle(mixColors(color[16], "#FFFFFF", colorMixture));
                        ctx.beginPath();
                        ctx.ellipse(0, 0, drawSize, drawSize * 0.75, 0, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.fill();
                        ctx.fillStyle = mixColors(color[8], "#FFFFFF", colorMixture);
                        ctx.save();
                        ctx.clip();
                        ctx.fillRect(-drawSize * 0.8, -drawSize, drawSize * 0.3, drawSize * 2);
                        ctx.fillRect(-drawSize * 0.2, -drawSize, drawSize * 0.3, drawSize * 2);
                        ctx.fillRect(drawSize * 0.4, -drawSize, drawSize * 0.3, drawSize * 2);
                        ctx.restore();
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(drawSize * 1.35, drawSize * 0.55, drawSize * 0.2, 0, Math.PI * 2);
                        ctx.arc(drawSize * 1.35, -drawSize * 0.55, drawSize * 0.2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.fill();
                        ctx.strokeStyle = mixColors(color[8], "#FFFFFF", colorMixture);
                        ctx.lineWidth = drawSize * 0.1;
                        ctx.beginPath();
                        ctx.moveTo(drawSize * 1.35, drawSize * 0.55);
                        ctx.quadraticCurveTo(drawSize * 1.25, drawSize * .1, drawSize * 0.85, drawSize * 0.15);
                        ctx.moveTo(drawSize * 1.35, -drawSize * 0.55);
                        ctx.quadraticCurveTo(drawSize * 1.25, -drawSize * .1, drawSize * 0.85, -drawSize * 0.15);
                        ctx.stroke();
                    }; break;
                    case 3: // Worker Ant
                        setStyle(mixColors(color[24], "#FFFFFF", colorMixture));
                        renderPolygon(0, -drawSize * 1.1, 0, drawSize * .667, 0, true);
                    case 2: // Baby Ant
                        renderAntHead(0, 0, drawSize, entity.id, color[24]);
                        break;
                    case 4: { // Soldier Ant
                        setStyle(mixColors(color[24], "#FFFFFF", colorMixture));
                        renderPolygon(0, -drawSize * 1.1, 0, drawSize * .667, 0, true);
                        // Wings
                        const rotate = Math.sin(performance.now() * .01 + entity.id) * .334;
                        ctx.save();
                        ctx.globalAlpha = .5;
                        ctx.fillStyle = mixColors(color[25], "#FFFFFF", colorMixture);
                        ctx.rotate(rotate);
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.ellipse(-drawSize, -drawSize * .3, drawSize, drawSize * .4, 0, 0, Math.PI * 2);
                        ctx.rotate(-rotate * 2);
                        ctx.ellipse(-drawSize, drawSize * .3, drawSize, drawSize * .4, 0, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                        renderAntHead(0, 0, drawSize, entity.id, color[24]);
                    } break;
                    case 5: { // Queen Ant
                        setStyle(mixColors(color[24], "#FFFFFF", colorMixture));
                        renderPolygon(0, -drawSize * 2, 0, drawSize * 1.3, 0, true);
                        renderPolygon(0, -drawSize * 1.1, 0, drawSize * 1.15, 0, true);
                        // Wings
                        const rotate = Math.sin(performance.now() * .01 + entity.id) * .334;
                        ctx.save();
                        ctx.globalAlpha = .5;
                        ctx.fillStyle = mixColors(color[25], "#FFFFFF", colorMixture);
                        ctx.rotate(rotate);
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.ellipse(-drawSize, -drawSize * .4, drawSize * 2, drawSize * .6, 0, 0, Math.PI * 2);
                        ctx.rotate(-rotate * 2);
                        ctx.ellipse(-drawSize, drawSize * .4, drawSize * 2, drawSize * .6, 0, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                        renderAntHead(0, 0, drawSize, entity.id, color[24]);
                    } break;
                    case 6: {
                        setStyle(color[17], "#000000", .2);
                        renderPolygon(0, 0, 0, drawSize, 0, false);
                        ctx.fillStyle = ctx.strokeStyle;
                        renderPolygon(0, 0, 0, drawSize * 0.75, 0, false);
                        ctx.fillStyle = mixColors(color[17], "#000000", .5);
                        renderPolygon(0, 0, 0, drawSize * 0.5, 0, false);
                    } break;
                }
            }; break;
            case ENTITY_TYPES.WALL: {
                let image = images.dirt;

                let width = drawSize * entity.width,
                    height = drawSize * entity.height;

                setStyle(color[18], "#000000", .2);
                ctx.fillRect(-width - 1, -height - 1, width * 2 + 2, height * 2 + 2);
                //ctx.strokeRect(-width, -height, width * 2, height * 2);
            } break;
        }

        ctx.rotate(-rotation);
        if (entity.health.draws) {
            if (entity.rarity) {
                renderText(entity.rarity.name, drawSize, drawSize + 40, 13, entity.rarity.color, "right");
            }
            renderBar(-drawSize, drawSize, drawSize + 30, borderSize * 2, color[15]);
            ctx.globalAlpha *= .5;
            renderBar(-drawSize, -drawSize + (drawSize * 2 * entity.health.backbar), drawSize + 30, borderSize * 1, color[14]);
            ctx.globalAlpha *= 2;
            renderBar(-drawSize, -drawSize + (drawSize * 2 * entity.health.display), drawSize + 30, borderSize * 1.5, color[13]);
        }
        ctx.translate(-x, -y);
    }

    const drawInterface = (function () {
        const spacing = 14;
        const padding = 20;
        function drawElement(x, y, width, height, fill, doFill = true, doStroke = true) {
            setStyle(fill);
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.closePath();
            doFill && ctx.fill();

            // I'm mad at the world rn and that's why I'm coding like this
            doStroke && (
                ctx.lineWidth = 4,
                ctx.stroke()
            );
        }

        function bootlegDrawElement(x, y, width, height, color, fill, stroke) {
            setStyle(color);
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.closePath();

            if (fill) {
                ctx.fill();
            }

            if (stroke) {
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        }

        function renderHud(world) {
            const size = 60;
            const centerx = innerWidth * 0.5;
            const y = innerHeight - padding - size;
            const x = size + spacing;
            for (let i = 0, length = world.petals.length; i < length; i++) {
                let petal = world.petals[i];

                // lerp the ratio
                petal.ratio = lerp(petal.ratio, petal.rratio, .125);

                const xx = x * length * 0.5 - x * i;
                bootlegDrawElement(centerx - xx, y, size, size, mixColors(petal.rarity.color, "#000000", .334), true, false);
                if (petal.alive) {
                    bootlegDrawElement(centerx - xx, y + size, size, -size * petal.ratio, petal.rarity.color, true, false);
                } else {
                    // The petal is dead, so we need to draw a square that grows into the box
                    bootlegDrawElement(
                        centerx - xx + size * .5 - size * .5 * petal.ratio,
                        y + size * .5 - size * .5 * petal.ratio,
                        size * petal.ratio,
                        size * petal.ratio,
                        petal.rarity.color,
                        true,
                        false
                    );
                }
                bootlegDrawElement(centerx - xx, y, size, size, petal.rarity.color, false, true);
                let image = window.petalIcons[PETAL_INDEXES[petal.index] + "_" + petal.rarity.index];

                if (image) {
                    ctx.drawImage(image, centerx - xx, y, size, size);
                }
                renderText(PETAL_INDEXES[petal.index], centerx - xx + size * 0.5, y + size * 0.8, size * 0.2, "#ffffff", "center");
                // center would be x: xx + x * 0.5, y: y + size * 0.5 
            }
        }

        let minimapSize = 160;
        function renderMinimap(elements) {
            minimapSize = lerp(minimapSize, elements.includes("minimap") ? 240 : 160, .125);
            ctx.fillStyle = color[15];
            ctx.fillRect(innerWidth - padding - minimapSize, padding, minimapSize, minimapSize);
            controller.addElement("minimap", innerWidth - padding - minimapSize, padding, innerWidth - padding, padding + minimapSize);
        }

        function renderActionButtons(elements) {
            const size = 55;
            const x = spacing;
            let y = innerHeight - spacing - size;
            for (let i = 0; i < 4; i++) {
                drawElement(x, y, size, size, mixColors(color[i], "#FFFFFF", elements.includes(i) ? .2 : 0));
                if (i === 3) {
                    ctx.save();
                    ctx.fillStyle = "#FFFFFF";
                    ctx.translate(x + size * .25, y + size * .1);
                    ctx.scale(size * .8, size * .6);
                    ctx.beginPath();
                    ctx.fill(paths.inventory);
                    ctx.closePath();
                    ctx.restore();
                }
                controller.addElement(i, x, y, x + size, y + size, () => alert("hi"));
                renderText("[Z]", x + size - 4, y + size * 0.7, size * 0.275, "#ffffff", "right");
                y -= size + spacing;
            }
        }

        return function (world) {
            const elements = controller.getElements();
            controller.clearElements();
            renderHud(world);
            renderMinimap(elements);
            renderActionButtons(elements);
        }
    })();

    function animationLoop() {
        const world = socket.world;
        const camera = world.camera;
        const player = world.player;
        const ratio = camera.getRatio();
        if (player !== null) {
            camera.x = player.x;
            camera.y = player.y;
        }
        const cx = camera.x * ratio;
        const cy = camera.y * ratio;

        renderBackground(ratio, cx, cy);

        // Draw the lake shape in the middle
        if (socket.world.scene === WORLD_SCENE.GARDEN || 1) {
            ctx.save();
            const xx = -cx + innerWidth * 0.5;
            const yy = -cy + innerHeight * 0.5;
            ctx.translate(xx, yy);
            harcodedPaths.forEach(path => {
                ctx.save();
                ctx.beginPath();
                for (let i = 0; i < path.length; i++) {
                    const { x, y } = path[i];
                    ctx.lineTo(x * ratio, y * ratio);
                }
                ctx.closePath();
                ctx.clip();
                ctx.translate(-xx, -yy);
                const image = images.dirt;
                let width = image.width * ratio,
                    height = image.height * ratio;
                const gridsize = width;
                for (let x = (-cx % width) - height; x <= innerWidth * devicePixelRatio; x += gridsize) {
                    for (let y = (-cy % width) - width; y <= innerHeight * devicePixelRatio; y += gridsize) {
                        ctx.drawImage(image, x - 1 | 0, y - 1 | 0, width + 2 | 0, height + 2 | 0);
                    }
                }
                ctx.restore();
            });
            ctx.restore();
        }

        world.entities.forEach(entity => {
            const isMe = entity.id === player?.id;
            entity.x = lerp(entity.x, entity.rx, 0.1);
            entity.y = lerp(entity.y, entity.ry, 0.1);
            entity.size = lerp(entity.size, entity.rsize, .15);
            entity.rotation = lerpAngle(entity.rotation, entity.rrotation, .15);
            renderEntity(
                entity.type,
                entity.index,
                isMe ? innerWidth * 0.5 : entity.x * ratio - cx + innerWidth * 0.5,
                isMe ? innerHeight * 0.5 : entity.y * ratio - cy + innerHeight * 0.5,
                entity.size,
                ratio,
                entity.rotation,
                entity.id,
                entity
            );
        });

        if (Math.abs(curtainAnimationDestination - curtainAnimationTick) > 0.01 || curtainAnimationDestination === 0) {
            let max = Math.max(canvas.width, canvas.height);
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, max * 1.5, 0, 2 * Math.PI, true);
            ctx.arc(canvas.width / 2, canvas.height / 2, curtainAnimationTick * max, 0, 2 * Math.PI, false);
            ctx.closePath();
            ctx.fillStyle = "#000000";
            ctx.fill();

            curtainAnimationTick = Math.max(0, curtainAnimationTick + .015 * (curtainAnimationDestination === 1 ? 1 : -1));
        }

        if (world.scene === WORLD_SCENE.OCEAN) {
            ctx.globalAlpha = 0.2;
            const image = images.water;
            let width = image.width * ratio,
                height = image.height * ratio;
            const gridsize = width;
            const gridshift = gridsize * (performance.now() % 10000) * 0.0001;
            for (let x = (-cx % width) - height - gridshift; x <= innerWidth * devicePixelRatio; x += gridsize) {
                for (let y = (-cy % width) - width - gridshift; y <= innerHeight * devicePixelRatio; y += gridsize) {
                    ctx.drawImage(image, x, y, width, height);
                }
            }
            ctx.globalAlpha = 1;
        }

        drawInterface(world);

        requestAnimationFrame(animationLoop);
    }

    let gameStared = false;
    async function startGame() {
        if (gameStared) return;
        gameStared = true;
        socket.connect(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/`);

        let inputCache = -1;
        setInterval(function talkInputs() {
            let inputs = controller.update();
            if (inputs !== inputCache) {
                inputCache = inputs;
                socket.talk({
                    type: 2, inputs,
                    mouseAngle: Math.atan2(controller.mouse.y - canvas.height / 2, controller.mouse.x - canvas.width / 2),
                    intensity: 0
                });
            }
        }, 1000 / 30);

        animationLoop();
    }

    Object.defineProperty(window, "startGame", {
        value: startGame,
        writable: false,
        configurable: false,
        enumerable: false
    });
})();
