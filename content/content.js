console.log("CONTENT SCRIPT LOADED");

import { setupMessaging } from "./messaging.js";
import { startObserver } from "./blur.js";

// Chrome exposes `chrome`; Firefox exposes `browser`. Normalize.
globalThis.browser = globalThis.browser || globalThis.chrome;

function init() {
  startObserver();
  setupMessaging();
}

init();
