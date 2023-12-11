// ==UserScript==
// @name            YouTube Auto Dislike
// @description     Dislike every YouTube video. This is my rebuttal for YouTube hiding the Dislike count.
// @version         1.0.8
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
    likeButton: '#above-the-fold #menu like-button-view-model button',
    dislikeButton: '#above-the-fold #menu dislike-button-view-model button',
}

waitForElems({
    sel: CSS.dislikeButton,
    onmatch: dislike,
    throttle: 10
})

async function dislike() {
    // need to wait here a little for the elements to load, else `ariaPressed` is null.
    await new Promise(resolve => setTimeout(resolve, 1000));

    const likeButton = document.querySelector(CSS.likeButton);
    const dislikeButton = document.querySelector(CSS.dislikeButton);

    /*
     FUCK JAVASCRIPT
     FUCK YOU WHOEVER INVENTED TRUTHY AND FALSY
     FUCK YOU WHOEVER THINGS IF NORMAL TO NOT HAVE TRUE AND FALSE AS PROPER TYPES BUT AS FUCKING STRINGS
     FUCK YOU
     FUCK YOU
     FUCK YOU
     FUCKING FUCK YOU, YOU FUCKING GARBAGE LANGUAGE
     FUCK YOUR FUCKING APOLOGISTS
     WHAT THE FUCKING FUCK IS FUCKING `=== 'true'`??? WHY NOT SIMPLY `== true` LIKE ANY FUCKING SANE LANGUAGE DOES?
     FUCK YOU
     FUCK TYPE COERCION
     FUCK YOU WHOEVER THINKS FUCKING `== 'true'`, `=== 'true'`, `== true`, `=== true` IS 'RIGHT' AND 'SANE' AND 'EASY'
     ALL THIS FUCKING SHIT IS RETARDED

     const likeButtonClicked = likeButton.ariaPressed == 'true'
     const dislikeButtonClicked = dislikeButton.ariaPressed == 'true'
     */

    util.log(`like button ariaPressed value: ${likeButton.ariaPressed}`);
    util.log(likeButton);
    util.log(`dislike button ariaPressed value: ${dislikeButton.ariaPressed}`);
    util.log(dislikeButton);

    // noinspection EqualityComparisonWithCoercionJS
    if (likeButton.ariaPressed == 'true') {
        util.log("Video is Liked by user. Will not dislike. => Nothing to do here.");
        return
    }

    // noinspection EqualityComparisonWithCoercionJS
    if (dislikeButton.ariaPressed == 'true') {
        util.log("Video is already Disliked => Nothing to do here.");
        return
    }

    util.log("Will Dislike video.");
    dislikeButton.click();
}
