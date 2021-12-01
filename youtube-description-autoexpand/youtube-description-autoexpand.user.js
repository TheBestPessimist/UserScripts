// ==UserScript==
// @name            YouTube Description Autoexpand
// @description     Expand YouTube description section automatically
// @version         1.4.4
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           *://*.youtube.com/*
// @require         https://ghcdn.rawgit.org/fuzetsu/userscripts/3d35399f95c3b6796210f5594bcbf243297f8f96/wait-for-elements/wait-for-elements.js
// ==/UserScript==
/**
 * Note: Using the function `waitForElems` from the required library above
 */

const util = {
    log: (...args) => console.log(`%c${SCRIPT_NAME}:`, 'font-weight: bold;color: purple;', ...args)
};


const SCRIPT_NAME = 'YouTube Description Autoexpand';

const showMoreButtonId = '#more > yt-formatted-string';


waitForUrl(
    () => true, // match any url
    () => {
        // Need a timeout here, otherwise the function will run for the old link.
        // Not sure why, but it looks as if the html is not yet changed even though the url is.
        setTimeout(
            () => waitForElems({
                sel: showMoreButtonId,
                onmatch: expand,
            }),
            1000
        )
    }
)

function expand(btn) {
    util.log('Expanding video description.');
    util.log('begin debug');
    util.log(btn);
    btn.click();
    util.log('end debug');
}
