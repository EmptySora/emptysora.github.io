"use strict";

/** @type {HTMLDivElement} */
let topOld = null;
/** @type {HTMLDivElement} */
let botOld = null;
/** @type {HTMLDivElement} */
let topNew = null;
/** @type {HTMLDivElement} */
let botNew = null;
const images = [ // Path: images/
    "background.png",
    "background-dark.png",
    "blue_fire.png",
    "deepsea.png",
    "emerald.png",
    "fire.png",
    "garnet.png",
    "greenfire.png",
    "pink.png",
    "ruby.png",
    "sapphire.png"
];
const period = 5 * 1000; //300,000ms (5m)
const transitionTime = 5 * 1000; //10,000ms (10s)
let currentImage = images.length - 1;
//X: ms; transition is 10000ms
class Main {
    static doTransitionMain() {
        topOld.style.backgroundImage = `url("images/${images[currentImage]}")`;
        botOld.style.backgroundImage = `url("images/${images[currentImage]}")`;
        document.body.classList.add("transition");
        currentImage = (currentImage + 1) % images.length;
        topNew.style.backgroundImage = `url("images/${images[currentImage]}")`;
        botNew.style.backgroundImage = `url("images/${images[currentImage]}")`;
    }

    static finishTransitionMain() {
        document.body.classList.remove("transition");
    }

    static finishTransition() {
        try {
            Main.finishTransitionMain();
        } catch (e) {
            console.error(e);
        }
        window.setTimeout(Main.doTransition, period);
    }

    static doTransition() {
        try {
            Main.doTransitionMain();
        } catch (e) {
            console.error(e);
        }
        window.setTimeout(Main.finishTransition, transitionTime);
    }
}

function main() {
    [botNew, botOld, topNew, topOld] = document.querySelectorAll(".image");
    Main.doTransition();
    document.getElementById("close-button").addEventListener(
        "click",
        () => {
            const d = document.querySelector(".disclaimer");
            const p = d.parentElement;
            p.removeChild(d);
        }
    );
}

if (document.readyState === "complete") {
    main();
} else {
    window.addEventListener("load", main);
}