// Popup UI settings (synced to storage)
export const popupSettings = {
  font: "sans-serif",
  fontSize: 14,
  theme: "theme-light",
  bionic: false,
};

// Apply popup font + size to popup UI
export function applyPopupStyle() {
  const root = document.documentElement;
  root.style.setProperty("--reader-font", popupSettings.font);
  root.style.setProperty("--reader-font-size", popupSettings.fontSize + "px");
}

// Apply popup theme (popup only, not page)
export function applyPopupTheme(themeName) {
  const root = document.documentElement;
  root.classList.remove(
    "theme-light",
    "theme-dark",
    "theme-sepia",
    "theme-dracula",
    "theme-night",
    "theme-solarized",
    "theme-blue",
    "theme-green",
    "theme-purple",
    "theme-pink",
  );
  root.classList.add(themeName);
}