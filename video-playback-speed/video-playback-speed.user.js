// ==UserScript==
// @name            Video Playback Speed
// @description     Change video playback speed with keys `[`, `]`, `\`
// @version         1.0.8
// @author          TheBestPessimist
// @run-at          document-end
// @namespace       https://git.tbp.land/
// @grant           none
// @downloadURL     https://github.com/TheBestPessimist/UserScripts/raw/master/video-playback-speed/video-playback-speed.user.js
// ==/UserScript==

// Code taken from: https://greasyfork.org/en/scripts/30506-video-speed-buttons


const vsc = {
    name: "Video Playback Speed",
    getVideo: _ => document.querySelector("video"), // Yep, it's really that simple.
    ev_keydown: function (ev) {
         if (vsc.getVideo() === null)
            return true;
        
        let currentSpeed = vsc.getVideo().playbackRate;
        let newSpeed = currentSpeed;
        let speedDirectionEmoji = "";

        let changeValue = 1.1;
        if (currentSpeed >= 1 && currentSpeed < 2)
            changeValue = 1.2;

        // increase
        if (ev.key === "]") {
            newSpeed = currentSpeed * changeValue;
            speedDirectionEmoji = "↗️";
        }

        // decrease
        else if (ev.key === "[") {
            newSpeed = currentSpeed * (1 / changeValue);
            speedDirectionEmoji = "↘️";
        }

        // reset
        else if (ev.key === "\\") {
            newSpeed = 1;
            speedDirectionEmoji = "▶️"
        } else return true;

        // youtube gives errors for anything outside this range
        newSpeed = clamp(newSpeed, 0.1, 15)

        // i like pretty numbers :^)
        newSpeed = newSpeed.toFixed(2);
        currentSpeed = currentSpeed.toFixed(2);

        if (newSpeed !== currentSpeed) {
            let msg = `Speed ${speedDirectionEmoji}: ${currentSpeed} -> ${newSpeed}`;
            log(msg);
            vsc.getVideo().playbackRate = newSpeed;

            displayMessageOverElement(vsc.getVideo(), msg);
        }
    }
};

let log = (...args) => console.log(`%c${vsc.name}:`, "font-weight: bold;color: orange;", ...args);

function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}

let currentMessageDiv = null; // Keep track of the current message for hiding it

function displayMessageOverElement(element, message) {
    // Get the bounding rectangle of the element
    const rect = element.getBoundingClientRect();

    // Create a new div for the message
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;

    // Style the message div
    Object.assign(messageDiv.style, {
        position: 'absolute',
        top: `${rect.top + window.scrollY + 10}px`,
        left: `${rect.left + window.scrollX + 10}px`,
        backgroundColor: 'orange',
        // color: 'black',
        'font-size': '20px',
        padding: '5px',
        // border: '1px solid black',
        borderRadius: '5px',
        zIndex: 10_000, // Ensure it appears above other elements
        pointerEvents: 'none', // Prevent interaction with the message
    });


    // Remove any existing message
    if (currentMessageDiv) {
        currentMessageDiv.remove();
        currentMessageDiv = null;
    }

    // Append the message to the document body
    document.body.appendChild(messageDiv);
    currentMessageDiv = messageDiv; // Set the current message

    // Automatically remove the message after some time
    setTimeout(() => {
        if (messageDiv === currentMessageDiv) {
            messageDiv.remove();
            currentMessageDiv = null;
        }
    }, 1000);
}


document.body.addEventListener("keydown", vsc.ev_keydown);
log(`loaded`);
