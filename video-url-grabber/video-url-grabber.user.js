// ==UserScript==
// @name         Video URL Grabber (iFrame Fix)
// @namespace    https.github.com/Rainman69/video-link-grabber
// @version      3.2
// @description  Finds video URLs (incl. m3u8/mpd) by network scan. Only runs on the main page, not in iframes.
// @author       Fixed by Gemini
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // --- THE FIX ---
    // If we are inside an iframe, do nothing and exit.
    // This prevents the script from adding a button inside the video player.
    if (window.self !== window.top) {
        return;
    }

    // --- 1. A Set to store all found URLs (prevents duplicates) ---
    const foundUrls = new Set();

    // --- 2. Create the UI Elements ---

    // Create the main button
    const grabButton = document.createElement('button');
    grabButton.id = 'vlg-grab-button';
    grabButton.textContent = '🎬';
    document.body.appendChild(grabButton);

    // Create the results panel (hidden by default)
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

    // Get references to the new elements
    const vlgTextarea = document.getElementById('vlg-textarea');
    const vlgCopyBtn = document.getElementById('vlg-copy-btn');
    const vlgCloseBtn = document.getElementById('vlg-close-btn');
    const vlgMessage = document.getElementById('vlg-message');

    // --- 3. Add Styles (Safely!) ---

    GM_addStyle(`
        #vlg-grab-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99998;
            background: transparent;
            color: initial;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 24px;
            cursor: pointer;
            box-shadow: none;
            transition: transform 0.2s ease;
            text-shadow: 0 0 4px rgba(0,0,0,0.4);
        }
        #vlg-grab-button:hover {
            transform: scale(1.1);
            text-shadow: 0 0 6px rgba(0,0,0,0.7);
        }
        #vlg-panel {
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 99999;
            width: 400px;
            max-width: 90vw;
            background: #ffffff;
            border: 1px solid #cccccc;
            border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.25);
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #333;
            display: none; /* Hidden by default */
            flex-direction: column;
            padding: 12px;
            box-sizing: border-box;
        }
        #vlg-panel .vlg-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-size: 16px;
        }
        #vlg-panel #vlg-close-btn {
            background: none;
            border: none;
            font-size: 24px;
            color: #888;
            cursor: pointer;
            line-height: 1;
            padding: 0;
        }
        #vlg-panel #vlg-textarea {
            width: 100%;
            min-height: 150px;
            resize: vertical;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px;
            box-sizing: border-box;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #000;
        }
        #vlg-panel #vlg-copy-btn {
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px;
            cursor: pointer;
            margin-top: 10px;
            font-size: 14px;
        }
        #vlg-panel #vlg-copy-btn:disabled {
            background: #aaa;
        }
        #vlg-panel #vlg-message {
            margin-top: 5px;
            font-size: 12px;
            color: #28a745;
            text-align: center;
        }
    `);

    // --- 4. Core Logic ---

    /**
     * METHOD 1: Scan HTML for <video> and <source> tags.
     * This will only find videos on the *main page*.
     */
    function scanHtmlForVideoUrls() {
        const videoElements = document.querySelectorAll('video');
        videoElements.forEach(video => {
            if (video.src && !video.src.startsWith('blob:')) {
                foundUrls.add(video.src);
            }
            if (video.currentSrc && !video.currentSrc.startsWith('blob:')) {
                foundUrls.add(video.currentSrc);
            }
            const sources = video.querySelectorAll('source');
            sources.forEach(source => {
                if (source.src && !source.src.startsWith('blob:')) {
                    foundUrls.add(source.src);
                }
            });
        });
    }

    /**
     * METHOD 2: Use PerformanceObserver to watch for network requests.
     * This will find .m3u8 and .mpd files loaded by JS players,
     * ***even if they are loaded from inside an iframe.***
     */
    function startNetworkMonitoring() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntriesByType('resource');
                entries.forEach(entry => {
                    const url = entry.name;
                    // Check for common streaming manifest extensions
                    if (url.includes('.m3u8') || url.includes('.mpd')) {
                        foundUrls.add(url);
                    }
                });
            });

            observer.observe({ type: 'resource', buffered: true });
        } catch (e) {
            console.error('Video Grabber: PerformanceObserver not supported.', e);
        }
    }

    /**
     * Event handler for the main "grab" button.
     */
    function onGrabButtonClick() {
        // Run the HTML scan again to catch any new videos
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

        // Show the panel
        panel.style.display = 'flex';
    }

    /**
     * Event handler for the "Copy" button.
     */
    function onCopyButtonClick() {
        if (vlgTextarea.value) {
            GM_setClipboard(vlgTextarea.value);
            vlgMessage.textContent = 'Copied to clipboard!';
            setTimeout(() => { vlgMessage.textContent = ''; }, 2000);
        }
    }

    // --- 5. Attach Event Listeners and Start ---

    grabButton.addEventListener('click', onGrabButtonClick);
    vlgCloseBtn.addEventListener('click', () => panel.style.display = 'none');
    vlgCopyBtn.addEventListener('click', onCopyButtonClick);

    // Start monitoring network requests as soon as the script loads
    startNetworkMonitoring();
    // Also run the HTML scan once on load
    scanHtmlForVideoUrls();

})();
