// ==UserScript==
// @name            YouTube Auto Dislike
// @description     Dislike every YouTube video. This is my rebuttal for YouTube disabling the Dislike count.
// @version         1.0.0
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           *://*.youtube.com/*
// @require         https://ghcdn.rawgit.org/fuzetsu/userscripts/3d35399f95c3b6796210f5594bcbf243297f8f96/wait-for-elements/wait-for-elements.js
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
    like: "ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:nth-child(1)",
    dislike: "ytd-video-primary-info-renderer #top-level-buttons-computed > ytd-toggle-button-renderer:nth-child(2)",
    buttonClicked: "style-default-active"
}


waitForUrl(
    () => true, // match any url
    () => {
        // Need a timeout here, otherwise the function will run for the old link.
        // Not sure why, but it looks as if the html is not yet changed even though the url is.
        setTimeout(
            () => waitForElems({
                sel: CSS.like,
                onmatch: dislike,
            }),
            1000
        )
    }
)


function dislike(btn) {
    util.log("begin debug")
    util.log(btn)

    const likeButton = document.querySelector(CSS.like)
    const dislikeButton = document.querySelector(CSS.dislike)

    if (likeButton.classList.contains(CSS.buttonClicked)) {
        util.log("Video is Liked by user => Nothing to do here. Will not dislike.")
        return
    }

    if (dislikeButton.classList.contains(CSS.buttonClicked)) {
        util.log("Video is already Disliked => Nothing to do here.")
        return
    }

    util.log("Will Dislike video.")
    dislikeButton.click()
    util.log("end debug")
}
