import { state } from "./state.js";
import { nextPage, prevPage, updateLeveling } from "./pagination.js";
import { showPausedPage, showSummaryPage } from "./summary.js";

// Choose the correct word‑transform function (normal or bionic)
export function getActiveTransformFunction() {
  return state.readerSettings.bionic ? transformBionic : transformNormal;
}

// Render a chunk of sentences into the reader UI
export function renderChunk(chunk) {
  const readerActive = document.getElementById("reader-active");
  if (!readerActive) return;

  const transform = getActiveTransformFunction();

  // Transform each sentence → each word → join back into HTML
  const html = chunk
    .map(sentence =>
      sentence.split(" ").map(word => transform(word)).join(" ")
    )
    .join(" ");

  readerActive.innerHTML = html;
}

// Re-render the current chunk (used when settings change)
export function rerenderReader() {
  if (!state.currentChunk) return;
  renderChunk(state.currentChunk);
}

// Normal mode: return word unchanged
export function transformNormal(word) {
  return word;
}

// Bionic mode: bold the first ~40% of each word
export function transformBionic(word) {
  const cutoff = Math.ceil(word.length * 0.4);
  const first = word.slice(0, cutoff);
  const rest = word.slice(cutoff);

  return `<span class="bionic-first">${first}</span>${rest}`;
}

// Apply a visual theme to all extension UI elements
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

// Update the page progress indicator (e.g., "3 / 12")
export function updateReaderProgress() {
  const progressEl = document.getElementById("reader-progress");
  if (!progressEl) return;

  const total = state.pageIndexMap.length;
  const current = state.currentPage + 1;

  progressEl.textContent = `${current} / ${total}`;
}

// Inject the reader UI bar into the page
export function injectReaderArea() {
  const existing = document.getElementById("reader-area-bar");
  if (existing) existing.remove();

  const bar = document.createElement("div");
  bar.id = "reader-area-bar";
  bar.classList.add("extension-theme");

  bar.innerHTML = `
    <div id="reader-page">
      <div id="reader-area-header">
        <span id="reader-status">Reading now</span>
  
        <div class="mini-progress">
          <div id="reader-progress"></div>
        </div>
        <div class="reader-session-actions">
          <button id="reader-pause">Pause</button>
          <button id="reader-finish">Finish Session</button>
          
          <button id="btn-prev">Previous</button>
          <button id="btn-next">Next</button>
        </div>
      </div>
      <div id="reader-active"></div>
    </div>
    <div id="reader-paused" class="hidden">
      <div class="paused-content">
        <h1>Reading Paused</h1>
        <p> Your reading session is currently paused. </p>
        <p> Would you like to continue where you left off? </p>
        <div class="paused-actions">
          <button id="paused-resume-btn">
            Resume Reading
          </button>
          <button id="paused-finish-btn">
            Finish Session
          </button>
        </div>
      </div>
    </div>
      <div id="reader-summary" class="hidden">
        <div id="summary-content"></div>
      </div>
  `;

  // Attach to <html> so blur mode can hide the entire page cleanly
  document.documentElement.appendChild(bar);

  // Navigation buttons
  document.getElementById("btn-next").addEventListener("click", nextPage);
  document.getElementById("btn-prev").addEventListener("click", prevPage);

  const pausedResumeBtn =
  document.getElementById("paused-resume-btn");

  const pausedFinishBtn =
    document.getElementById("paused-finish-btn");

  if (pausedResumeBtn) {
    pausedResumeBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({
        action: "resume-reader",
      });
    });
  }

  if (pausedFinishBtn) {
    pausedFinishBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({
        action: "finish-reader",
      });
    });
  }

  const pauseBtn =
  document.getElementById("reader-pause");

  const finishBtn =
    document.getElementById("reader-finish");

  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      console.log("[UI] Pause clicked");

      state.lastInteraction = Date.now();
      state.isPaused = true;
      state.pausedAt = Date.now();

      chrome.storage.sync.set({
        isPaused: true,
        pausedAt: state.pausedAt,
      });

      showPausedPage();
    });
  }

  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      console.log("[UI] Finish clicked");

      if (state.idleIntervalId) {
        clearInterval(state.idleIntervalId);
        state.idleIntervalId = null;
      }
      if (state.autosaveId) {
        clearInterval(state.autosaveId);
        state.autosaveId = null;
      }
      updateLeveling().then(() => {
        state.sessionStatus =
          state.percentComplete >= 100
            ? "completed"
            : "in_progress";

        chrome.storage.sync.set({
          readingActive: false,
        });

        showSummaryPage();
      });
    });
  }
}

// Apply font + size + theme settings to the reader UI
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