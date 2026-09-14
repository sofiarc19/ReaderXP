import { state } from "./state.js";
import { nextPage, prevPage } from "./pagination.js";

export function getActiveTransformFunction() {
  return state.readerSettings.bionic ? transformBionic : transformNormal;
}

export function renderChunk(chunk) {
  const readerActive = document.getElementById("reader-active");
  if (!readerActive) return;

  const transform = getActiveTransformFunction();

  const html = chunk
    .map(sentence =>
      sentence.split(" ").map(word => transform(word)).join(" ")
    )
    .join(" ");

  readerActive.innerHTML = html;
}

export function rerenderReader() {
  if (!currentChunk) return;
  renderChunk(currentChunk);
}

//default
export function transformNormal(word) {
  return word;
}

//bionic mode
export function transformBionic(word) {
  const cutoff = Math.ceil(word.length * 0.4);
  const first = word.slice(0, cutoff);
  const rest = word.slice(cutoff);

  return `<span class="bionic-first">${first}</span>${rest}`;
}

//themes
export function applyTheme(themeName) {
  const targets = document.querySelectorAll(".extension-theme");

  targets.forEach(el => {
    el.classList.remove(
      "theme-dark",
      "theme-light",
      "theme-forest"
    );
    el.classList.add(themeName);
  });
}

export function updateReaderProgress() {
  const progressEl = document.getElementById("reader-progress");
  if (!progressEl) return;

  const total = state.pageIndexMap.length;
  const current = state.currentPage + 1;

  progressEl.textContent = `${current} / ${total}`;
}

export function injectReaderArea() {
  const existing = document.getElementById("reader-area-bar");
  if (existing) existing.remove();

  const bar = document.createElement("div");
  bar.id = "reader-area-bar";
  bar.classList.add("extension-theme");

  bar.innerHTML = `
    <div id="reader-area-header">
      <div id="reader-progress"></div>
      <button id="btn-prev">Previous</button>
      <button id="btn-next">Next</button>
    </div>
    <div id="reader-active"></div>
  `;

  // attach to <html>, not <body>
  document.documentElement.appendChild(bar);

  document.getElementById("btn-next").addEventListener("click", nextPage);
  document.getElementById("btn-prev").addEventListener("click", prevPage);
}

export function updateReaderStyle() {
  const bar = document.getElementById("reader-area-bar");
  if (!bar) return;

  bar.style.setProperty("--reader-font", state.readerSettings.font);
  bar.style.setProperty("--reader-font-size", state.readerSettings.fontSize + "px");

  const targets = document.querySelectorAll(".extension-theme");
  targets.forEach(el => {
    el.classList.remove("theme-dark", "theme-light", "theme-forest");
    el.classList.add(state.readerSettings.theme);
  });
}
