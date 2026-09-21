// Normalize Chrome/Firefox extension API
const api = typeof browser !== "undefined" ? browser : chrome;
window.browser = api;

// Popup UI settings (synced to storage)
let popupSettings = {
  font: "sans-serif",
  fontSize: 16,
  theme: "theme-dark",
  bionic: false,
};

// Get the currently active browser tab
function getActiveTab() {
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
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    api.tabs.sendMessage(tabId, message, (response) => {
      const err = api.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(response);
    });
  });
}

// Ensure content script is injected before messaging
async function ensureContentScript(tabId) {
  try {
    // Ping first — if it responds, it's already injected
    await sendMessageToTab(tabId, { action: "ping" });
    return true;
  } catch (_) {
    // Inject content script + CSS if missing
    try {
      await api.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ["dist/content.js"],
      });
      await api.scripting.insertCSS({
        target: { tabId, allFrames: true },
        files: ["styles.css"],
      });
      return true;
    } catch (injectErr) {
      console.warn("[POPUP] Could not inject content script:", injectErr);
      return false;
    }
  }
}

// Send a reader-related action to the active tab
async function sendToReader(action, value) {
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

// Apply popup font + size to popup UI
function applyPopupStyle() {
  const root = document.documentElement;
  root.style.setProperty("--reader-font", popupSettings.font);
  root.style.setProperty("--reader-font-size", popupSettings.fontSize + "px");
}

// Apply popup theme (popup only, not page)
function applyPopupTheme(themeName) {
  const root = document.documentElement;
  root.classList.remove(
    "theme-dark",
    "theme-light",
    "theme-sepia",
    "theme-amoled",
    "theme-forest",
  );
  root.classList.add(themeName);
}

// Load saved settings (apply to popup UI only — page gets them on Play / change)
api.storage.sync.get(["font", "fontSize", "theme", "bionic"], (data) => {
  popupSettings.font = data.font || "sans-serif";
  popupSettings.fontSize = Number(data.fontSize) || 16;
  popupSettings.theme = data.theme || "theme-dark";
  popupSettings.bionic = data.bionic || false;

  // Update popup controls
  document.getElementById("font-select").value = popupSettings.font;
  document.getElementById("font-size").value = popupSettings.fontSize;
  document.getElementById("color-theme").value = popupSettings.theme;
  document.getElementById("set-bionic").checked = popupSettings.bionic;

  applyPopupStyle();
  applyPopupTheme(popupSettings.theme);
});

// Show a specific popup panel
function showPanel(id) {
  document
    .querySelectorAll(".fr-panel")
    .forEach((p) => (p.style.display = "none"));
  const panel = document.getElementById(id);
  if (panel) panel.style.display = "block";
}

// Default panel on load
document.addEventListener("DOMContentLoaded", () => {
  showPanel("panel-customize");
});

// Play button: start reader with selected text (if any)
document.getElementById("btn-play").addEventListener("click", async () => {
  let selectedText = "";
  // Ask background script for selected text
  try {
    selectedText = await new Promise((resolve) => {
      api.runtime.sendMessage({ action: "get-selection" }, (response) => {
        if (api.runtime.lastError) {
          resolve("");
          return;
        }
        resolve(response?.text || "");
      });
    });
  } catch (_) {}

  const tab = await getActiveTab();
  if (!tab?.id) {
    console.warn("[POPUP] No active tab for Play");
    return;
  }
  if (!/^https?:/.test(tab.url || "")) {
    console.warn("[POPUP] Open a normal http(s) page, then try Play again.");
    return;
  }

  const ok = await ensureContentScript(tab.id);
  if (!ok) {
    console.warn("[POPUP] Content script unavailable on", tab.url);
    return;
  }

  // Start reader in the tab
  try {
    await sendMessageToTab(tab.id, {
      action: "start-reader",
      selectedText,
      settings: { ...popupSettings },
    });
  } catch (err) {
    console.warn("[POPUP] start-reader failed:", err.message);
  }
});

// Panel switching buttons
document.getElementById("btn-customize").addEventListener("click", () => {
  showPanel("panel-customize");
});

// Font change
document.getElementById("font-select").addEventListener("change", (e) => {
  popupSettings.font = e.target.value;
  api.storage.sync.set({ font: popupSettings.font });
  applyPopupStyle();
  sendToReader("set-basic-font", popupSettings.font);
});

// Font size change
document.getElementById("font-size").addEventListener("change", (e) => {
  popupSettings.fontSize = Number(e.target.value);
  api.storage.sync.set({ fontSize: popupSettings.fontSize });
  applyPopupStyle();
  sendToReader("set-font-size", popupSettings.fontSize);
});

// Theme change
document.getElementById("color-theme").addEventListener("change", (e) => {
  popupSettings.theme = e.target.value;
  api.storage.sync.set({ theme: popupSettings.theme });
  applyPopupTheme(popupSettings.theme);
  sendToReader("set-theme", popupSettings.theme);
});

// Bionic toggle
document.getElementById("set-bionic").addEventListener("change", (e) => {
  popupSettings.bionic = e.target.checked;
  api.storage.sync.set({ bionic: popupSettings.bionic });
  sendToReader("set-bionic", popupSettings.bionic);
});

// Temporary placeholder panel buttons
document.getElementById("btn-three").addEventListener("click", () => showPanel("panel-three"));
document.getElementById("btn-four").addEventListener("click", () => showPanel("panel-four"));
document.getElementById("btn-five").addEventListener("click", () => showPanel("panel-five"));