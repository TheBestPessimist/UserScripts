// ==UserScript==
// @name            Microshitsoft Feces
// @description     Set the correct name for that fucking abomination which I am forced to use
// @version         0.0.0.0.0.1
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           *://*.teams.microsoft.com/*
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// ==/UserScript==

const TITLE_CLASS = ".teams-title"

VM.observe(document.body, () => {
    // Find the target node
    const node = document.querySelector(TITLE_CLASS);

    if (node) {
        node.textContent = "Microshitsoft Feces"

        // disconnect observer
        return true;
    }
});
