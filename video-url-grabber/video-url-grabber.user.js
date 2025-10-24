// ==UserScript==
// @name         Video URL Grabber (v3.5)
// @namespace    https.github.com/Rainman69/video-link-grabber
// @version      3.5
// @description  Finds URLs (incl. m3u8/mpd) and lists them. Click-outside-to-close and more transparent button.
// @author       Fixed by Gemini
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

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
            <div id="vlg-url-list-container"></div>
            <span id="vlg-message"></span>
        `;
        document.body.appendChild(panel);

        // Get references to new elements
        const vlgListContainer = document.getElementById('vlg-url-list-container');
        const vlgCloseBtn = document.getElementById('vlg-close-btn');
        const vlgMessage = document.getElementById('vlg-message');

        // --- Add Styles ---
        GM_addStyle(`
            #vlg-grab-button {
                position: fixed; bottom: 20px; right: 20px; z-index: 99998;
                background: transparent; color: initial; border: none;
                border-radius: 50%; width: 50px; height: 50px;
                font-size: 24px; cursor: pointer; box-shadow: none;
                transition: transform 0.2s ease, opacity 0.2s ease; /* Added opacity to transition */
                text-shadow: 0 0 4px rgba(0,0,0,0.4);
                opacity: 0.5; /* 2. Made button more transparent */
            }
            #vlg-grab-button:hover {
                transform: scale(1.1);
                text-shadow: 0 0 6px rgba(0,0,0,0.7);
                opacity: 0.8; /* 2. Make it slightly more visible on hover */
            }
            #vlg-panel {
                position: fixed; bottom: 80px; right: 20px; z-index: 99999;
                width: 400px; max-width: 90vw; max-height: 40vh;
                background: #ffffff; border: 1px solid #cccccc; border-radius: 8px;
                box-shadow: 0 6px 20px rgba(0,0,0,0.25); font-family: Arial, sans-serif;
                font-size: 14px; color: #333; display: none;
                flex-direction: column; padding: 12px; box-sizing: border-box;
            }
            #vlg-panel .vlg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 16px; flex-shrink: 0; }
            #vlg-panel #vlg-close-btn { background: none; border: none; font-size: 24px; color: #888; cursor: pointer; line-height: 1; padding: 0; }
            #vlg-url-list-container {
                overflow-y: auto;
                flex-grow: 1;
            }
            .vlg-url-entry {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
            }
            .vlg-url-input {
                flex-grow: 1;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                padding: 6px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-right: 8px;
                color: #000;
            }
            .vlg-copy-single-btn {
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 6px 10px;
                cursor: pointer;
                font-size: 12px;
                flex-shrink: 0;
            }
            .vlg-copy-single-btn:disabled {
                background: #28a745;
            }
            #vlg-panel #vlg-message {
                margin-top: 5px;
                font-size: 12px;
                color: #888;
                text-align: center;
                flex-shrink: 0;
            }
        `);

        // --- Event Handlers (Top Window) ---

        // Listen for messages from iframes
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === SCRIPT_ID && event.data.url) {
                foundUrls.add(event.data.url);
            }
        });

        // Main button click handler
        grabButton.addEventListener('click', () => {
            // Run a final scan on the top page
            scanHtmlForVideoUrls();

            // Clear previous list
            vlgListContainer.innerHTML = '';
            vlgMessage.textContent = '';

            const allUrls = Array.from(foundUrls);

            if (allUrls.length > 0) {
                allUrls.forEach(url => {
                    // Create the elements for this URL entry
                    const entryDiv = document.createElement('div');
                    entryDiv.className = 'vlg-url-entry';

                    const urlInput = document.createElement('input');
                    urlInput.type = 'text';
                    urlInput.className = 'vlg-url-input';
                    urlInput.value = url;
                    urlInput.readOnly = true;

                    const copyButton = document.createElement('button');
                    copyButton.className = 'vlg-copy-single-btn';
                    copyButton.textContent = 'Copy';

                    // Add click listener for this specific button
                    copyButton.addEventListener('click', () => {
                        GM_setClipboard(url);
                        copyButton.textContent = 'Copied!';
                        copyButton.disabled = true;
                        setTimeout(() => {
                            copyButton.textContent = 'Copy';
                            copyButton.disabled = false;
                        }, 2000);
                    });

                    entryDiv.appendChild(urlInput);
                    entryDiv.appendChild(copyButton);
                    vlgListContainer.appendChild(entryDiv);
                });
            } else {
                vlgMessage.textContent = 'No shareable video URLs found (yet).\n\nTry playing the video to capture its URL.';
            }

            // Show the panel
            panel.style.display = 'flex';
        });

        // Close button on the panel
        vlgCloseBtn.addEventListener('click', () => panel.style.display = 'none');

        // 1. New listener: Click outside to close panel
        window.addEventListener('click', (event) => {
            // Check if the panel is visible
            if (panel.style.display === 'flex') {
                // Check if the click was outside the panel AND outside the grab button
                const isClickInsidePanel = panel.contains(event.target);
                const isClickOnGrabButton = grabButton.contains(event.target) || event.target === grabButton;

                if (!isClickInsidePanel && !isClickOnGrabButton) {
                    panel.style.display = 'none';
                }
            }
        });

    } // End of isTopWindow block

    // --- 3. Run Scanners on ALL Frames ---
    // This code runs on the top page AND all iframes

    startNetworkMonitoring();
    scanHtmlForVideoUrls();
    window.addEventListener('load', scanHtmlForVideoUrls);

})();
