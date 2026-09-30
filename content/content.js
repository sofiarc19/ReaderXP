console.log("CONTENT SCRIPT LOADED");

import { setupMessaging } from "./messaging.js";
import { startObserver } from "./blur.js";
import { state } from "./state.js";

setInterval(() => {
  const idleMs = Date.now() - state.lastInteraction;
  console.log("[READER] Idle check:", idleMs, "ms");

  // if (idleMs > 45000) {
  //   console.log("[READER] Attention check: user idle for", idleMs, "ms");
  // }
}, 5000);

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