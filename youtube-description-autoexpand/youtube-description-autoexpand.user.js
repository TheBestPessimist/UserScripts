// ==UserScript==
// @name            YouTube Description Autoexpand
// @description     Expand YouTube description section automatically
// @version         1.4
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           *://*.youtube.com/*
// @compatible      firefox
// @require         https://gitcdn.xyz/repo/fuzetsu/userscripts/b38eabf72c20fa3cf7da84ecd2cefe0d4a2116be/wait-for-elements/wait-for-elements.js
// ==/UserScript==
/**
 * Note: Using the function `waitForElems` from the required library above
 */

const util = {
    log: (...args) => console.log(`%c${SCRIPT_NAME}:`, 'font-weight: bold;color: purple;', ...args)
};


const SCRIPT_NAME = 'YouTube Description Autoexpand';

const showMoreButtonId = '#more > yt-formatted-string';


waitForElems({
    sel: showMoreButtonId,
    onmatch: btn => {
        util.log('Expanding video description.');
        console.log('begin debug');
        console.log(btn);
        console.log('end debug');
        btn.click();
    }
});








