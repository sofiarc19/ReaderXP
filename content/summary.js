import { buildReadingSession, saveReadingSession } from "./sessions";
import { toggleBlur } from "./blur";
import { state } from "./state";

// Summary page
export function showSummaryPage() {
  chrome.storage.sync.set({
    readingActive: false,
    sessionXp: state.sessionXp,
    wordsReadSoFar: state.wordsReadSoFar,
    percentComplete: state.percentComplete,
  });
  chrome.storage.sync.set({
    readingActive: false,
    isPaused: false,
  });
  state.isPaused = false;
  state.pausedAt = null;
  state.totalSessionTime =
    Date.now()
    - state.sessionStartedAt
    - state.totalPausedMs;

  const session = buildReadingSession(state);
  if (state.idleIntervalId) {
    clearInterval(state.idleIntervalId);
    state.idleIntervalId = null;
  }

  saveReadingSession(session);

  const totalSeconds =
    Math.floor(session.totalTimeMs / 1000);

  const hours =
    Math.floor(totalSeconds / 3600);

  const minutes =
    Math.floor((totalSeconds % 3600) / 60);

  const seconds =
    totalSeconds % 60;

  const formattedTime =
    hours > 0
      ? `${hours}h ${minutes}m ${seconds}s`
      : `${minutes}m ${seconds}s`;

  document
    .getElementById("reader-page")
    ?.classList.add("hidden");

  document
    .getElementById("reader-summary")
    ?.classList.remove("hidden");

  document
  .getElementById("summary-content")
  .innerHTML = `
  
    <div class="summary-header">
      <h1>Reading Summary</h1>
      <p>Your session has been saved.</p>
    </div>

    <div class="summary-stats">

      <div class="summary-stat">
        <span>Title</span>
        <strong>${session.title}</strong>
      </div>

      <div class="summary-stat">
        <span>XP Gained</span>
        <strong>${session.xpGained}</strong>
      </div>

      <div class="summary-stat">
        <span>Words Read</span>
        <strong>${session.totalWords}</strong>
      </div>

      <div class="summary-stat">
        <span>Time Reading</span>
        <strong>${formattedTime}</strong>
      </div>

      <div class="summary-stat">
        <span>Progress</span>
        <strong>${(session.percentComplete || 0).toFixed(1)}%</strong>
      </div>

    </div>

    <div class="summary-actions">

      <button id="summary-save-topic">
        Save to Topic
      </button>

      <button id="summary-finish-reading">
        Finish Reading Session
      </button>

      <button id="summary-pet-shop">
        Go To Pet Shop
      </button>

      <button id="summary-close-btn">
        Close
      </button>

    </div>

    <div id="summary-topic-picker" class="hidden"></div>
  `;

  document
  .getElementById("summary-finish-reading")
  ?.addEventListener("click", () => {

    toggleBlur();

    document
      .getElementById("reader-area-bar")
      ?.remove();
  });

 document
  .getElementById("summary-close-btn")
  ?.addEventListener("click", () => {
    chrome.storage.sync.set({
      readingActive: false,
    });

    toggleBlur();

    document
      .getElementById("reader-area-bar")
      ?.remove();
  });

  document
    .getElementById("summary-pet-shop")
    ?.addEventListener("click", () => {

    toggleBlur();

    document
      .getElementById("reader-area-bar")
      ?.remove();

    console.log(
      "[SUMMARY] Open pet shop later"
    );

  });
}

export function showPausedPage() {
  document
    .getElementById("reader-page")
    ?.classList.add("hidden");

  document
    .getElementById("reader-summary")
    ?.classList.add("hidden");

  document
    .getElementById("reader-paused")
    ?.classList.remove("hidden");

  const resumeBtn =
  document.getElementById(
    "paused-resume-btn"
  );

  if (resumeBtn) {
    resumeBtn.onclick = () => {

      if (state.pausedAt) {

        const pausedDuration =
          Date.now() - state.pausedAt;

        state.totalPausedMs += pausedDuration;
      }

      state.pausedAt = null;
      state.isPaused = false;

      chrome.storage.sync.set({
        isPaused: false,
        totalPausedMs: state.totalPausedMs,
        readingActive: true,
      });

      resumeReadingPage();
    };
  }

  document
    .getElementById("paused-finish-btn")
    ?.addEventListener("click", () => {

      showSummaryPage();
      state.isPaused = false;
      state.pausedAt = null;

  });
}

export function resumeReadingPage() {
  document
    .getElementById("reader-paused")
    ?.classList.add("hidden");

  document
    .getElementById("reader-page")
    ?.classList.remove("hidden");

}