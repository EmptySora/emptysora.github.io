"use strict";

function $(x) {
    return document.querySelector(`#${x}`);
}
let int = null;
let cargs = null;
/*
 * Usage:
 * get=get value
 * set=set value
 * set true=enable
 * set false=disable
 * width,height,opacity-a,opacity-b,radius-a,radius-b,gradient,start,stop,output
 */
const params = new Proxy({}, {
    get: (t, p) => {
        const x = document.getElementById(p);
        return x.value || x.checked || x;
    },
    set: (t, p, v) => {
        const x = document.getElementById(p);
        if (v === true) {
            x.removeAttribute("disabled");
        } else if (v === false) {
            x.setAttribute("disabled", "disabled");
        } else {
            x.value = v;
        }
        return true;
        /*
         * When the heck did they change it so you had to return
         * whether or not the assignment succeeded...?
         */
    }
});

function stopDrawing() {
    window.clearInterval(int);
    params.width = true;
    params.height = true;
    params["opacity-a"] = true;
    params["opacity-b"] = true;
    params["radius-a"] = true;
    params["radius-b"] = true;
    params.wrap = true;
    params.gradient = true;
    params.start = true;
    params.stop = false;
}

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

function getArgs() {
    const ret = {
        width: parseInt(params.width),
        height: parseInt(params.height),
        gradient: new Gradient(params.gradient),
        wrap: document.querySelector("#wrap").checked
    };
    let opa = params["opacity-a"];
    let opb = params["opacity-b"];
    let raa = params["radius-a"];
    let rab = params["radius-b"];
    if (opa.length > 0) {
        opb = opb || opa;
    }
    if (opb.length > 0) {
        opa = opa || opb;
    }
    if (raa.length > 0) {
        rab = rab || raa;
    }
    if (rab.length > 0) {
        raa = raa || rab;
    }
    opa = parseFloat(opa);
    opb = parseFloat(opb);
    raa = parseFloat(raa);
    rab = parseFloat(rab);
    ret.radius = {
        min: Math.min(raa, rab),
        max: Math.max(raa, rab)
    };
    ret.opacity = {
        min: Math.min(opa, opb),
        max: Math.max(opa, opb)
    };
    return ret;
}

function addOpacity(color, opacity) {
    return color.replace("rgb(", "rgba(").replace(")", `,${opacity})`);
}

function randint(xmin, xmax) {
    let min = xmin;
    let max = xmax;
    if (typeof min === "undefined") {
        min = 0;
    }
    if (typeof max === "undefined") {
        max = 0xFFFFFFFF;
    }
    min = Math.floor(min);
    max = Math.floor(max);
    let rand = new Uint32Array(1);
    window.crypto.getRandomValues(rand);
    [rand] = rand;
    rand %= max - min;
    return rand + min;
}

function randfloat() {
    const rand = new Uint32Array(1);
    window.crypto.getRandomValues(rand);
    return rand[0] / 0xFFFFFFFF;
}

function drawCircle() {
    const o = params.output;
    const ctx = o.getContext("2d");
    //If wrapping, offset x and y by 0.5*radius.current (between min and max)
    /* eslint-disable-next-line no-extra-parens */
    const radius = (randfloat() * (cargs.radius.max - cargs.radius.min))
        + cargs.radius.min;
    let x = randint(0, o.width);
    let y = randint(0, o.width);
    /* eslint-disable-next-line no-extra-parens */
    const opacity = (randfloat() * (cargs.opacity.max - cargs.opacity.min))
        + cargs.opacity.min;
    const color = addOpacity(cargs.gradient.getColor(randfloat()), opacity);
    ctx.moveTo(x, y);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
    if (cargs.wrap) {
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

function drawCircles() {
    for (let i = 0; i < 25; i += 1) {
        drawCircle();
    }
}

function showGradient(gradient) {
    const gradp = params.grad;
    const c = params.grad;
    const ctx = gradp.getContext("2d");
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

function clearCircles() {
    const o = params.output;
    const ctx = o.getContext("2d");
    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, o.width, o.height);
    cargs = getArgs();
    ctx.fillStyle = "white";
    o.setAttribute("width", cargs.width);
    o.setAttribute("height", cargs.height);
    showGradient(cargs.gradient);
}

function startDrawing() {
    params.width = false;
    params.height = false;
    params["opacity-a"] = false;
    params["opacity-b"] = false;
    params["radius-a"] = false;
    params["radius-b"] = false;
    params.wrap = false;
    params.gradient = false;
    params.start = false;
    params.stop = true;
    clearCircles();
    int = window.setInterval(drawCircles, 1);
}

function validate(e) {
    //Todo: finish this.
}

/*
 * To actually do the wrapping create a function called by stop that
 * automatically takes the outer parts that are not able to be drawn to and
 * copies them over to the other sides
 */

function main() {
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
    change.forEach((id) => $(id).addEventListener("change", validate));
    keyup.forEach((id) => $(id).addEventListener("keyup", validate));
    $("start").addEventListener("click", startDrawing);
    $("stop").addEventListener("click", stopDrawing);
}

if (document.readyState === "complete") {
    main();
} else {
    window.addEventListener("load", main);
}
/*
 * <html>
 *     <body>
 *         Width: <input id="width"/><br/>
 *         Height: <input id="height"/><br/>
 *         Opacity: <input id="opacity-a"/> - <input id="opacity-b"/><br/>
 *         Radius: <input id="radius-a"/> - <input id="radius-b"/><br/>
 *         Wrap Edges: <input id="wrap"/><br/>
 *         Gradient:<br/>
 *         <textarea id="gradient"></textarea><br/>
 *         <input id="start"/>&nbsp;&bullet;&nbsp;
 *         <input disabled="disabled" id="stop"/><br/>
 *         <hr size="+2" color="black"/>
 *         <canvas id="output">
 *             Dude, get a better browser, yours sucks.
 *         </canvas><br/>
 *         <br/>
 *         <canvas id="grad" width="500" height="250">
 *             Seriously dude, your browser sucks
 *         </canvas>
 *     </body>
 * </html>
 */