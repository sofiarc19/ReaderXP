// Browser compatibility
window.browser = window.browser || window.chrome;

// Unified popup settings
let popupSettings = {
  font: "sans-serif",
  fontSize: 16,
  theme: "theme-dark",
  bionic: false,
};
browser.runtime.onMessage.addListener((msg) => {
  if (msg.ready) {
    sendToReader("set-theme", popupSettings.theme);
    sendToReader("set-basic-font", popupSettings.font);
    sendToReader("set-font-size", popupSettings.fontSize);
    sendToReader("set-bionic", popupSettings.bionic);
  }
});

// Helper: send message directly to content script
function sendToReader(action, value) {
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    browser.tabs.sendMessage(tabs[0].id, { action, value });
  });
}

// Apply popup UI styles
function applyPopupStyle() {
  const root = document.documentElement;
  root.style.setProperty("--reader-font", popupSettings.font);
  root.style.setProperty("--reader-font-size", popupSettings.fontSize + "px");
}

// Apply popup theme
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

// Load saved settings
browser.storage.sync.get(["font", "fontSize", "theme", "bionic"], (data) => {
  popupSettings.font = data.font || "sans-serif";
  popupSettings.fontSize = Number(data.fontSize) || 16;
  popupSettings.theme = data.theme || "theme-dark";
  popupSettings.bionic = data.bionic || false;

  // Set UI controls
  document.getElementById("font-select").value = popupSettings.font;
  document.getElementById("font-size").value = popupSettings.fontSize;
  document.getElementById("color-theme").value = popupSettings.theme;
  document.getElementById("set-bionic").checked = popupSettings.bionic;

  // Apply to popup UI
  applyPopupStyle();
  applyPopupTheme(popupSettings.theme);

  // Apply to reader area
  sendToReader("set-theme", popupSettings.theme);
  sendToReader("set-basic-font", popupSettings.font);
  sendToReader("set-font-size", popupSettings.fontSize);
  sendToReader("set-bionic", popupSettings.bionic);
});

// Panel switching
function showPanel(id) {
  document
    .querySelectorAll(".fr-panel")
    .forEach((p) => (p.style.display = "none"));
  const panel = document.getElementById(id);
  if (panel) panel.style.display = "block";
}

// Default panel
document.addEventListener("DOMContentLoaded", () => {
  showPanel("panel-customize");
});

// Button: start reader
document.getElementById("btn-play").addEventListener("click", () => {
  browser.runtime.sendMessage({ action: "get-selection" }, (response) => {
    const selectedText = response?.text || "";

    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) return;

      browser.tabs.sendMessage(tabs[0].id, {
        action: "start-reader",
        selectedText,
      });
    });
  });
});

// Button: customize panel
document.getElementById("btn-customize").addEventListener("click", () => {
  showPanel("panel-customize");
});

// Font change
document.getElementById("font-select").addEventListener("change", (e) => {
  popupSettings.font = e.target.value;
  browser.storage.sync.set({ font: popupSettings.font });
  applyPopupStyle();
  sendToReader("set-basic-font", popupSettings.font);
});

// Font size change
document.getElementById("font-size").addEventListener("change", (e) => {
  popupSettings.fontSize = Number(e.target.value);
  browser.storage.sync.set({ fontSize: popupSettings.fontSize });
  applyPopupStyle();
  sendToReader("set-font-size", popupSettings.fontSize);
});

// Theme change
document.getElementById("color-theme").addEventListener("change", (e) => {
  popupSettings.theme = e.target.value;
  browser.storage.sync.set({ theme: popupSettings.theme });
  applyPopupTheme(popupSettings.theme);
  sendToReader("set-theme", popupSettings.theme);
});

// Bionic toggle
document.getElementById("set-bionic").addEventListener("change", (e) => {
  popupSettings.bionic = e.target.checked;
  browser.storage.sync.set({ bionic: popupSettings.bionic });
  sendToReader("set-bionic", popupSettings.bionic);
});

// Other panel buttons
document
  .getElementById("btn-three")
  .addEventListener("click", () => showPanel("panel-three"));
document
  .getElementById("btn-four")
  .addEventListener("click", () => showPanel("panel-four"));
document
  .getElementById("btn-five")
  .addEventListener("click", () => showPanel("panel-five"));
