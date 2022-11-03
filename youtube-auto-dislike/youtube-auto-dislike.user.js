// ==UserScript==
// @name            YouTube Auto Dislike
// @description     Dislike every YouTube video. This is my rebuttal for YouTube hiding the Dislike count.
// @version         1.0.2
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
    dislike: "#above-the-fold #menu #segmented-dislike-button .yt-spec-button-shape-next",
    likeButtonClicked: '#above-the-fold #menu #segmented-like-button .yt-spec-button-shape-next[aria-pressed="true"]',
    dislikeButtonClicked: '#above-the-fold #menu #segmented-dislike-button .yt-spec-button-shape-next[aria-pressed="true"]',
}

waitForUrl(
    () => true, // match any url
    () => {
        // Need a timeout here, otherwise the function will run for the old link.
        // Not sure why, but it looks as if the html is not yet changed even though the url is.
        setTimeout(
            () => waitForElems({
                sel: CSS.dislike,
                onmatch: dislike,
            }),
            1000
        )
    }
)


function dislike(btn) {
    util.log("begin debug");

    const dislikeButton = document.querySelector(CSS.dislike);
    const likeButtonClicked = document.querySelector(CSS.likeButtonClicked);
    const dislikeButtonClicked = document.querySelector(CSS.dislikeButtonClicked);

    util.log("dislike button:");
    util.log(dislikeButton);
    util.log("likeButtonClicked");
    util.log(likeButtonClicked);
    util.log("dislikeButtonClicked");
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
