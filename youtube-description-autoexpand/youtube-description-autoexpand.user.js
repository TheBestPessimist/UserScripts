// ==UserScript==
// @name            YouTube Description Autoexpand
// @description     Expand YouTube description section automatically
// @version         1.4.10
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           *://*.youtube.com/*
// @require         https://raw.githubusercontent.com/fuzetsu/userscripts/master/wait-for-elements/wait-for-elements.js
// @downloadURL     https://github.com/TheBestPessimist/UserScripts/raw/master/youtube-description-autoexpand/youtube-description-autoexpand.user.js
// ==/UserScript==
/**
 * Note: Using the function `waitForElems` from the required library above
 */

const util = {
    log: (...args) => console.log(`%c${SCRIPT_NAME}:`, 'font-weight: bold;color: purple;', ...args)
};

const SCRIPT_NAME = 'YouTube Description Autoexpand';

const showMoreButtonId = '#description #expand';

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
