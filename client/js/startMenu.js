(async function () {

    // Stuff
    const textInputContainer = document.getElementById("textInputContainer");
    const playerNameInput = document.getElementById("textInput");
    const mainMenu = document.getElementById("mainMenu");
    const loading = document.getElementById("loading");
    const changelogElement = document.getElementById("changelog");

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
        "#96661C", // 18: ANT HOLE BORDER
        "#1A9658", // 19: GARDEN BORDER
        "#DDD17B", // 20: desert background
        "#C7BB6F", // 21: desert border
        "#4E79B0", // 22: ocean background
        "#476FA3", // 23: ocean border
        "#555555", // 24: ants
        "#9fa0a0", // 25: wings of ants
        "#2a2a2a", // 26: Pincer
    ];

    const mixColors = (function () {
        const cache = {};
        return function (primary, secondary, x) {
            const target = `${primary}${secondary}${x}`;
            if (cache[target] !== undefined) return cache[target];
            var [primary, a, o] = primary.match(/\w\w/g).map(e => parseInt(e, 16)), [secondary, n, r] = secondary.match(/\w\w/g).map(e => parseInt(e, 16));
            return cache[target] = `#${Math.round(primary + (secondary - primary) * x).toString(16).padStart(2, "0")}${Math.round(a + (n - a) * x).toString(16).padStart(2, "0")}${Math.round(o + (r - o) * x).toString(16).padStart(2, "0")}`;
        }
    })();

    const canvasElement = document.getElementById("canvas");
    /**
     * @type { CanvasRenderingContext2D }
     */
    const ctx = canvasElement.getContext("2d", { alpha: false });

    const images = (function () {
        const cache = {};
        for (const source of [
            ["./resources/tiles/grass1.svg", "grass0"],
            ["./resources/tiles/grass2.svg", "grass1"],
            ["./resources/tiles/grass3.svg", "grass2"],
            ["./resources/tiles/grass4.svg", "grass3"],
            ["./resources/tiles/grass5.svg", "grass4"]
        ]) {
            const image = new Image();
            image.src = source[0];
            image.ready = true;
            cache[source[1]] = image;
            image.addEventListener("load", () => image.ready = true);
        }
        return cache;
    })();

    function resize() {
        canvas.width = window.innerWidth * window.devicePixelRatio;
        canvas.height = window.innerHeight * window.devicePixelRatio;

        ctx.textBaseline = "middle";
    }

    window.addEventListener("resize", resize);
    resize();
    function getRatio() {
        const fov = 800;
        return Math.max(innerWidth / fov, innerHeight / fov / 1080 * 1920);
    }

    function renderBackground(ratio, cx, cy) {
        /*
        "#DDD17B", // 20: desert background
        "#C7BB6F", // 21: desert border
        "#4E79B0", // 22: ocean background
        "#476FA3", // 23: ocean border
        */
        if (!images.grass0.ready) {
            return;
        }
        let width = images.grass0.width * ratio,
            height = images.grass0.height * ratio;
        const gridsize = width;
        for (let x = -cx % gridsize; x <= innerWidth; x += gridsize) {
            for (let y = -cy % gridsize; y <= innerHeight; y += gridsize) {
                // Constrain it to the screen
                if (x + width < 0 || y + width < 0 || x - width > innerWidth || y - width > innerHeight) continue;
                ctx.drawImage(images.grass0, x | 0, y | 0, width + 1 | 0, height + 1 | 0);
            }
        }
        ctx.globalAlpha = 1;
    }

    let stop = false,
        ratio = getRatio(),
        cx = 0,
        cy = 0,
        mouse = {
            x: 0,
            y: 0
        },
        petals = [],
        petalID = 0;

    window.addEventListener("mousemove", function (e) {
        mouse.x = e.clientX * window.devicePixelRatio;
        mouse.y = e.clientY * window.devicePixelRatio;
    });

    function drawPetalImage(img, x, y, z, angle, ratio) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(z * ratio, z * ratio);
        let width = img.width / z / ratio,
            height = img.height / z / ratio;
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
    }

    const getNewPetal = (function() {
        let i = 0,
            keys = Object.keys(window.petalIcons).sort(() => Math.random() - .5);

        return function() {
            i = (i + 1) % keys.length;
            return window.petalIcons[keys[i]];
        }
    })();

    function animationLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        cx = lerp(cx, mouse.x, .01);
        cy = lerp(cy, mouse.y, .01);

        renderBackground(ratio, cx + .5 | 0, cy + .5 | 0);

        if (petals.length < 250) {
            let sort = false;
            for (let i = 0; i < 250 - petals.length; i++) {
                if (Math.random() > .9995) {
                    let y = Math.random() * (canvas.height + innerHeight);
                    petals.push({
                        id: petalID++,
                        x: -10,
                        y: y,
                        yy: y,
                        z: Math.random() * 1.5 + 1,
                        yDir: Math.random() > .5 ? 1 : -1,
                        speed: 1 + Math.random() * 1.5,
                        spinSpeed: Math.random() * .1,
                        angle: 0,
                        //...petalConfigurations[Math.random() * petalConfigurations.length | 0]
                        image: getNewPetal()
                    });
                    sort = true;
                }
            }
            if (sort) {
                petals = petals.sort((a, b) => a.z - b.z);
            }
        }
        for (let petal of petals) {
            petal.x += petal.speed;
            if (petal.x >= innerWidth + canvas.width + 100) {
                petals = petals.filter(other => other.id !== petal.id);
                continue;
            }
            if (Math.abs((petal.y + petal.yDir) - petal.yy) > ((petal.z + 1) / 5 * 50) * .8 * 2) {
                petal.yDir *= -1;
            }
            petal.y += petal.yDir * .1;
            petal.angle += .025 * (petal.speed * .667 + petal.spinSpeed);
            

            //drawPetal(petal.x - cx, petal.y - cy, petal.z, petal.angle, petal.amount, petal.fill);
            drawPetalImage(petal.image, petal.x - cx, petal.y - cy, petal.z, petal.angle, ratio);

        }

        if (!stop) {
            requestAnimationFrame(animationLoop);
        }
    }

    function lerp(a, b, x) {
        return a + x * (b - a);
    }

    let animatedTextsGoal = 50;
    function animatedTextsFrame() {
        let top = textInputContainer.style.top;
        top = +top.slice(0, top.length - 1);

        if (Math.abs(top - animatedTextsGoal) > .5) {
            textInputContainer.style.top = lerp(top, animatedTextsGoal, .05) + "%";
        }
    }

    function load() {
        loading.style.display = "none";
        mainMenu.style.display = "block";
        document.body.classList.add("loaded");

        playerNameInput.value = localStorage.getItem("playerName") || "Unnamed";
        setInterval(animatedTextsFrame, 1000 / 60);
        animationLoop();
    }

    window.onload = load;

    const changelog = (await (await fetch("/changelog.json")).json()).sort(function sort(a, b) {
        return b.time - a.time;
    });

    changelog.forEach(function addLog(version, i) {
        changelogElement.innerHTML += `
            <h1>${version.name}</h1>
            <ul>
                ${version.changes.map(function change(change) {
            return `<li>${change}</li>`;
        }).join("")}
            </ul>
        `;

        if (i !== changelog.length - 1) {
            changelogElement.innerHTML += "<hr>";
        }
    });

    let active = false;
    function toggleChangelog() {
        changelogElement.classList.toggle("active");
        active = !active;
    }

    function toggleSettingsMenu() {
        settingsMenu.classList.toggle("active");
    }

    Object.defineProperty(window, "toggleChangelog", {
        value: toggleChangelog,
        writable: false,
        enumerable: false,
        configurable: false
    });

    Object.defineProperty(window, "toggleSettingsMenu", {
        value: toggleSettingsMenu,
        writable: false,
        enumerable: false,
        configurable: false
    });

    function listener(event) {
        if (event.keyCode === 13 && "startGame" in window) {
            document.removeEventListener("keydown", listener);
            mainMenu.style.display = "none";
            animatedTextsGoal = -50;
            let interval = setInterval(function () {
                let top = textInputContainer.style.top;
                top = +top.slice(0, top.length - 1);

                if (Math.abs(top - animatedTextsGoal) > .5) {
                    clearInterval(interval);
                    stop = true;
                    window.startGame();
                }
            }, 250);

        }
    }

    document.addEventListener("keydown", listener);
})();