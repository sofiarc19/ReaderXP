// Normalize Chrome/Firefox extension API
const api = typeof browser !== "undefined" ? browser : chrome;
window.browser = api;

export {api};

// Get the currently active browser tab
export function getActiveTab() {
  return new Promise((resolve) => {
    // lastFocusedWindow avoids DevTools/popup confusion
    api.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (api.runtime.lastError) {
        console.warn("[POPUP] tabs.query:", api.runtime.lastError.message);
        resolve(null);
        return;
      }
      resolve(tabs && tabs[0] ? tabs[0] : null);
    });
  });
}

// Send a message to a specific tab
export function sendMessageToTab(tabId, message) {
  console.log("[SEND MESSAGE]", message.action);

  return new Promise((resolve, reject) => {
    api.tabs.sendMessage(tabId, message, (response) => {
      const err = api.runtime.lastError;

      if (err) {
        console.log(
          "[MESSAGE FAILED]",
          message.action,
          err.message
        );

        reject(new Error(err.message));
      } else {
        console.log(
          "[MESSAGE OK]",
          message.action,
          response
        );

        resolve(response);
      }
    });
  });
}

// Ensure content script is injected before messaging
export async function ensureContentScript(tabId) {
  try {
    await sendMessageToTab(tabId, { action: "ping" });

    await api.scripting.insertCSS({
      target: { tabId, allFrames: true },
      files: ["css/readerArea.css"],
    });

    return true;
  } catch (_) {
    try {
      await api.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ["dist/content.js"],
      });

      await api.scripting.insertCSS({
        target: { tabId, allFrames: true },
        files: ["css/readerArea.css"],
      });

      return true;
    } catch (injectErr) {
      console.warn(
        "[POPUP] Could not inject content script:",
        injectErr
      );
      return false;
    }
  }
}

// Send a reader-related action to the active tab
export async function sendToReader(action, value) {
  const tab = await getActiveTab();
  if (!tab?.id) {
    console.warn("[POPUP] No active tab");
    return;
  }
  if (!/^https?:/.test(tab.url || "")) {
    console.warn("[POPUP] Cannot run on this page:", tab.url);
    return;
  }

  const ok = await ensureContentScript(tab.id);
  if (!ok) return;

  try {
    await sendMessageToTab(tab.id, { action, value });
  } catch (err) {
    console.warn("[POPUP] sendMessage failed:", action, err.message);
  }
}

