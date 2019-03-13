/*
Animation consists of white dots travelling up at varying
speeds and accelerations

When we draw the dots, we draw B color over the previous
coordinates, and A color over the new coordinate,

In between each frame we fill the canvas with C opacity bg color


The only other modification that I can think of is Collision detection,
ie: particles that bump other particles from behind randomly shift to the left or right
*/

const BACKGROUND = [0,0,0];
const DOT_COLOR = [255,255,255,1.0];
const TRAIL_OPACITY = 1.0;
const TRAIL_COLOR = [88, 0, 133,TRAIL_OPACITY];
const TRAIL_SATURATION_MIN = 100.0;
const TRAIL_SATURATION_MAX = 100.0;
const TRAIL_LUMINOSITY_MIN = 25.0;
const TRAIL_LUMINOSITY_MAX = 75.0;
const HSL_DRIFT = 0.1;
const MIN_SPEED = 0.1;
const MAX_SPEED = 2.0;
const MIN_ACCEL = 0.01;
const MAX_ACCEL = 0.50;
const MAX_DOTS = 250;
const DOT_RATE = 2;
const FADE_OPACITY = 0.2;
const FPS = 20;
const FRAME_INTERVAL = 1000 / FPS;

const LINE_WIDTH_MIN = 0.5;
const LINE_WIDTH_MAX = 3.0;

const LUMINOSITY_OSCILLATION_PERIOD_MIN = FPS * 0.5; // 3 seconds, PERIOD
const LUMINOSITY_OSCILLATION_PERIOD_MAX = FPS * 1; // 3 seconds, PERIOD
const LUMINOSITY_OSCILLATION_AMPLITUDE_MIN = 0.1; //A
const LUMINOSITY_OSCILLATION_AMPLITUDE_MAX = 25; //A
const LUMINOSITY_OSCILLATION_PHASE_SHIFT = 0; //C

const LINE_WIDTH_OSCILLATION_PERIOD_MIN = FPS * 0.5; // 3 seconds, PERIOD
const LINE_WIDTH_OSCILLATION_PERIOD_MAX = FPS * 1; // 3 seconds, PERIOD
const LINE_WIDTH_OSCILLATION_AMPLITUDE_MIN = 0.1; //A
const LINE_WIDTH_OSCILLATION_AMPLITUDE_MAX = 2.0; //A
const LINE_WIDTH_OSCILLATION_PHASE_SHIFT = 0; //C
//vertical shift (D) is the l parameter of the dot
//2PI / LUM_OSC_PER = B
var TRAIL_HSL_START = 180.0;
var TRAIL_HSL_END = 240.0;

var canvas;
var context;
var size;
var dots = [];
var FRAME_COUNT = 0;
//Asin(B(x-C))+D
//Amplitude, Frequency, H-Shift, V-Shift

function rand(min,max) {
    return (Math.random() * (max - min)) + min;
}
function getB(period) {
    return (2 * Math.PI) / period;
}
function sinusoidal(a,b,c,d) {
    return a * Math.sin(b * (FRAME_COUNT - c)) + d;
}

function animation() {
    FRAME_COUNT += 1;
    context.beginPath();
    context.fillStyle = `rgba(${BACKGROUND.join(",")},${FADE_OPACITY})`;
    context.strokeStyle = `rgba(${BACKGROUND.join(",")},${FADE_OPACITY})`;
    context.moveTo(0,0);
    context.rect(0,0,Math.round(size.width),Math.round(size.height));
    context.fill();
    var i;
    for (i = 0; i < DOT_RATE; i += 1) {
        if (dots.length >= MAX_DOTS) {
            break;
        }
        newDot();
    }
    moveDots();
    window.setTimeout(animation,FRAME_INTERVAL);
}

function start() {
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");
    size = canvas.getBoundingClientRect();
    canvas.setAttribute("width",Math.round(size.width));
    canvas.setAttribute("height",Math.round(size.height));
    context.beginPath();
    context.fillStyle = `rgba(${BACKGROUND.join(",")},1)`;
    context.strokeStyle = `rgba(${BACKGROUND.join(",")},1)`;
    context.fillRect(0,0,Math.round(size.width),Math.round(size.height));
    window.setTimeout(animation,FRAME_INTERVAL);
}

function moveDots() {
    var i;
    var d; 
    var py;
    var l;
    var w;
    for (i = 0; i < dots.length; i += 1) {
        d = dots[i];
        if (d.py === undefined) {
            d.px = d.x;
            d.py = d.y;
            continue;
        }
        if (d.ppy === undefined) {
            d.ppx = d.px;
            d.ppy = d.py;
            d.px = d.x;
            d.py = d.y
            continue;
        }
        py = d.y;
        px = d.x;
        d.y -= d.s;
        d.s += d.a;
        l = sinusoidal(d.pa,d.pb,d.pc,d.l);
        w = sinusoidal(d.bpa,d.bpb,d.bpc,d.w);
        context.lineWidth = w;
        context.beginPath();
        context.strokeStyle = `hsla(${d.c},${d.sa}%,${l}%,${TRAIL_OPACITY})`;//`rgba(${d.c.join(",")},${TRAIL_OPACITY})`;
        context.fillStyle = `hsla(${d.c},${d.sa}%,${l}%,${TRAIL_OPACITY})`;//`rgba(${d.c.join(",")},${TRAIL_OPACITY})`;
        context.moveTo(Math.round(d.ppx),Math.round(d.ppy));
        context.lineTo(Math.round(d.px),Math.round(d.py));
        context.stroke();
        //context.strokeStyle = `rgba(${DOT_COLOR.join(",")})`;
        //context.fillStyle = `rgba(${DOT_COLOR.join(",")})`;
        context.lineTo(Math.round(d.x),Math.round(d.y));
        context.stroke();
        //context.rect(d.x,d.y,1,1);
        //context.fill();
        //context.stroke();
        d.ppx = d.px;
        d.ppy = d.py;
        d.px = px;
        d.py = py;
        if (d.ppy < 0) {
            dots.splice(i,1);
            i -= 1;
        }
        context.lineWidth = 1;
    }
}

function newDot() {
    dots.push({
        x: rand(0,size.width),
        y: size.height,
        s: rand(MIN_SPEED,MAX_SPEED),
        a: rand(MIN_ACCEL,MAX_ACCEL),
        c: rand(TRAIL_HSL_START,TRAIL_HSL_END),
        l: rand(TRAIL_LUMINOSITY_MIN,TRAIL_LUMINOSITY_MAX),
        sa: rand(TRAIL_SATURATION_MIN,TRAIL_SATURATION_MAX),
        c2: [Math.floor(rand(0,255)),Math.floor(rand(0,255)),Math.floor(rand(0,255))],
        f: FRAME_COUNT,
        pa: rand(LUMINOSITY_OSCILLATION_AMPLITUDE_MIN,LUMINOSITY_OSCILLATION_AMPLITUDE_MAX),
        pb: getB(rand(LUMINOSITY_OSCILLATION_PERIOD_MIN,LUMINOSITY_OSCILLATION_PERIOD_MAX)),
        pc: FRAME_COUNT + LUMINOSITY_OSCILLATION_PHASE_SHIFT,
        bpa: rand(LINE_WIDTH_OSCILLATION_AMPLITUDE_MIN,LINE_WIDTH_OSCILLATION_AMPLITUDE_MAX),
        bpb: getB(rand(LINE_WIDTH_OSCILLATION_PERIOD_MIN,LINE_WIDTH_OSCILLATION_PERIOD_MAX)),
        bpc: FRAME_COUNT + LINE_WIDTH_OSCILLATION_PHASE_SHIFT,
        w: rand(LINE_WIDTH_MIN,LINE_WIDTH_MAX)
    });

    //hsl drift.
    TRAIL_HSL_START += HSL_DRIFT;
    TRAIL_HSL_END += HSL_DRIFT;
    if(TRAIL_HSL_START < 0) {
        TRAIL_HSL_START += 360;
    }
    if(TRAIL_HSL_END < 0) {
        TRAIL_HSL_END += 360;
    }
    TRAIL_HSL_START %= 360;
    TRAIL_HSL_END %= 360;
    if(TRAIL_HSL_START > TRAIL_HSL_END) {
        TRAIL_HSL_START -= 360;
    }
}

window.addEventListener("load",start);
