"use strict";

/*
 * NOOR TOOLS
 * Application loader
 * Design & Development: م. علي غريب
 */

(() => {
  const REQUIRED = ["NoorDB", "NoorApp"];

  function checkApplication() {
    const missing = REQUIRED.filter(name => !window[name]);

    if (missing.length) {
      console.error(
        "NOOR TOOLS: missing application components:",
        missing
      );
      return false;
    }

    return true;
  }

  function showReadyMessage() {
    if (!checkApplication()) return;

    console.info("NOOR TOOLS application components are ready.");
    document.documentElement.dataset.noorToolsReady = "true";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showReadyMessage, {
      once: true
    });
  } else {
    showReadyMessage();
  }

  window.NoorLoader = Object.freeze({
    check: checkApplication
  });
})();
