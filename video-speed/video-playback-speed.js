// ==UserScript==
// @name         Video Playback Speed
// @description  Change video playback speed with keys `[`, `]`, `\`
// @version      1.0.1
// @author       TheBestPessimist
// @run-at       document-end
// @namespace    https://git.tbp.land/
// @grant        none
//
// @match        *://*.youtube.com/*
// @match        *://youtube.com/*
// @match        *://*.vimeo.com/*
// @match        *://vimeo.com/*
// ==/UserScript==

// Code taken from: https://greasyfork.org/en/scripts/30506-video-speed-buttons


const vsc = {
    name: "Video Playback Speed",
    log: (...args) => console.log(`%c${vsc.name}:`, "font-weight: bold;color: orange;", ...args),
    getVideo: _ => document.querySelector("video"), // Yep, it's really that simple.
    changeValue: 1.1,
    ev_keydown: function (ev) {
        let currentSpeed = vsc.getVideo().playbackRate
        let newSpeed = 0

        if (vsc.getVideo() === null)
            return true;

        // increase
        if (ev.key === "]")
            newSpeed = currentSpeed * vsc.changeValue;

        // decrease
        if (ev.key === "[")
            newSpeed = currentSpeed * (1 / vsc.changeValue);

        // reset
        if (ev.key === "\\")
            newSpeed = 1;

        // i like pretty numbers :^)
        newSpeed = newSpeed.toFixed(2)

        vsc.log(`Speed: ${currentSpeed} -> ${newSpeed}`);
        vsc.getVideo().playbackRate = newSpeed;
    }
};

document.body.addEventListener("keydown", vsc.ev_keydown);
vsc.log(`loaded`);
