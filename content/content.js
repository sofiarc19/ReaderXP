console.log("CONTENT SCRIPT LOADED");

import { setupMessaging } from "./messaging.js";
import { startObserver } from "./blur.js";

function init() {
  startObserver();
  setupMessaging();

  // Tell popup we are ready
  browser.runtime.sendMessage({ ready: true });
}

init();
