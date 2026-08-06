// ==UserScript==
// @name            Bandcamp Discography Link
// @description     Add a discography link to Bandcamp album pages
// @version         1
// @author          TheBestPessimist
// @namespace       https://git.tbp.land/
// @match           *://*.bandcamp.com/album/*
// @match           *://*.bandcamp.com/track/*
// @run-at          document-end
// @grant           none
// @downloadURL     https://github.com/TheBestPessimist/UserScripts/raw/master/bandcamp-discography-link/bandcamp-discography-link.user.js
// ==/UserScript==

const bandNameLocation = document.querySelector('#band-name-location');

if (bandNameLocation) {
    const discographyHeading = document.createElement('h3');
    discographyHeading.className = 'title';

    const discographyLink = document.createElement('a');
    discographyLink.href = '/music';
    discographyLink.className = 'link-and-title primaryText';
    discographyLink.textContent = '💿 discography';

    discographyHeading.append(discographyLink);
    bandNameLocation.insertAdjacentElement('afterend', discographyHeading);
}
