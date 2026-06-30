/*!
 * global-example.js — sanity-check that proves the jsDelivr delivery path.
 * Used on: any Webflow test page (site-wide safe; no-op beyond a console log).
 * Added: v1.0.0
 */
(function () {
  "use strict";

  function init() {
    // Visible proof the script loaded and ran.
    console.log("[growceanu-js-website] global-example.js loaded — v1.0.0");
  }

  // Run after Webflow has initialized the page; fall back to DOMContentLoaded.
  if (window.Webflow) {
    window.Webflow.push(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
