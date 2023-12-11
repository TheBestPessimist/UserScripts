// ==UserScript==
// @name            YouTube Auto Dislike
// @description     Dislike every YouTube video. This is my rebuttal for YouTube hiding the Dislike count.
// @version         1.0.5
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           *://*.youtube.com/*
// @require         https://raw.githubusercontent.com/fuzetsu/userscripts/master/wait-for-elements/wait-for-elements.js
// ==/UserScript==
/**
 * Note: Using the function `waitForElems` from the required library above
 *
 * Thank you https://github.com/HatScripts/youtube-auto-liker for the inspiration.
 *
 * Debug details:
 *
 * http://localhost:63342/UserScripts/youtube-auto-dislike/youtube-auto-dislike.user.js
 */

const util = {
    log: (...args) => console.log(`%c${SCRIPT_NAME}:`, "font-weight: bold;color: green;", ...args)
};

const SCRIPT_NAME = "YouTube Auto Dislike";

const CSS = {
    dislike: "#above-the-fold #menu dislike-button-view-model button",
    likeButtonClicked: '#above-the-fold #menu like-button-view-model button[aria-pressed="true"]',
    dislikeButtonClicked: '#above-the-fold #menu dislike-button-view-model button[aria-pressed="true"]',
}

waitForElems({
    sel: CSS.dislike,
    onmatch: dislike,
    throttle: 1000
})

function dislike() {
    util.log("begin debug");

    const dislikeButton = document.querySelector(CSS.dislike);
    const likeButtonClicked = document.querySelector(CSS.likeButtonClicked);
    const dislikeButtonClicked = document.querySelector(CSS.dislikeButtonClicked);

    util.log("dislike button (next line should not be null):");
    util.log(dislikeButton);
    util.log(`like button already clicked: ${likeButtonClicked != null}`);
    util.log(likeButtonClicked);
    util.log(`dislike button already clicked: ${dislikeButtonClicked != null}`);
    util.log(dislikeButtonClicked);

    if (likeButtonClicked) {
        util.log("Video is Liked by user. Will not dislike. => Nothing to do here.");
        return
    }

    if (dislikeButtonClicked) {
        util.log("Video is already Disliked => Nothing to do here.");
        return
    }

    util.log("Will Dislike video.");
    dislikeButton.click();
    util.log("end debug");
}
