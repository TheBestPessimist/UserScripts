Detect any and all video links; show a button; show the links;

UI logic is:
- if no video, don't show the button
- if any video, show the button
- if click on button, show the panel with list of videos detected
- if click outside of panel, hide the panel
- if changing the page (ie moving from 1 video to the next), reset the state as if this was a browser page refresh, then start checking for videos again
- in panel, if i click a link, it copies to clipboard 
