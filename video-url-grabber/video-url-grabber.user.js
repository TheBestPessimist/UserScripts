// ==UserScript==
// @name         Video URL Grabber (iFrame Communicator)
// @namespace    https.github.com/Rainman69/video-link-grabber
// @version      3.3
// @description  Finds video URLs (incl. m3u8/mpd) by network scan. Now communicates between iframes and the main page.
// @author       Fixed by Gemini
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'useS strict';

    const isTopWindow = (window.self === window.top);
    const SCRIPT_ID = 'vlg-message-id'; // Identifier for our messages
    let foundUrls = new Set(); // This will only be used by the top window's list

    // --- 1. Core Finders ---
    // These functions will run on ALL frames (top page + iframes)

    /**
     * Reports a found URL.
     * If in the top window, adds it to the local Set.
     * If in an iframe, posts it to the top window.
     */
    function reportUrl(url) {
        if (!url || typeof url !== 'string' || url.startsWith('blob:')) {
            return; // Ignore blobs or invalid data
        }

        if (isTopWindow) {
            foundUrls.add(url);
        } else {
            // We are in an iframe, send the URL to the parent window
            try {
                window.top.postMessage({ type: SCRIPT_ID, url: url }, '*');
            } catch (e) {
                console.error('Video Grabber (iframe): Could not post message to top window.', e);
            }
        }
    }

    /**
     * METHOD 1: Scan HTML for <video> and <source> tags.
     */
    function scanHtmlForVideoUrls() {
        const videoElements = document.querySelectorAll('video');
        videoElements.forEach(video => {
            reportUrl(video.src);
            reportUrl(video.currentSrc);
            const sources = video.querySelectorAll('source');
            sources.forEach(source => {
                reportUrl(source.src);
            });
        });
    }

    /**
     * METHOD 2: Use PerformanceObserver to watch for network requests.
     */
    function startNetworkMonitoring() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntriesByType('resource');
                entries.forEach(entry => {
                    const url = entry.name;
                    if (url.includes('.m3u8') || url.includes('.mpd')) {
                        reportUrl(url);
                    }
                });
            });
            observer.observe({ type: 'resource', buffered: true });
        } catch (e) {
            // This might fail in sandboxed iframes, that's okay.
        }
    }

    // --- 2. UI and Logic for TOP WINDOW ONLY ---

    if (isTopWindow) {
        // --- Create UI ---
        const grabButton = document.createElement('button');
        grabButton.id = 'vlg-grab-button';
        grabButton.textContent = '🎬';
        document.body.appendChild(grabButton);

        const panel = document.createElement('div');
        panel.id = 'vlg-panel';
        panel.innerHTML = `
            <div class="vlg-header">
                <strong>Video URLs Found</strong>
                <button id="vlg-close-btn">&times;</button>
            </div>
            <textarea id="vlg-textarea" readonly></textarea>
            <button id="vlg-copy-btn">Copy All</button>
            <span id="vlg-message"></span>
        `;
        document.body.appendChild(panel);

        const vlgTextarea = document.getElementById('vlg-textarea');
        const vlgCopyBtn = document.getElementById('vlg-copy-btn');
        const vlgCloseBtn = document.getElementById('vlg-close-btn');
        const vlgMessage = document.getElementById('vlg-message');

        // --- Add Styles ---
        GM_addStyle(`
            #vlg-grab-button {
                position: fixed; bottom: 20px; right: 20px; z-index: 99998;
                background: transparent; color: initial; border: none;
                border-radius: 50%; width: 50px; height: 50px;
                font-size: 24px; cursor: pointer; box-shadow: none;
                transition: transform 0.2s ease; text-shadow: 0 0 4px rgba(0,0,0,0.4);
            }
            #vlg-grab-button:hover { transform: scale(1.1); text-shadow: 0 0 6px rgba(0,0,0,0.7); }
            #vlg-panel {
                position: fixed; bottom: 80px; right: 20px; z-index: 99999;
                width: 400px; max-width: 90vw; background: #ffffff;
                border: 1px solid #cccccc; border-radius: 8px;
                box-shadow: 0 6px 20px rgba(0,0,0,0.25); font-family: Arial, sans-serif;
                font-size: 14px; color: #333; display: none;
                flex-direction: column; padding: 12px; box-sizing: border-box;
            }
            #vlg-panel .vlg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 16px; }
            #vlg-panel #vlg-close-btn { background: none; border: none; font-size: 24px; color: #888; cursor: pointer; line-height: 1; padding: 0; }
            #vlg-panel #vlg-textarea { width: 100%; min-height: 150px; resize: vertical; border: 1px solid #ddd; border-radius: 4px; padding: 8px; box-sizing: border-box; font-family: 'Courier New', monospace; font-size: 12px; color: #000; }
            #vlg-panel #vlg-copy-btn { background: #28a745; color: white; border: none; border-radius: 4px; padding: 10px; cursor: pointer; margin-top: 10px; font-size: 14px; }
            #vlg-panel #vlg-copy-btn:disabled { background: #aaa; }
            #vlg-panel #vlg-message { margin-top: 5px; font-size: 12px; color: #28a745; text-align: center; }
        `);

        // --- Event Handlers (Top Window) ---

        // Listen for messages from iframes
        window.addEventListener('message', (event) => {
            // Check if the message is from our script and has a URL
            if (event.data && event.data.type === SCRIPT_ID && event.data.url) {
                foundUrls.add(event.data.url);
            }
        });

        grabButton.addEventListener('click', () => {
            // Run a final scan on the top page just in case
            scanHtmlForVideoUrls();

            const allUrls = Array.from(foundUrls);
            if (allUrls.length > 0) {
                vlgTextarea.value = allUrls.join('\n');
                vlgCopyBtn.disabled = false;
                vlgMessage.textContent = '';
            } else {
                vlgTextarea.value = 'No shareable video URLs found (yet).\n\nTry playing the video to capture its URL.';
                vlgCopyBtn.disabled = true;
                vlgMessage.textContent = '';
            }
            panel.style.display = 'flex';
        });

        vlgCloseBtn.addEventListener('click', () => panel.style.display = 'none');

        vlgCopyBtn.addEventListener('click', () => {
            if (vlgTextarea.value) {
                GM_setClipboard(vlgTextarea.value);
                vlgMessage.textContent = 'Copied to clipboard!';
                setTimeout(() => { vlgMessage.textContent = ''; }, 2000);
            }
        });

    } // End of isTopWindow block

    // --- 3. Run Scanners on ALL Frames ---
    // This code runs on the top page AND all iframes

    // Run scanners immediately
    startNetworkMonitoring();
    scanHtmlForVideoUrls();

    // Run HTML scan again after the page (or iframe) has fully loaded
    window.addEventListener('load', scanHtmlForVideoUrls);

})();
