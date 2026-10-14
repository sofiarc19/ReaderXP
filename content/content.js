console.log("CONTENT SCRIPT LOADED");

import { setupMessaging } from "./messaging.js";
import { startObserver } from "./blur.js";

// Normalize API: Firefox uses `browser`, Chrome uses `chrome`
globalThis.browser = globalThis.browser || globalThis.chrome;

function init() {
  // Start DOM mutation observer (used for restoring reader UI)
  startObserver();
  // Set up message listeners for popup → content communication
  setupMessaging();
}

// Run initialization when content script loads
init();