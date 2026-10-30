// Popup UI settings (synced to storage)
export const popupSettings = {
  font: "sans-serif",
  fontSize: 16,
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
    "theme-dark",
    "theme-light",
    "theme-forest"
  );
  root.classList.add(themeName);
}