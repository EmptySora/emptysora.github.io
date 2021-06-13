"use strict";
/* eslint-disable no-underscore-dangle */

class Gradient {
    constructor(xgrad) {
        let grad = xgrad;
        const ranges = [];
        grad = grad.replace(/[\s\r\n\f\t\b]+/g, "");
        const parts = grad.split("|", 2);
        const colors = parts[0].split(","); // > a,b|b,c|c,d ==interval1
        const stops = parts[1].split(","); // > a,z,b|b,y,c| ==interval2
        for (let i = 0, j = 0; i < colors.length - 1; i += 1, j += 2) {
            const c1 = `#${colors[i]}`;
            const c2 = `#${colors[i + 1]}`;
            const start = stops[j];
            const mid = stops[j + 1];
            const end = stops[j + 2];
            ranges.push([[c1, c2], [start, mid, end]]);
        }
        this.ranges = ranges;
    }

    getRange(pt) {
        for (let i = 0; i < this.ranges.length; i += 1) {
            const r = this.ranges[i];
            if (Gradient.inRange(r, pt)) {
                return r;
            }
        }
        return null;
    }

    getColor(pt) {
        const r = this.getRange(pt);
        const rat = Gradient.ratio(pt, r);
        return Gradient.colorMix(r[0][0], r[0][1], rat);
    }

    static inRange(r, pt) {
        return pt >= r[1][0]
            && pt <= r[1][2];
    }

    static ratio(pt, r) {
        /* eslint-disable-next-line prefer-destructuring */
        const [start, mid, end] = r[1];
        const sega = Gradient.inRange([null, [start, null, mid]], pt);
        const segb = Gradient.inRange([null, [mid, null, end]], pt);
        if (sega && segb) {
            return 0.5; //Even
        } else if (sega) {
            return (pt - start) / (mid - start) / 2;
        } else if (segb) {
            /* eslint-disable-next-line no-extra-parens */
            return ((pt - mid) / (end - mid) / 2) + 0.5;
        }
        throw new Error("Invalid state!");
        //Not sure how this got missed, nor am I sure what it should do.
    }

    static parseColor(a) {
        const r = parseInt(a.substr(1, 2), 16);
        const g = parseInt(a.substr(3, 2), 16);
        const b = parseInt(a.substr(5, 2), 16);
        return [r, g, b];
    }

    static colorMix(a, b, r) {
        const c1 = Gradient.parseColor(a);
        const c2 = Gradient.parseColor(b);
        // > console.log(a,b,ratio,c1,c2);
        /* eslint-disable-next-line no-extra-parens */
        const cr = (c1[0] * (1 - r)) + (c2[0] * r);
        /* eslint-disable-next-line no-extra-parens */
        const cg = (c1[1] * (1 - r)) + (c2[1] * r);
        /* eslint-disable-next-line no-extra-parens */
        const cb = (c1[2] * (1 - r)) + (c2[2] * r);

        return `rgb(${cr},${cg},${cb})`;
        //*(1-ratio),*ratio
    }
}

class MainClass {
    static updateInterface(state) {
        document.getElementById("width").disabled = !state;
        document.getElementById("height").disabled = !state;
        document.getElementById("opacity-a").disabled = !state;
        document.getElementById("opacity-b").disabled = !state;
        document.getElementById("radius-a").disabled = !state;
        document.getElementById("radius-b").disabled = !state;
        document.getElementById("wrap").disabled = !state;
        document.getElementById("gradient").disabled = !state;
        document.getElementById("start").disabled = !state;
        document.getElementById("stop").disabled = state;
    }

    static startDrawing() {
        MainClass.updateInterface(false);
        MainClass.clearCircles();
        MainClass.interval = window.setInterval(() => {
            MainClass.drawCircles();
        }, 1);
    }

    static stopDrawing() {
        window.clearInterval(MainClass.interval);
        MainClass.updateInterface(true);
    }

    static clearCircles() {
        const o = MainClass.output;
        const ctx = o.getContext("2d");
        ctx.fillStyle = "transparent";
        ctx.clearRect(0, 0, o.width, o.height);
        ctx.fillStyle = "white";
        o.setAttribute("width", MainClass.width);
        o.setAttribute("height", MainClass.height);
        MainClass.showGradient(MainClass.gradient);
    }

    static showGradient(gradient) {
        const c = document.getElementById("grad");
        const ctx = c.getContext("2d");
        gradient.ranges.forEach((r) => {
            const g1 = ctx.createLinearGradient(
                r[1][0] * c.width,
                0,
                r[1][1] * c.width,
                0
            );
            const g2 = ctx.createLinearGradient(
                r[1][1] * c.width,
                0,
                r[1][2] * c.width,
                0
            );
            g1.addColorStop(0, r[0][0]);
            g1.addColorStop(1, Gradient.colorMix(r[0][0], r[0][1], 0.5));
            g2.addColorStop(0, Gradient.colorMix(r[0][0], r[0][1], 0.5));
            g2.addColorStop(1, r[0][1]);
            ctx.fillStyle = g1;
            ctx.fillRect(r[1][0] * c.width, 0, r[1][1] * c.width, c.height);
            ctx.fillStyle = g2;
            ctx.fillRect(r[1][1] * c.width, 0, r[1][2] * c.width, c.height);
        });
        /*
         * Note:
         * x11=start*c.width
         * x12=mid*c.width
         * x21=mid*c.width
         * x22-end*c.width
         * y1=0
         * y2=0
         */
    }

    static drawCircles() {
        for (let i = 0; i < 25; i += 1) {
            MainClass.drawCircle();
        }
    }

    static addOpacity(color, opacity) {
        return color.replace("rgb(", "rgba(").replace(")", `,${opacity})`);
    }

    static random(min, max) {
        /* eslint-disable-next-line no-extra-parens */
        return (Math.random() * (max - min)) + min;
    }

    static randomInt(min, max) {
        /* eslint-disable-next-line no-extra-parens */
        return Math.floor(Math.random() * (max - min)) + min;
    }

    static drawCircle() {
        const o = MainClass.output;
        const ctx = o.getContext("2d");
        /*
         * If wrapping, offset x and y by 0.5*radius.current
         * (between min and max)
         */
        const radius = MainClass.random(
            MainClass.minRadius,
            MainClass.maxRadius
        );
        let x = MainClass.randomInt(0, o.width);
        let y = MainClass.randomInt(0, o.width);
        const opacity = MainClass.random(
            MainClass.minOpacity,
            MainClass.maxOpacity
        );
        const color = MainClass.addOpacity(
            MainClass.gradient.getColor(Math.random()),
            opacity
        );
        ctx.moveTo(x, y);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
        if (MainClass.wrap) {
            const ox = x;
            const oy = y;
            let inverseCircle = false;
            if (x <= radius) {
                inverseCircle = true;
                x = o.width + x;
            } else if (x >= o.width - radius) {
                x -= o.width;
                inverseCircle = true;
            }
            if (inverseCircle) {
                ctx.moveTo(x, y);
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.closePath();
            }
            x = ox;
            y = oy;
            inverseCircle = false;
            if (y <= radius) {
                inverseCircle = true;
                y = o.height + y;
            } else if (y >= o.height - radius) {
                y -= o.height;
                inverseCircle = true;
            }
            if (inverseCircle) {
                ctx.moveTo(x, y);
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.closePath();
            }
            x = ox;
            y = oy;
            inverseCircle = 0;
            if (x <= radius) {
                inverseCircle += 1;
                x = o.width + x;
            } else if (x >= o.width - radius) {
                x -= o.width;
                inverseCircle += 1;
            }
            if (y <= radius) {
                inverseCircle += 1;
                y = o.height + y;
            } else if (y >= o.height - radius) {
                y -= o.height;
                inverseCircle += 1;
            }
            if (inverseCircle > 1) {
                ctx.moveTo(x, y);
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }

    static init() {
        function $(x) {
            return document.getElementById(x);
        }

        const change = [
            "width",
            "height",
            "opacity-a",
            "opacity-b",
            "radius-a",
            "radius-b",
            "wrap",
            "gradient"
        ];
        const keyup = [
            "width",
            "height",
            "opacity-a",
            "opacity-b",
            "radius-a",
            "radius-b",
            "gradient"
        ];
        change.forEach((id) => {
            $(id).addEventListener("change", (e) => MainClass.validate(e));
        });
        keyup.forEach((id) => {
            $(id).addEventListener("keyup", (e) => MainClass.validate(e));
        });
        $("start").addEventListener("click", () => MainClass.startDrawing());
        $("stop").addEventListener("click", () => MainClass.stopDrawing());
    }

    static validate(e) {
        //Todo: finish this.
        if (e.target.id === "gradient") {
            MainClass.__gradient = null;
            //Gradient was changed.
        }
    }

    static get width() {
        const e = document.getElementById("width");
        return parseInt(e.value);
    }

    static get height() {
        const e = document.getElementById("height");
        return parseInt(e.value);
    }

    static get minOpacity() {
        const e = document.getElementById("opacity-a");
        return parseFloat(e.value);
    }

    static get maxOpacity() {
        const e = document.getElementById("opacity-b");
        return parseFloat(e.value);
    }

    static get minRadius() {
        const e = document.getElementById("radius-a");
        return parseFloat(e.value);
    }

    static get maxRadius() {
        const e = document.getElementById("radius-b");
        return parseFloat(e.value);
    }

    static get gradient() {
        if (typeof MainClass.__gradient === "undefined"
            || MainClass.__gradient === null) {
            const e = document.getElementById("gradient");
            MainClass.__gradient = new Gradient(e.value);
        }
        return MainClass.__gradient;
    }

    static get wrap() {
        const e = document.getElementById("wrap");
        return e.checked;
    }

    static get output() {
        return document.getElementById("output");
    }

    /*
     * To actually do the wrapping create a function called by stop that
     * automatically takes the outer parts that are not able to be drawn to and
     * copies them over to the other sides
     */
}

if (document.readyState === "complete") {
    MainClass.init();
} else {
    window.addEventListener("load", () => MainClass.init());
}