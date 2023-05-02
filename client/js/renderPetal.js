(function () {
    const canvas = document.createElement("canvas");

    Object.defineProperty(window, "petalIcons", {
        value: new Object(),
        writable: false,
        configurable: false,
        enumerable: false
    });

    const RESOLUTION = 64;
    const LINE_WIDTH = 1 / 3;

    const RARITIES = [
        "Common", // 0
        "Uncommon", // 1
        "Rare", // 2
        "Epic", // 3
        "Legendary", // 4
        "Mythic", // 5
        "Ultra", // 6
        "Super", // 7
        "Unique" // 8
    ]

    const ctx = canvas.getContext("2d");

    function resize() {
        canvas.width = RESOLUTION * window.devicePixelRatio;
        canvas.height = RESOLUTION * window.devicePixelRatio;
    }

    window.addEventListener("resize", resize);
    resize();

    const colors = {
        white: "#FFFFFF",
        peach: "#FFF0B7",
        cumWhite: "#ffffC9",
        black: "#000000",
        rosePink: "#FC93C5",
        irisPurple: "#CD75DE",
        pollenGold: "#FEE86B",
        peaGreen: "#8CC05B",
        sandGold: "#DDC758",
        grapePurple: "#C973D8",
        leafGreen: "#3AB54A",
        uraniumLime: "#66BB2A",
        honeyGold: "#F5D230",
        lightningTeal: "#00FFFF",
        rockGray: "#7B727C",
        stingerBlack: "#2D392C",
        cactusGreen: "#39C660",
        cactusLightGreen: "#75D68F",
        bubbleGrey: "#B8B8B8"
    };

    function drawCircle(x, y, radius, stroke, fill) {
        const fillColor = ctx.fillStyle;

        if (stroke) {
            if (!fill) {
                ctx.arc(x, y, radius + ctx.lineWidth / 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.arc(x, y, radius + ctx.lineWidth, 0, Math.PI * 2);
                ctx.fillStyle = ctx.strokeStyle;
                ctx.fill();
            }
            ctx.closePath();
            ctx.beginPath();
        }

        if (fill) {
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();
        }

        ctx.closePath();
    }

    function renderPolygon(shape, x, y, drawSize, rotation, stroke = true, fill = true, dipMultiplier = 1) {
        ctx.beginPath();

        if (shape instanceof Array) {
            ctx.translate(x, y);
            ctx.rotate(rotation);
            for (let i = 0; i < shape.length; i++) {
                let [x, y] = shape[i];

                ctx.lineTo(drawSize * x, drawSize * y);
            }
            ctx.rotate(-rotation);
            ctx.translate(-x, -y);
            ctx.closePath();
            if (fill) ctx.fill();
            if (stroke) ctx.stroke();
            return;
        }

        if (BigInt(shape) === shape) {
            shape = Number(shape);

            // It's a pointy star
            ctx.translate(x, y);
            ctx.rotate(rotation);
            for (let i = 0; i < shape; i += .5) {
                const theta = (i / shape) * Math.PI * 2,
                    dip = i % 1 ? 1 : .5;
                ctx.lineTo(drawSize * Math.cos(theta) * dip, drawSize * Math.sin(theta) * dip);
            }
            ctx.rotate(-rotation);
            ctx.translate(-x, -y);
            ctx.closePath();
            if (fill) ctx.fill();
            if (stroke) ctx.stroke();
            return;
        }

        switch (shape) {
            case 0:
                drawCircle(x, y, drawSize, stroke, fill);
                return;
            default: {
                ctx.translate(x, y);
                ctx.rotate(rotation);
                if (shape > 0) {
                    for (let i = 0; i < shape; i++) {
                        const theta = (i / shape) * Math.PI * 2;
                        ctx.lineTo(drawSize * Math.cos(theta), drawSize * Math.sin(theta));
                    }
                } else {
                    const dip = 1 - (7 / shape / shape) * dipMultiplier;
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
            } break;
        }
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    function drawCurve(points, lineTo) {
        let i;
        // move to the first point
        ctx[lineTo ? "lineTo" : "moveTo"](...points[0]);


        for (i = 1; i < points.length - 2; i++) {
            let [ax, ay] = points[i],
                [bx, by] = points[i + 1];

            let xc = (ax + bx) / 2,
                yc = (ay + by) / 2;

            ctx.quadraticCurveTo(...points[i], xc, yc);
        }
        // curve through the last two points
        ctx.quadraticCurveTo(...points[i], ...points[i + 1]);
    }

    function drawEllipse(x, y, width, height, rotation = 0, stroke = true, fill = true) {
        ctx.beginPath();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
        ctx.rotate(-rotation);
        ctx.translate(-x, -y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    const mixColors = (function () {
        const cache = {};
        return function (primary, secondary, x) {
            const target = `${primary}${secondary}${x}`;
            if (cache[target] !== undefined) return cache[target];
            var [primary, a, o] = primary.match(/\w\w/g).map(e => parseInt(e, 16)), [secondary, n, r] = secondary.match(/\w\w/g).map(e => parseInt(e, 16));
            return cache[target] = `#${Math.round(primary + (secondary - primary) * x).toString(16).padStart(2, "0")}${Math.round(a + (n - a) * x).toString(16).padStart(2, "0")}${Math.round(o + (r - o) * x).toString(16).padStart(2, "0")}`;
        }
    })();

    function setStyle(fillStyle) {
        ctx.strokeStyle = mixColors(fillStyle, colors.black, .2);
        ctx.fillStyle = fillStyle;
    }

    const SINGLE_SIZE = .8;

    const drawings = {
        Basic() {
            setStyle(colors.white);

            renderPolygon(0, 0, 0, SINGLE_SIZE, 0, true);
        },
        Faster() {
            setStyle(colors.cumWhite);

            ctx.lineWidth /= 1.6;

            renderPolygon(0, 0, 0, SINGLE_SIZE * .667, 0, true);
        },
        Rose() {
            setStyle(colors.rosePink);

            renderPolygon(0, 0, 0, SINGLE_SIZE, 0, true);
        },
        Iris() {
            setStyle(colors.irisPurple);

            renderPolygon(0, 0, 0, SINGLE_SIZE, 0, true);
        },
        Pollen() {
            setStyle(colors.pollenGold);

            renderPolygon(0, 0, 0, SINGLE_SIZE, 0, true);
        },
        Peas() {
            setStyle(colors.peaGreen);

            const distance = .625;

            ctx.lineWidth /= 1.6;

            for (let i = 3; i >= 0; i--) {
                let angle = i / 4 * Math.PI * 2 - Math.PI / 3;
                renderPolygon(0, Math.cos(angle) * distance, Math.sin(angle) * distance, .4, 0, true);
            }
        },
        Sand() {
            setStyle(colors.sandGold);

            const distance = .7;

            ctx.lineWidth /= 1.75;

            for (let i = 3; i >= 0; i--) {
                let angle = i / 4 * Math.PI * 2;
                renderPolygon(0, Math.cos(angle) * distance, Math.sin(angle) * distance, .35, 0, true);
            }
        },
        Grapes() {
            setStyle(colors.grapePurple);

            const distance = .625;

            ctx.lineWidth /= 1.6;

            for (let i = 3; i >= 0; i--) {
                let angle = i / 4 * Math.PI * 2 - Math.PI / 3;
                renderPolygon(0, Math.cos(angle) * distance, Math.sin(angle) * distance, .4, 0, true);
            }
        },
        Light(rarity) {
            setStyle(colors.white);

            let distance = 0,
                times = 1,
                offset = 0;

            switch (rarity) {
                case 0: // Common
                    ctx.lineWidth /= 1.6;
                    break;
                case 1: // Uncommon
                case 2: // Rare
                    distance = .7;
                    times = 2;
                    ctx.lineWidth /= 1.6;
                    break;
                case 3: // Epic
                case 4: // Legendary
                    distance = .75;
                    times = 3;
                    ctx.lineWidth /= 1.75;
                    break;
                case 5: // Mythic
                case 6: // Ultra
                    distance = .75;
                    times = 5;
                    ctx.lineWidth /= 1.75;
                    offset = -Math.PI / 2;
                    break;
                case 7: // Super
                case 8: // Unique
                    distance = .8;
                    times = 7;
                    ctx.lineWidth /= 1.9;
                    offset = -Math.PI / 2;
                    break;
            }

            for (let i = times - 1; i >= 0; i--) {
                let angle = i / times * Math.PI * 2 + offset;
                renderPolygon(0, Math.cos(angle) * distance, Math.sin(angle) * distance, .4, 0, true);
            }
        },
        Uranium() {
            setStyle(colors.uraniumLime);

            ctx.lineWidth /= 1.5;
            ctx.lineJoin = ctx.lineCap = "round";

            renderPolygon(6, 0, 0, 1.1, Math.PI / 6, true);
        },
        Honey() {
            setStyle(colors.honeyGold);

            ctx.lineWidth /= 1.5;
            ctx.lineJoin = ctx.lineCap = "round";

            renderPolygon(6, 0, 0, 1.1, 0, true);
        },
        Salt() {
            setStyle(colors.white);

            ctx.lineWidth /= 1.5;

            renderPolygon(7, 0, 0, 1.1, Math.PI / 2, true);
        },
        Lightning() {
            setStyle(colors.lightningTeal);

            ctx.lineWidth /= 4;

            renderPolygon(10n, 0, 0, 1, 0, true);
        },
        Rock() {
            const rockPath = [];
            for (let i = 0; i < 5; i++) {
                let angle = i / 5 * Math.PI * 2,
                    distance = i === 4 ? 1.1 : 1;
                rockPath.push([
                    Math.cos(angle) * distance,
                    Math.sin(angle) * distance
                ]);
            }

            setStyle(colors.rockGray);

            ctx.lineWidth /= 2;

            renderPolygon(rockPath, 0, 0, 1, 0, true);
        },
        Stinger() {
            setStyle(colors.stingerBlack);

            ctx.lineWidth /= 2.5;
            ctx.lineJoin = ctx.lineCap = "round";

            renderPolygon(3, 0, 0, 2 / 3, 0, true);
        },
        Wing() {
            setStyle(colors.white);

            ctx.lineWidth /= 2;
            ctx.lineJoin = ctx.lineCap = "round";

            ctx.beginPath();

            drawCurve([
                [.85, -1],
                [.2, -.85],
                [-.25, 0],
                [.2, .85],
                [.85, 1]
            ].map(r => (r[0] -= .3, r)));

            drawCurve([
                [.85, 1],
                [-.2, 0],
                [.85, -1]
            ].map(r => (r[0] -= .3, r)), true);

            ctx.closePath();

            ctx.stroke();

            ctx.fill();
        },
        Missile() {
            const missilePath = [
                [-1, -2 / 3],
                [-1, 2 / 3],
                [1, 0],
            ];

            setStyle(colors.stingerBlack);

            ctx.lineWidth /= 3;
            ctx.lineJoin = ctx.lineCap = "round";

            renderPolygon(missilePath, 0, 0, 1, 0, true);
        },
        Cactus() {
            setStyle(colors.cactusGreen);

            ctx.lineWidth /= 2;
            ctx.lineJoin = ctx.lineCap = "round";

            renderPolygon(-8, 0, 0, 1.1, 0, true, true, 2.5);

            setStyle(colors.cactusLightGreen);

            renderPolygon(0, 0, 0, .6, 0, false);
        },
        Bubble() {
            setStyle(colors.white);

            ctx.lineWidth /= 2;

            renderPolygon(0, 0, 0, 1, 0, true, false);

            setStyle(colors.bubbleGrey);
            ctx.globalAlpha = .2;

            renderPolygon(0, 0, 0, 1, 0, false, true);

            renderPolygon(0, Math.cos(-Math.PI / 4) * .675, Math.sin(-Math.PI / 4) * .675, .225, 0, false, true);
        },
        Dandelion(rarity) {
            function dandy(x, y, s, a) {
                ctx.save();
                ctx.translate(x, y);

                ctx.rotate(a);

                ctx.strokeStyle = colors.black;
                ctx.lineWidth *= 1.334;
                ctx.lineJoin = ctx.lineCap = "round";

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -s * 1.75);
                ctx.closePath();
                ctx.stroke();

                setStyle(colors.white);

                ctx.lineWidth /= 2;

                renderPolygon(0, 0, 0, s * .8, 0);

                ctx.restore();
            }

            let distance = 0,
                times = 1,
                offset = 0,
                scale = 1;

            switch (rarity) {
                case 0: // Common
                case 1: // Uncommon
                case 2: // Rare
                case 3: // Epic
                case 4: // Legendary
                    offset = -Math.PI / 6;
                    break;
                case 5: // Mythic
                    distance = .95;
                    times = 2;
                    offset = -Math.PI / 6;
                    break;
                case 6: // Ultra
                case 7: // Super
                    distance = .95;
                    times = 3;
                    offset = 0;
                    scale = .8;
                    break;
                case 8: // Uniuque
                    distance = .9;
                    times = 4;
                    offset = Math.PI / 6;
                    scale = .75;
                    break;
            }

            ctx.scale(scale, scale);

            for (let i = times - 1; i >= 0; i--) {
                let angle = i / times * Math.PI * 2,
                    x = Math.cos(angle) * distance,
                    y = Math.sin(angle) * distance;
                dandy(x, y, 1, offset + angle);
            }
        },
        Egg(rarity) {
            setStyle(colors.peach);

            let size = .6 + (rarity / 8) * .4;

            ctx.lineWidth /= 2;

            drawEllipse(0, 0, size * .8, size);
        },
        Antennae() {
            setStyle(colors.black);

            ctx.lineWidth /= 2;
            ctx.lineJoin = ctx.lineCap = "round";

            ctx.beginPath();
            drawCurve([
                [-.8, -.8],
                [-.334, 0],
                [-.25, 1]
            ]);
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            drawCurve([
                [.8, -.8],
                [.334, 0],
                [.25, 1]
            ]);
            ctx.closePath();
            ctx.stroke();
        },
        Heavy() {
            setStyle(colors.stingerBlack);

            ctx.lineWidth /= 2;

            renderPolygon(0, 0, 0, 1, 0);

            setStyle(colors.white);

            renderPolygon(0, Math.cos(-Math.PI / 4) * .675, Math.sin(-Math.PI / 4) * .675, .225, 0, false, true);
        },
        // TODO: YinYang() {}
        Web() {
            setStyle(colors.white);

            ctx.lineWidth /= 2;
            ctx.lineJoin = ctx.lineCap = "round";

            renderPolygon(-5, 0, 0, 1, -Math.PI / 12.5, true, true, 2);
        },
        Leaf() {
            setStyle(colors.leafGreen);

            ctx.lineWidth /= 2;
            ctx.lineJoin = ctx.lineCap = "round";

            ctx.rotate(Math.PI / 6);

            ctx.beginPath();

            ctx.moveTo(0, 0);
            ctx.lineTo(0, 1.375);

            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();

            drawCurve([
                [0, -1],
                [-.3, -.8],
                [-.75, 0],
                [-.45, .8],
                [0, 1],
                [.45, .8],
                [.75, 0],
                [.3, -.8],
                [0, -1]
            ]);

            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            ctx.beginPath();

            drawCurve([
                [0, -.6],
                [-.175, 0],
                [0, .75],
                [-.175, 0],
                [0, -.6]
            ]);

            ctx.closePath();
            ctx.stroke();
        }
    };

    function draw(key, rarity) {
        const drawing = drawings[key];
        if (!drawing) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(canvas.width / 4, canvas.height / 4);
        ctx.lineWidth = LINE_WIDTH;
        drawing(rarity);
        ctx.restore();

        window.petalIcons[`${key}_${rarity}`] = snapPicture();
    }

    function snapPicture() {
        const newCanvas = document.createElement("canvas");

        newCanvas.width = RESOLUTION;
        newCanvas.height = RESOLUTION;

        newCanvas.getContext("2d").drawImage(canvas, 0, 0);

        //document.body.appendChild(newCanvas);

        return newCanvas;
    }

    for (let key in drawings) {
        for (let i = 0; i <= 8; i++) {
            draw(key, i);
        }
    }
})();