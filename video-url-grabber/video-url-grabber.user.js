// ==UserScript==
// @name         Video URL Grabber (Safe Version)
// @namespace    https://github.com/Rainman69/video-link-grabber
// @version      2.0
// @description  Adds a button to find and copy all video URLs on a page. Safe and does not break site styles.
// @author       Fixed by Gemini
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// ==/UserScript==

/*
    A NOTE ON PERMISSIONS:
    This script uses "@match *://*/*" to run on all sites.
Unlike the original, this code is SAFE to run everywhere.
    It only adds a button and doesn't interfere with the page
until you click it.
*/

(function() {
    'use strict';

    // --- 1. Create the UI Elements ---

    // Create the main button
    const grabButton = document.createElement('button');
    grabButton.id = 'vlg-grab-button';
    grabButton.textContent = '🎬'; // Simple emoji for the button
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

    // --- 2. Add Styles (Safely!) ---

    // Use GM_addStyle to add CSS that ONLY targets our new elements by their ID.
    // This will not affect any other part of the website.
    GM_addStyle(`
        #vlg-grab-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99998;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: transform 0.2s ease;
        }
        #vlg-grab-button:hover {
            transform: scale(1.1);
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

    // --- 3. Core Logic ---

    /**
     * Finds all video URLs on the page.
     */
    function scanForVideoUrls() {
        const videoElements = document.querySelectorAll('video');
        const urls = new Set(); // Use a Set to avoid duplicates

        videoElements.forEach(video => {
            // 1. Check the main 'src' attribute
            if (video.src && !video.src.startsWith('blob:')) {
                urls.add(video.src);
            }
            // 2. Check the 'currentSrc' which shows what's actually playing
            if (video.currentSrc && !video.currentSrc.startsWith('blob:')) {
                urls.add(video.currentSrc);
            }
            // 3. Check all <source> tags inside the <video> tag
            const sources = video.querySelectorAll('source');
            sources.forEach(source => {
                if (source.src && !source.src.startsWith('blob:')) {
                    urls.add(source.src);
                }
            });
        });

        return Array.from(urls); // Convert the Set back to an array
    }

    /**
     * Event handler for the main "grab" button.
     */
    function onGrabButtonClick() {
        const urls = scanForVideoUrls();

        if (urls.length > 0) {
            vlgTextarea.value = urls.join('\n');
            vlgCopyBtn.disabled = false;
            vlgMessage.textContent = '';
        } else {
            vlgTextarea.value = 'No shareable video URLs found.';
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
            // Use GM_setClipboard for reliable copying in a userscript
            GM_setClipboard(vlgTextarea.value);
            vlgMessage.textContent = 'Copied to clipboard!';
            setTimeout(() => { vlgMessage.textContent = ''; }, 2000);
        }
    }

    // --- 4. Attach Event Listeners ---

    grabButton.addEventListener('click', onGrabButtonClick);
    vlgCloseBtn.addEventListener('click', () => panel.style.display = 'none');
    vlgCopyBtn.addEventListener('click', onCopyButtonClick);

})();
