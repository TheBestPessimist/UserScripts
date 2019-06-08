// ==UserScript==
// @name            YouTube Description Expand
// @description     Expand YouTube description section
// @version         1.0
// @namespace       https://git.tbp.land/
// @match           *://*.youtube.com/*
// @compatible      firefox
// @run-at          document-idle
// ==/UserScript==


function yt(){
  document.querySelector("#more").click();
}

document.addEventListener('readystatechange', () => setTimeout(yt, 2000));
