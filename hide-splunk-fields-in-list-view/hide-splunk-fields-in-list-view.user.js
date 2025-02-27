// ==UserScript==
// @name         Hide splunk fields in list view
// @description  ???
// @namespace    https://git.tbp.land/
// @author       TheBestPessimist
// @match        https://splunk.hydra-splunk.aws.platform.*/*
// @version      1.5
// @grant        none
// @run-at       document-end
//
// ==/UserScript==

(function () {
    'use strict';

    const textsToRemove = [ //
        "@version",
        "auditID",
        "eventId",
        "host",
        "index",
        "kind",
        "kubernetes.annotations.CapacityProvisioned",
        "kubernetes.annotations.Logging",
        "level_value",
        "log",
        "logtag",
        "stream",
    ];

    const removeSpans = (node) => {
        const spans = node.querySelectorAll('span.level-1 > span.key-name');
        spans.forEach(span => {
            if (textsToRemove.includes(span.textContent.trim())) {
                console.log(`Found span with text: ${span.textContent.trim()}`);
                const parentSpan = span.closest('span.key.level-1');
                if (parentSpan) {
                    const nextSibling1 = parentSpan.nextSibling;
                    const nextSibling2 = parentSpan.nextSibling.nextSibling;
                    const nextSibling3 = parentSpan.nextSibling.nextSibling.nextSibling;

                    if (nextSibling1 && (nextSibling1 instanceof Text || nextSibling1 instanceof HTMLBRElement)) {
                        console.log(`   Removing 1 >${nextSibling1.textContent}< after the parent span`);
                        nextSibling1.remove();
                    }
                    if (nextSibling2 && (nextSibling2 instanceof Text || nextSibling2 instanceof HTMLBRElement)) {
                        console.log(`   Removing 2 >${nextSibling2.textContent}< after the parent span`);
                        nextSibling2.remove();
                    }
                    if (nextSibling3 && (nextSibling3 instanceof Text || nextSibling3 instanceof HTMLBRElement)) {
                        console.log(`   Removing 3 >${nextSibling3.textContent}< after the parent span`);
                        nextSibling3.remove();
                    }
                    parentSpan.remove();
                    console.log(`Deleted parent span with text: ${span.textContent.trim()}`);
                }
            }
        });
    };

    const waitForTargetNode = () => {
        const targetNode = document.querySelector('.search-results-events-container');
        if (targetNode) {
            const config = {childList: true, subtree: true};

            const callback = (mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                removeSpans(node);
                            }
                        });
                    }
                }
            };

            const observer = new MutationObserver(callback);
            observer.observe(targetNode, config);

            // Initial removal of spans in case there are already rows present
            removeSpans(targetNode);
        } else {
            console.error('Target node not found, retrying...');
            setTimeout(waitForTargetNode, 1000); // Retry after 1 second
        }
    };

    waitForTargetNode();
})();
