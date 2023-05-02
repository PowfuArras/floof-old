export default function generateBorder(width, height, facing) {
    let points = [],
        ticks = 20 + (Math.random() * 10) | 0;

    switch (facing) {
        case 0: // Left
            points.push([0, 0]);
            points.push([width, 0]);

            for (let i = 0; i <= ticks; i++) {
                let x = (i % 2 ? width * .75 : width) + (width * Math.random() * .5),
                    y = i / ticks * height;
                points.push([x, y]);
            }

            points.push([width, height]);
            points.push([0, height]);
            break;
        case 1: // Right
            points.push([0, 0]);
            points.push([-width, 0]);

            for (let i = 0; i <= ticks; i++) {
                let x = (i % 2 ? width * .75 : width) + (width * Math.random() * .5),
                    y = i / ticks * height;
                points.push([-x, y]);
            }

            points.push([-width, height]);
            points.push([0, height]);
            break;
        case 2: // Top
            points.push([0, 0]);
            points.push([0, -height]);

            for (let i = 0; i <= ticks; i++) {
                let x = i / ticks * width,
                    y = (i % 2 ? height * .75 : height) + (height * Math.random() * .5);

                points.push([x, -y]);
            }

            points.push([width, -height]);
            points.push([width, 0]);
            break;
        case 3: // Bottom
            points.push([0, 0]);
            points.push([0, height]);

            for (let i = 0; i <= ticks; i++) {
                let x = i / ticks * width,
                    y = (i % 2 ? height * .75 : height) + (height * Math.random() * .5);

                points.push([x, y]);
            }

            points.push([width, height]);
            points.push([width, 0]);
            break;
    }

    return points.map(([x, y]) => {
        switch (facing) {
            case 0: // Left
                return [
                    x * 2 - width,
                    y * 2 - height
                ].map(float => +float.toFixed(3));
            case 1: // Right
                return [
                    x * 2 + width,
                    y * 2 - height
                ].map(float => +float.toFixed(3));
            case 2: // Top
                return [
                    x * 2 - width,
                    y * 2 + height
                ].map(float => +float.toFixed(3));
            case 3: // Bottom
                return [
                    x * 2 - width,
                    y * 2 - height
                ].map(float => +float.toFixed(3));
        }
    });
}