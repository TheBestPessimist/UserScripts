// ==UserScript==
// @name            GitHub Unsplit PR Title
// @description     When GitHub truncates a long single-commit title into "title…" + "…description", glue it back together
// @version         1.0.0
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           *://github.com/*
// @run-at          document-start
// @grant           none
// @downloadURL     https://github.com/TheBestPessimist/UserScripts/raw/master/github-unsplit-pr-title/github-unsplit-pr-title.user.js
// ==/UserScript==

const SCRIPT_NAME = 'GitHub Unsplit PR Title';

const util = {
    log: (...args) => console.log(`%c${SCRIPT_NAME}:`, 'font-weight: bold;color: purple;', ...args)
};

const ELLIPSIS = '…';

const TITLE_SELECTOR = 'input[name="pull_request[title]"]';
const BODY_SELECTOR = 'textarea[name="pull_request[body]"]';

/**
 * @param {string} title  current title field value
 * @param {string} body   current body field value
 * @returns {{title: string, body: string} | null} the fixed values, or null if this isn't a GitHub split
 */
function unsplit(title, body) {
    if (!title.endsWith(ELLIPSIS) || !body.startsWith(ELLIPSIS)) {
        return null;
    }

    // The overflow of the first line is everything up to the first newline in the body.
    // Anything after that (real commit body, PR template, ...) must be preserved.
    const lineBreak = /\n\s*/.exec(body);
    const titleTail = body.slice(ELLIPSIS.length, lineBreak?.index);
    const remainingBody = lineBreak ? body.slice(lineBreak.index + lineBreak[0].length) : '';

    return {
        // GitHub cuts mid-word (see "diffe…" / "…rent"), so the two halves are concatenated with no separator.
        title: title.slice(0, -ELLIPSIS.length) + titleTail,
        body: remainingBody,
    };
}

/**
 * Set a form field's value in a way GitHub's own JS notices (its "unsaved changes" / session-resume logic listens to `input`).
 * @param {HTMLInputElement | HTMLTextAreaElement} field
 * @param {string} value
 */
function setFieldValue(field, value) {
    field.value = value;
    field.dispatchEvent(new Event('input', {bubbles: true}));
    field.dispatchEvent(new Event('change', {bubbles: true}));
}

function fixPrForm() {
    if (!location.pathname.includes('/compare/')) {
        return;
    }

    const titleField = document.querySelector(TITLE_SELECTOR);
    const bodyField = document.querySelector(BODY_SELECTOR);
    if (!titleField?.checkVisibility() || !bodyField?.checkVisibility()) {
        return;
    }

    const fixed = unsplit(titleField.value, bodyField.value);
    if (!fixed) {
        return;
    }

    util.log(`restoring title: "${titleField.value}" -> "${fixed.title}"`);
    setFieldValue(titleField, fixed.title);
    setFieldValue(bodyField, fixed.body);
}

// Once fixed, the "…" / "…" condition no longer holds, so re-running on every mutation is harmless.
new MutationObserver(fixPrForm).observe(document.documentElement, {childList: true, subtree: true});
fixPrForm();
