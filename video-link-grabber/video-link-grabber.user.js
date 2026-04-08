// ==UserScript==
// @name            Video Link Grabber
// @description     Finds the playing video Links in the current page
// @version         3.21
// @author          TheBestPessimist
// inspired-by      https://github.com/Rainman69/video-link-grabber
// @namespace       https://git.tbp.land/
// @match           *://*/*
// @exclude         *://*.google.com/*
// @exclude         *://*.inoreader.com/*
// @exclude         *://*.dpreview.com/*
// @run-at          document-start
// @downloadURL     https://github.com/TheBestPessimist/UserScripts/raw/master/video-link-grabber/video-link-grabber.user.js
// @grant           GM_addStyle
// @grant           GM_setClipboard
// ==/UserScript==


(function () {
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
                window.top.postMessage({type: SCRIPT_ID, url: url}, '*');
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
     * Helper function to check if a URL looks like a video.
     */
    function isVideoUrl(url) {
        if (!url || typeof url !== 'string') return false;

        const urlLower = url.toLowerCase();

        // 1. Parse URL to check extensions and paths safely (ignoring query tokens)
        let pathname;
        try {
            const urlObj = new URL(url, window.location.href);
            pathname = urlObj.pathname.toLowerCase();
        } catch (e) {
            // If URL parsing fails, fall back to simple string matching
            pathname = urlLower;
        }

        // 2. THE BLOCKLIST (Quick Rejects)
        // Block known non-video manifests
        if (pathname.endsWith('.webmanifest') || pathname.endsWith('manifest.json')) {
            return false;
        }

        // Block chunk/segment file extensions (.m4s for DASH, .ts for HLS, .vtt for subtitles)
        if (pathname.endsWith('.m4s') || pathname.endsWith('.ts') || pathname.endsWith('.vtt')) {
            return false;
        }

        // Block common CDN folder paths used strictly for chunks
        const junkPaths = ['/chunk/', '/segment/', '/frag/', '/fragment/'];
        if (junkPaths.some(junk => pathname.includes(junk))) {
            return false;
        }

        // 3. THE ALLOWLIST (Valid Videos)
        // Check for actual master playlists and full video extensions
        const videoExtensions = ['.m3u8', '.mpd', '.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv'];
        if (videoExtensions.some(ext => pathname.endsWith(ext))) {
            return true;
        }

        // 4. Fallback for CDN URLs that don't have standard file extensions
        // Check for video MIME types in the URL
        const videoMimePatterns = ['video/', 'application/x-mpegurl', 'application/dash+xml'];
        if (videoMimePatterns.some(pattern => urlLower.includes(pattern))) {
            return true;
        }

        return false;
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
                    if (isVideoUrl(url)) {
                        reportUrl(url);
                    }
                });
            });
            observer.observe({type: 'resource', buffered: true});
        } catch (e) {
            // This might fail in sandboxed iframes, that's okay.
        }
    }

    /**
     * METHOD 3: Intercept XMLHttpRequest to catch video requests.
     */
    function interceptXHR() {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            if (isVideoUrl(url)) {
                reportUrl(url);
            }
            return originalOpen.apply(this, [method, url, ...rest]);
        };
    }

    /**
     * METHOD 4: Intercept fetch API to catch video requests.
     */
    function interceptFetch() {
        const originalFetch = window.fetch;
        window.fetch = function (input, ...rest) {
            const url = typeof input === 'string' ? input : input.url;
            if (isVideoUrl(url)) {
                reportUrl(url);
            }
            return originalFetch.apply(this, [input, ...rest]);
        };
    }

    /**
     * METHOD 5: Monitor the DOM for new video elements and media loading events.
     * Replaces the heavy 5-second setInterval sweep.
     */
    function startDomMonitoring() {
        // 1. Event Delegation: Catch videos when they actually start loading data
        // 'useCapture' (true) is required because media events do not bubble up the DOM.
        ['loadstart', 'loadedmetadata', 'play'].forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                const el = event.target;
                if (el && el.matches && el.matches('video')) {
                    reportUrl(el.src);
                    reportUrl(el.currentSrc);
                    const sources = el.querySelectorAll('source');
                    sources.forEach(source => reportUrl(source.src));
                }
            }, true);
        });

        // 2. MutationObserver: Catch newly injected videos or changed 'src' attributes
        const domObserver = new MutationObserver((mutations) => {
            let requiresScan = false;

            for (const mutation of mutations) {
                // Did the site change a video's direct src attribute?
                if (mutation.type === 'attributes' && (mutation.target.tagName === 'VIDEO' || mutation.target.tagName === 'SOURCE')) {
                    requiresScan = true;
                    break;
                }

                // Did the site inject a new node?
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the node is a video/source, or contains a video
                            if (node.tagName === 'VIDEO' || node.tagName === 'SOURCE' || node.querySelector('video')) {
                                requiresScan = true;
                                break;
                            }
                        }
                    }
                }
                if (requiresScan) break;
            }

            if (requiresScan) {
                scanHtmlForVideoUrls();
            }
        });

        // 3. Attach the observer once the body is ready
        function attachObserver() {
            if (!document.body) {
                setTimeout(attachObserver, 50);
                return;
            }
            domObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src'] // Only care if they change the source
            });
        }

        attachObserver();
    }

    function calculateScore(url) {
        let score = 0;
        const lowerUrl = url.toLowerCase();

        // Negative markers (fragments, chunks, text, images, blank players)
        const negativeMarkers = ['.ts', '/chunk/', 'storyboard', '.vtt', 'blank.mp4'];
        if (negativeMarkers.some(marker => lowerUrl.includes(marker))) {
            return -50; // Instantly return low score for junk
        }

        // Penalize slightly if it looks like a specific rendition instead of a master manifest
        if (lowerUrl.includes('rendition')) {
            score -= 30;
        }

        const videoFormats = ['.mp4', '.webm', '.mkv'];
        if (videoFormats.some(format => lowerUrl.includes(format))) {
            score += 10;
        }

        const manifestFormats = ['.m3u8', '.mpd'];
        if (manifestFormats.some(format => lowerUrl.includes(format))) {
            score += 20;
        }

        // Resolution scoring
        // Regex matches e.g. "1080", "1080p", "720", isolated from other numbers
        const resMatch = lowerUrl.match(/(?:^|[^0-9a-z])(2160|1440|1080|720|480|360|240)p?(?:[^0-9a-z]|$)/);
        if (resMatch) {
            const res = parseInt(resMatch[1], 10);
            if (res >= 2160) score += 8;
            else if (res >= 1080) score += 6;
            else if (res >= 720) score += 4;
            else if (res >= 480) score += 2;
            else score += 1; // 360 or 240
        } else if (lowerUrl.includes('4k')) {
            score += 8;
        }

        return score;
    }

    // --- 2. UI and Logic for TOP WINDOW ONLY ---

    if (isTopWindow) {

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        let isPanelOpen = false;

        let grabButton, panel, vlgHeaderTitle, vlgListContainer, vlgCloseBtn, vlgMessage;

        // --- Create UI (wait for document.body to be available) ---
        function createUI() {
            if (!document.body) {
                // Body not ready yet, try again soon
                setTimeout(createUI, 100);
                return;
            }

            grabButton = document.createElement('button');
            grabButton.id = 'vlg-grab-button';
            grabButton.textContent = '🎬';
            document.body.appendChild(grabButton);

            panel = document.createElement('div');
            panel.id = 'vlg-panel';
            panel.innerHTML = `
                <div class="vlg-header">
                    <strong id="vlg-header-title">Video URLs Found</strong>
                    <button id="vlg-close-btn">&times;</button>
                </div>
                <div id="vlg-url-list-container"></div>
                <span id="vlg-message"></span>
            `;
            document.body.appendChild(panel);

            // Get references to new elements
            vlgHeaderTitle = document.getElementById('vlg-header-title');
            vlgListContainer = document.getElementById('vlg-url-list-container');
            vlgCloseBtn = document.getElementById('vlg-close-btn');
            vlgMessage = document.getElementById('vlg-message');

            // Set up event handlers after UI is created
            setupEventHandlers();
        }

        createUI();

        // --- Add Styles ---
        GM_addStyle(`
            #vlg-grab-button {
                position: fixed; bottom: 20px; right: 20px; z-index: 99998;
                background: transparent; color: initial; border: none;
                border-radius: 50%; width: 50px; height: 50px;
                font-size: 24px; cursor: pointer; box-shadow: none;
                transition: transform 0.2s ease, opacity 0.2s ease;
                text-shadow: 0 0 4px rgba(0,0,0,0.4);
                opacity: 0.5;
                display: none; /* Hidden by default */
            }
            #vlg-grab-button:hover {
                transform: scale(1.1);
                text-shadow: 0 0 6px rgba(0,0,0,0.7);
                opacity: 0.8;
            }
            #vlg-panel {
                position: fixed; bottom: 80px; left: 20px; right: 20px; z-index: 99999;
                max-height: 40vh;
                background: #ffffff; border: 1px solid #cccccc; border-radius: 8px;
                box-shadow: 0 6px 20px rgba(0,0,0,0.25); font-family: Arial, sans-serif;
                font-size: 14px; color: #333; display: none;
                flex-direction: column; padding: 12px; box-sizing: border-box;
            }
            #vlg-panel, #vlg-panel * {
                -webkit-user-select: text !important;
                user-select: text !important;
            }

            #vlg-panel .vlg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 16px; flex-shrink: 0; }
            #vlg-panel #vlg-close-btn { background: none; border: none; font-size: 24px; color: #888; cursor: pointer; line-height: 1; padding: 0; }
            #vlg-url-list-container {
                overflow-y: auto;
                flex-grow: 1;
            }
            
            /* Nested Layout Styles */
            .vlg-group {
                margin-bottom: 12px;
                border-bottom: 1px solid #eee;
                padding-bottom: 8px;
            }
            .vlg-group:last-child {
                border-bottom: none;
            }
            .vlg-group-title {
                font-weight: bold;
                margin-bottom: 6px;
                font-size: 12px;
                color: #555;
                word-break: break-all;
                background: #f8f9fa;
                padding: 4px;
                border-radius: 4px;
            }
            
            .vlg-url-entry {
                display: flex;
                align-items: center;
                margin-bottom: 4px;
                padding-left: 12px; /* Indent for the nested look */
                border-left: 2px solid #ddd;
            }
            .vlg-url-input {
                flex-grow: 1;
                font-family: 'Courier New', monospace;
                font-size: 11px;
                padding: 6px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-right: 8px;
                color: #000;
                background: #fff;
                white-space: normal;
                overflow-wrap: anywhere;
                display: block;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }
            .vlg-url-input:hover {
                background: #f0f0f0;
            }
            .vlg-url-input.vlg-copied {
                background: #d4edda;
                border-color: #28a745;
            }
            .vlg-copy-single-btn {
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 11px;
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

        function refreshUrlListInPanel() {
            function groupAndSortUrls(urlsArray) {
                const grouped = new Map();

                urlsArray.forEach(fullUrl => {
                    let baseUrl = fullUrl;
                    try {
                        const urlObj = new URL(fullUrl, window.location.href);
                        // Strip query parameters for grouping
                        baseUrl = urlObj.origin + urlObj.pathname;
                    } catch (e) {
                        // Fallback to full string if URL parsing fails
                    }

                    if (!grouped.has(baseUrl)) {
                        grouped.set(baseUrl, {
                            score: calculateScore(baseUrl),
                            fullUrls: new Set()
                        });
                    }

                    grouped.get(baseUrl).fullUrls.add(fullUrl);
                });

                // Convert to array and sort descending by score
                return Array.from(grouped.entries()).sort((a, b) => b[1].score - a[1].score);
            }

            vlgListContainer.innerHTML = '';
            vlgMessage.textContent = '';

            const allUrls = Array.from(foundUrls);
            const sortedGroups = groupAndSortUrls(allUrls);

            // Update title to show unique base URLs vs total fragments
            vlgHeaderTitle.textContent = `Video URLs Found: ${allUrls.length} (${sortedGroups.length} Unique Bases)`;

            if (sortedGroups.length > 0) {
                sortedGroups.forEach(([baseUrl, groupData]) => {
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'vlg-group';

                    // Show numeric score
                    const groupTitle = document.createElement('div');
                    groupTitle.className = 'vlg-group-title';
                    groupTitle.textContent = `[Score: ${groupData.score}] Base: ${baseUrl}`;
                    groupDiv.appendChild(groupTitle);

                    // Iterate over the Set of full URLs that share this base
                    groupData.fullUrls.forEach(url => {
                        const entryDiv = document.createElement('div');
                        entryDiv.className = 'vlg-url-entry';

                        const urlBox = document.createElement('div');
                        urlBox.className = 'vlg-url-input';
                        urlBox.textContent = url;
                        urlBox.setAttribute('role', 'textbox');
                        urlBox.setAttribute('aria-readonly', 'true');
                        urlBox.setAttribute('tabindex', '0');

                        const copyButton = document.createElement('button');
                        copyButton.className = 'vlg-copy-single-btn';
                        copyButton.textContent = 'Copy';

                        const copyToClipboard = () => {
                            GM_setClipboard(url);
                            urlBox.classList.add('vlg-copied');
                            copyButton.textContent = 'Copied!';
                            copyButton.disabled = true;
                            setTimeout(() => {
                                urlBox.classList.remove('vlg-copied');
                                copyButton.textContent = 'Copy';
                                copyButton.disabled = false;
                            }, 2000);
                        };

                        // Click on URL box to copy
                        urlBox.addEventListener('click', copyToClipboard);

                        // Click on copy button to copy
                        copyButton.addEventListener('click', copyToClipboard);

                        entryDiv.appendChild(urlBox);
                        entryDiv.appendChild(copyButton);
                        groupDiv.appendChild(entryDiv);
                    });

                    vlgListContainer.appendChild(groupDiv);
                });
            } else {
                vlgMessage.textContent = 'No shareable video URLs found (yet).\n\nTry playing the video to capture its URL.';
            }
        }

        // Function to check for videos and show/hide button
        function updateButtonVisibility() {
            // Scan the top-level HTML just in case
            scanHtmlForVideoUrls();
            // Check if our Set (which includes iframe URLs) has anything
            if (foundUrls.size > 0) {
                grabButton.style.display = 'block';
                // If panel is open, refresh the list
                if (isPanelOpen) {
                    refreshUrlListInPanel();
                }
            } else {
                grabButton.style.display = 'none';
            }
        }

        // Function to clear URLs and hide panel on navigation
        function clearUrlsOnNav() {
            foundUrls.clear();
            isPanelOpen = false;

            // hide the UI only if it has actually been built
            if (panel) {
                panel.style.display = 'none';
            }
            if (grabButton) {
                grabButton.style.display = 'none';
            }
        }

        history.pushState = function () {
            clearUrlsOnNav();
            return originalPushState.apply(this, arguments);
        };
        history.replaceState = function () {
            clearUrlsOnNav();
            return originalReplaceState.apply(this, arguments);
        };

        window.addEventListener('popstate', clearUrlsOnNav);

        // Listen for messages from iframes
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === SCRIPT_ID && event.data.url) {
                foundUrls.add(event.data.url);
                updateButtonVisibility();
            }
        });

        // Set up event handlers (called after UI is created)
        function setupEventHandlers() {
            // Main button click handler
            grabButton.addEventListener('click', () => {
                scanHtmlForVideoUrls();
                refreshUrlListInPanel();
                panel.style.display = 'flex';
                isPanelOpen = true;
            });

            vlgCloseBtn.addEventListener('click', () => {
                panel.style.display = 'none';
                isPanelOpen = false;
            });

            window.addEventListener('click', (event) => {
                if (panel.style.display === 'flex') {
                    const isClickInsidePanel = panel.contains(event.target);
                    const isClickOnGrabButton = grabButton.contains(event.target) || event.target === grabButton;

                    if (!isClickInsidePanel && !isClickOnGrabButton) {
                        panel.style.display = 'none';
                        isPanelOpen = false;
                    }
                }
            });

            // Start the 5-second interval check (for the main page)
            setInterval(updateButtonVisibility, 5000);
            // And run it once on load
            updateButtonVisibility();
        }

    } // End of isTopWindow block

    // --- 3. Run Scanners on ALL Frames ---
    // This code runs on the top page AND all iframes

    /*
        2026-04-08 Apparently these may not be needed.
        if everything still works after .2026-06-08, delete the 2 functions
        // Intercept network requests EARLY (before any other scripts run)
        interceptXHR();
        interceptFetch();

        // Run HTML scan once on load
        scanHtmlForVideoUrls();
        window.addEventListener('load', scanHtmlForVideoUrls);
        // NEW: Run the lightweight HTML scan every 5 seconds in *all* frames
        setInterval(scanHtmlForVideoUrls, 5000);
    */

    startNetworkMonitoring();
    startDomMonitoring()
})();
