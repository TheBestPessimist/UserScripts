// ==UserScript==
// @name            Microshitsoft Feces
// @description     Set the correct name for that fucking abomination which I am forced to use
// @version         0.0.0.0.0.2
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           *://*.teams.microsoft.com/*
// @require https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// ==/UserScript==

/*
Documentation for the required userscript:
- https://violentmonkey.github.io/guide/observing-dom/
- https://violentmonkey.github.io/vm-dom/functions/observe.html
 */

const DOWNLOAD_THE_FUCKING_APP_CLASS = "#downloadDesktopClient"

VM.observe(document.body, () => {
    // Find the target node
    const node = document.querySelector(DOWNLOAD_THE_FUCKING_APP_CLASS);
    node.remove()
});
