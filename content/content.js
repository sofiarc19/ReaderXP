// console.log("CONTENT SCRIPT LOADED");
import { setupMessaging } from "./messaging.js";

// Normalize API: Firefox uses `browser`, Chrome uses `chrome`
globalThis.browser = globalThis.browser || globalThis.chrome;

function init() {
  // Ignore iframes
  console.log(
    "[FRAME CHECK]",
    window.location.href,
    window === window.top
  );
  if (window !== window.top) {
    // console.log("[READER] Skipping iframe");
    return;
  }

  // Start DOM mutation observer (used for restoring reader UI)
  // startObserver();
  // Set up message listeners for popup → content communication
  setupMessaging();

  console.log("[READER] Running on:", window.location.href);
}

// Run initialization when content script loads
init();