// ==UserScript==
// @name            Fastmail Remap Keys
// @description     Remap Fastmail keyboard shortcuts
// @version         0.0.1
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
   * Right side: Fastmail keys to replay, same naming.
   */
  const MAP = {
    'a': ['*', 'a'],    // select all (Fastmail: * then a). Replaces reply-all.
    'g i': ['G', 'i'],  // Shift+g then i. The g prefix delays Fastmail's own `g` (go to folder) until the timeout or the next key.
  };
  const SEQUENCE_TIMEOUT_MS = 1000;
  const REPLAY_GAP_MS = 30;

  const keyName = (e) => (e.ctrlKey ? 'Ctrl-' : '') + (e.altKey ? 'Alt-' : '') + (e.metaKey ? 'Meta-' : '') + e.key;

  const isTyping = (e) => e.isComposing || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.nodeName) || e.target.isContentEditable;

  const send = (name) => {
    const m = name.match(/^((?:Ctrl-|Alt-|Meta-)*)(.+)$/);
    const key = m[2];
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key,
      ctrlKey: m[1].includes('Ctrl-'),
      altKey: m[1].includes('Alt-'),
      metaKey: m[1].includes('Meta-'),
      shiftKey: /^[A-Z]$/.test(key),
      bubbles: true,
      cancelable: true,
    }));
  };

  // Fastmail opens some menus asynchronously, so the second key of a prefix sequence needs a short gap.
  const play = async (keys) => {
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
    const swallow = () => { e.preventDefault(); e.stopImmediatePropagation(); };

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
