function a(b) { return document.querySelector("#" + b); }
var params = new Proxy({}, {
    get: function (t, p, r) {
        return a(p).value || a(p).checked || a(p);
    },
    set: function (t, p, v, r) {
        if (v === true)
            a(p).removeAttribute("disabled");
        else if (v === false)
            a(p).setAttribute("disabled", "disabled");
        else
            a(p).value = v;
    }
});
//get=get value
//set=set value
//set true=enable
//set false=disable
//width,height,opacity-a,opacity-b,radius-a,radius-b,gradient,start,stop,output
var int = null;
function start() {
    params.width = false;
    params.height = false;
    params["opacity-a"] = false;
    params["opacity-b"] = false;
    params["radius-a"] = false;
    params["radius-b"] = false;
    params["wrap"] = false;
    params.gradient = false;
    params.start = false;
    params.stop = true;
    clearCircles();
    int = window.setInterval(drawCircles, 1);
}
function getArgs() {
    var ret = {
        width: parseInt(params.width),
        height: parseInt(params.height),
        gradient: new Gradient(params.gradient),
        wrap: document.querySelector("#wrap").checked
    };
    var opa = params["opacity-a"];
    var opb = params["opacity-b"];
    var raa = params["radius-a"];
    var rab = params["radius-b"];
    if (opa.length > 0) opb = opb || opa;
    if (opb.length > 0) opa = opa || opb;
    if (raa.length > 0) rab = rab || raa;
    if (rab.length > 0) raa = raa || rab;
    opa = parseFloat(opa);
    opb = parseFloat(opb);
    raa = parseFloat(raa);
    rab = parseFloat(rab);
    ret.radius = { min: Math.min(raa, rab), max: Math.max(raa, rab) };
    ret.opacity = { min: Math.min(opa, opb), max: Math.max(opa, opb) };
    return ret;
}
function stop() {
    window.clearInterval(int);
    params.width = true;
    params.height = true;
    params["opacity-a"] = true;
    params["opacity-b"] = true;
    params["radius-a"] = true;
    params["radius-b"] = true;
    params["wrap"] = true;
    params.gradient = true;
    params.start = true;
    params.stop = false;
}
function Gradient(grad) {
    var ranges = [];
    grad = grad.replace(/[\s\r\n\f\t\b]+/g, "");
    let parts = grad.split('|', 2);
    let colors = parts[0].split(',');//a,b|b,c|c,d ==interval1
    let stops = parts[1].split(',');//a,z,b|b,y,c| ==interval2
    for (let i = 0, j = 0; i < colors.length - 1; i++, j += 2) {
        let c1 = "#" + colors[i];
        let c2 = "#" + colors[i + 1];
        let start = stops[j];
        let mid = stops[j + 1];
        let end = stops[j + 2];
        ranges.push([[c1, c2], [start, mid, end]]);
    }
    function inrange(range, point) {
        var set = range[1];
        return (point >= set[0]) && (point <= set[2]);
    }
    function getrange(point) {
        for (let i = 0; i < ranges.length; i++) {
            if (inrange(ranges[i], point))
                return ranges[i];
        }
        return null;
    }
    function ratio(point, range) {
        var start = range[1][0];
        var mid = range[1][1];
        var end = range[1][2];
        var sega = inrange([null, [start, null, mid]], point);
        var segb = inrange([null, [mid, null, end]], point);
        if (sega && segb)
            return 0.5;//even
        if (sega)
            return ((point - start) / (mid - start)) / 2;
        if (segb)
            return (((point - mid) / (end - mid)) / 2) + 0.5;
    }
    function getColor(point) {
        var range = getrange(point);
        var rat = ratio(point, range);
        var color = colorMix(range[0][0], range[0][1], rat);
        return color;
    }
    function parseColor(a) {
        var r = parseInt(a.substr(1, 2), 16);
        var g = parseInt(a.substr(3, 2), 16);
        var b = parseInt(a.substr(5, 2), 16);
        return [r, g, b];
    }
    function colorMix(a, b, ratio) {
        var c1 = parseColor(a);
        var c2 = parseColor(b);
        //console.log(a,b,ratio,c1,c2);
        return "rgb(" + ([(c1[0] * (1 - ratio)) + (c2[0] * ratio),
        (c1[1] * (1 - ratio)) + (c2[1] * ratio),
        (c1[2] * (1 - ratio)) + (c2[2] * ratio)]).join(",") + ")";//*(1-ratio),*ratio
    }
    this.getColor = getColor;
    this.ranges = ranges;
    this.colorMix = colorMix;
}
function drawCircles() {
    for (let i = 0; i < 25; i++)
        drawCircle();
}
function drawCircle() {
    var o = params.output;
    var ctx = o.getContext("2d");
    //if wrapping, offset x and y by 0.5*radius.current (between min and max)
    var radius = randfloat() * (cargs.radius.max - cargs.radius.min) + cargs.radius.min;
    var x = randint(0, o.width);
    var y = randint(0, o.width);
    var opacity = randfloat() * (cargs.opacity.max - cargs.opacity.min) + cargs.opacity.min;
    var color = addOpacity(cargs.gradient.getColor(randfloat()), opacity);
    ctx.moveTo(x, y);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
    if (cargs.wrap) {
        var ox = x;
        var oy = y;
        var inverseCircle = false;
        if (x <= radius) {
            inverseCircle = true;
            x = o.width + x;
        }
        else if (x >= (o.width - radius)) {
            x = x - o.width;
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
        }
        else if (y >= (o.height - radius)) {
            y = y - o.height;
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
            inverseCircle++;
            x = o.width + x;
        }
        else if (x >= (o.width - radius)) {
            x = x - o.width;
            inverseCircle++;
        }
        if (y <= radius) {
            inverseCircle++;
            y = o.height + y;
        }
        else if (y >= (o.height - radius)) {
            y = y - o.height;
            inverseCircle++;
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
var cargs = null;
function clearCircles() {
    var o = params.output;
    var ctx = o.getContext("2d");
    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, o.width, o.height);
    cargs = getArgs();
    ctx.fillStyle = "white";
    o.setAttribute("width", cargs.width);
    o.setAttribute("height", cargs.height);
    showGradient(cargs.gradient);
}
function addOpacity(color, opacity) {
    return color.replace("rgb(", "rgba(").replace(")", "," + opacity + ")");
}
function randint(min, max) {
    if (typeof min == "undefined")
        min = 0;
    if (typeof max == "undefined")
        max = 0xFFFFFFFF;
    min = Math.floor(min);
    max = Math.floor(max);
    var rand = new Uint32Array(1);
    window.crypto.getRandomValues(rand);
    rand = rand[0];
    rand %= max - min;
    return rand + min;
}
function randfloat() {
    var rand = new Uint32Array(1);
    window.crypto.getRandomValues(rand);
    return rand[0] / 0xFFFFFFFF;
}
function validate(source) {

}
function showGradient(gradient) {
    var gradp = params.grad;
    var c = params.grad;
    var ranges = gradient.ranges;
    var ctx = gradp.getContext("2d");
    //x11=start*c.width
    //x12=mid*c.width
    //x21=mid*c.width
    //x22-end*c.width
    //y1=0
    //y2=0
    for (let i = 0; i < ranges.length; i++) {
        let range = ranges[i];
        let g1 = ctx.createLinearGradient(range[1][0] * c.width, 0, range[1][1] * c.width, 0);
        let g2 = ctx.createLinearGradient(range[1][1] * c.width, 0, range[1][2] * c.width, 0);
        g1.addColorStop(0, range[0][0]);
        g1.addColorStop(1, gradient.colorMix(range[0][0], range[0][1], 0.5));
        g2.addColorStop(0, gradient.colorMix(range[0][0], range[0][1], 0.5));
        g2.addColorStop(1, range[0][1]);
        ctx.fillStyle = g1;
        ctx.fillRect(range[1][0] * c.width, 0, range[1][1] * c.width, c.height);
        ctx.fillStyle = g2;
        ctx.fillRect(range[1][1] * c.width, 0, range[1][2] * c.width, c.height);
    }
}
            //to actually do the wrapping create a function called by stop that automatically takes the outer parts that are not able to be drawn to and copies them over to the other sides