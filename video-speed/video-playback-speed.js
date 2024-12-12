// ==UserScript==
// @name         Video Playback Speed
// @description  Change video playback speed with keys `[`, `]`, `\`
// @version      1.0.0
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
    name:     "Video Speed Controller",
    getvideo: _ => document.querySelector("video"), // Yep, it's really that simple.
    rates:    [0.25, 0.5, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.5, 5.75, 8, 16],
    selrate:  2,
    ev_keydown: function(ev) {
        let change = 0;

        if (vsc.getvideo() === null)
            return true;

        if (ev.key === "]")
            change = +1;

        if (ev.key === "[")
            change = -1;

        if (ev.key === "\\")
            change = -(vsc.selrate - 2);

        vsc.selrate = (vsc.rates.length + vsc.selrate + change) % vsc.rates.length;
        vsc.getvideo().playbackRate = vsc.rates[vsc.selrate];
        console.log(`[${vsc.name}] Speed set to ${vsc.rates[vsc.selrate]}`);
    }
};


document.body.addEventListener("keydown", vsc.ev_keydown);
console.clear();
console.log(`[${vsc.name}] loaded`);
