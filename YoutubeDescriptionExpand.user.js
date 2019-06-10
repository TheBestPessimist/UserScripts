// ==UserScript==
// @name            YouTube Description Expand
// @description     Expand YouTube description section
// @version         1.2
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           *://*.youtube.com/*
// @compatible      firefox
// ==/UserScript==


function yt(){
  document.querySelector("#more").click();
}

document.addEventListener('readystatechange', () => setTimeout(yt, 2000));
