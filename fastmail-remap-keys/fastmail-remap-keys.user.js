// ==UserScript==
// @name            Fastmail Remap Keys
// @description     Remap Fastmail keyboard shortcuts
// @version         3
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           https://app.fastmail.com/*
// @run-at          document-start
// @grant           none
// @downloadURL     https://github.com/TheBestPessimist/UserScripts/raw/master/fastmail-remap-keys/fastmail-remap-keys.user.js
// ==/UserScript==

(() => {
    /**
     * What you press -> what Fastmail receives.
     * Left side: space-separated sequence of keys, using `event.key` names ("a", "G" = Shift+g, "*", "Enter") with optional "Ctrl-", "Alt-", "Meta-" prefixes.
     * Right side: Fastmail keys to replay, or a function to run instead.
     */
    const MAP = {
        'a': ['*', 'a'],   // select all (Fastmail: * then a). Replaces reply-all.
        'd': ['#'],   // Delete. Fastmail supports this already with key `d`, but the shortcut does not work for Drafts or Spam. If i use `#`, it works as delete `¯\_(ツ)_/¯`
        '[': ['`'], // toggle left sidebar with [
        ']': ['Ctrl-I'], // toggle right sidebar with ]
        'e': ['y'], // Archive
        // The g prefix delays Fastmail's own `g` (go to folder) until the timeout or the next key.
        'g i': () => goTo('/mail/Inbox/'),
        '1': () => goTo('/mail/Inbox/'),
        'g y': () => goTo('/mail/Youtube/'),
        '2': () => goTo('/mail/Youtube/'),
        'g c': () => goTo('/calendar/'),
        'g a': () => goTo('/mail/Archive/'),
    };

    /**
     * Opens a Fastmail URL without reloading the page: Fastmail's router listens to `popstate` and routes to the current `location.href`.
     * The query string is dropped: Fastmail keeps its global parameters (user id, act-as account...) in memory and adds them back to the URL after routing.
     *
     * In order not to have 2 entries in the browser history and force the user (me) to press back twice, we make this hack where we replace `history.pushState` --the one that fastmail uses to add all the global params-- with a `history.replaceState` for 1 single call that supposedly fastmail will do.
     */
    const goTo = (path) => {
        if (location.pathname === path) return;
        history.pushState(null, '', path);
        // Fastmail adds its global parameters back with its own pushState. Turn that one call into replaceState, so Back needs 1 press instead of 2.
        const restore = () => { delete history.pushState; clearTimeout(timer); };
        const timer = setTimeout(restore, 1000);
        history.pushState = (...args) => { restore(); history.replaceState(...args); };
        window.dispatchEvent(new PopStateEvent('popstate'));
    };
    const SEQUENCE_TIMEOUT_MS = 1000;
    const REPLAY_GAP_MS = 30;

    const keyName = (e) => (e.ctrlKey ? 'Ctrl-' : '') + (e.altKey ? 'Alt-' : '') + (e.metaKey ? 'Meta-' : '') + e.key;

    const isTyping = (e) => e.isComposing || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.nodeName) || e.target.isContentEditable;

    const send = (name) => {
        const m = name.match(/^((?:Ctrl-|Alt-|Meta-)*)(.+)$/);
        const key = m[2];
        const init = {
            key,
            ctrlKey: m[1].includes('Ctrl-'),
            altKey: m[1].includes('Alt-'),
            metaKey: m[1].includes('Meta-'),
            shiftKey: /^[A-Z]$/.test(key),
            bubbles: true,
            cancelable: true,
        };
        const notCancelled = document.dispatchEvent(new KeyboardEvent('keydown', init));
        // Like a real key press: printable keys also get a keypress, unless the keydown was cancelled. Fastmail reads the second key of `* a` only from keypress.
        if (notCancelled && key.length === 1 && !init.ctrlKey && !init.metaKey) {
            document.dispatchEvent(new KeyboardEvent('keypress', init));
        }
    };

    // Fastmail opens some menus asynchronously, so the second key of a prefix sequence needs a short gap.
    const play = async (keys) => {
        if (typeof keys === 'function') return keys();
        for (const [i, k] of keys.entries()) {
            if (i > 0) await new Promise((r) => setTimeout(r, REPLAY_GAP_MS));
            send(k);
        }
    };

    let pending = [];
    let timer;

    const flush = () => {
        clearTimeout(timer);
        const keys = pending;
        pending = [];
        keys.forEach(send);
    };

    window.addEventListener('keydown', (e) => {
        // Our own replayed events are untrusted and must reach Fastmail untouched.
        if (!e.isTrusted || isTyping(e) || ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

        const seq = [...pending, keyName(e)].join(' ');
        const swallow = () => {
            e.preventDefault();
            e.stopImmediatePropagation();
        };

        if (MAP[seq]) {
            swallow();
            clearTimeout(timer);
            pending = [];
            play(MAP[seq]);
        } else if (Object.keys(MAP).some((s) => s.startsWith(seq + ' '))) {
            swallow();
            clearTimeout(timer);
            pending = seq.split(' ');
            timer = setTimeout(flush, SEQUENCE_TIMEOUT_MS);
        } else if (pending.length) {
            // Not one of ours: give Fastmail the held-back prefix, then let this key through normally.
            flush();
        }
    }, true);
})();
