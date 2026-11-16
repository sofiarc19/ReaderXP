import { buildReadingSession, saveReadingSession } from "./sessions";
import { loadPet, savePet, rewardPetForReading, getMoodCoinMultiplier } from "../popup/pet";
import { getSessionCoinReward } from "./sessions";
import { updateLeveling } from "./pagination";
import { toggleBlur } from "./blur";
import { state } from "./state";

// Summary page
export function showSummaryPage() {
  console.log(
    "[SUMMARY] sessionXp at summary:",
    state.sessionXp
  );
  chrome.storage.sync.set({
    readingActive: false,
    isPaused: false,
    sessionXp: state.sessionXp,
    wordsReadSoFar: state.wordsReadSoFar,
    percentComplete: state.percentComplete,
  });
  state.isPaused = false;
  state.pausedAt = null;
  state.totalSessionTime =
    Date.now()
    - state.sessionStartedAt
    - state.totalPausedMs;

  if (state.idleIntervalId) {
    clearInterval(state.idleIntervalId);
    state.idleIntervalId = null;
  }
  if (state.autosaveId) {
    clearInterval(state.autosaveId);
    state.autosaveId = null;
  }
  loadPet((pet) => {
    const sessionCoins =
      getSessionCoinReward(
        state.percentComplete
      );

    const multiplier = getMoodCoinMultiplier(pet);
    const finalCoins = Math.max(1, Math.round(sessionCoins * multiplier));

    // Track coins earned THIS session
    state.sessionReadingCoins = finalCoins;
    state.sessionCoinsGained += finalCoins;

    // Award coins
    state.coins += finalCoins;
    state.totalCoinsEarned += finalCoins;

    chrome.storage.sync.set({
      coins: state.coins,
      totalCoinsEarned: state.totalCoinsEarned,
      sessionXp: state.sessionXp,
    });

    rewardPetForReading(pet, {xpGained: state.sessionXp});

    savePet(pet);

    console.log("[COINS]", {
        percentComplete: state.percentComplete,
        baseCoins: sessionCoins,
        mood: pet.mood,
        multiplier, finalCoins
      });

    // Count the currently visible page if it hasn't
    // already been counted through page navigation.
    if (state.currentPage === 0 && state.wordsReadSoFar === 0 &&
      state.currentPageWords > 0) {
      state.wordsReadSoFar = state.currentPageWords;
    }
    const session = buildReadingSession(state);
    saveReadingSession(session);
  
    const totalSeconds = Math.floor(session.totalTimeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedTime = hours > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : `${minutes}m ${seconds}s`;

    document.getElementById("reader-page")?.classList.add("hidden");
    document.getElementById("reader-paused")?.classList.add("hidden");
    document.getElementById("reader-summary")?.classList.remove("hidden");

    document.getElementById("summary-content")
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
          <span>Session Stats</span>

          <div class="summary-inline">
            <strong>+${session.xpGained} XP |</strong>
            <strong>Level: ${state.level} |</strong>
            <strong>Current XP: ${state.xp} / ${state.required}</strong>
          </div>
        </div>

        <div class="summary-stat">
          <span>Coin Rewards</span>
          <div class="summary-inline">
            <strong>Reading: ${state.sessionReadingCoins} +</strong>
            <strong>Level: ${state.sessionLevelCoins} =</strong>
            <strong>Total Coins gained: +${session.coinsGained}</strong>
          </div>
        </div>

        <div class="summary-stat">
        <span>Reading Stats:</span>
          <div class="summary-inline">
            <strong>Words Read: ${session.wordsRead} |</strong>
            <strong>Time Reading: ${formattedTime} |</strong>
            <strong>Progress: ${(session.percentComplete || 0).toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      <div class="summary-actions">

        <button id="summary-close-btn">
          Close
        </button>

      </div>

      <div id="summary-topic-picker" class="hidden"></div>
    
    `;
    
  document.getElementById("summary-close-btn")
    ?.addEventListener("click", () => {
      chrome.storage.sync.set({
        readingActive: false,
      });

      toggleBlur();

      document
        .getElementById("reader-area-bar")
        ?.remove();
    });
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

  const finishBtn = document.getElementById("paused-finish-btn");
  if (finishBtn) {
    finishBtn.onclick = () => {
      updateLeveling().then(() => {
        state.sessionStatus =
          state.percentComplete >= 100
            ? "completed"
            : "in_progress";

        chrome.storage.sync.set({
          readingActive: false,
        });

        showSummaryPage();

        state.isPaused = false;
        state.pausedAt = null;
      });
    };
  }
}

export function resumeReadingPage() {
  document
    .getElementById("reader-paused")
    ?.classList.add("hidden");

  document
    .getElementById("reader-page")
    ?.classList.remove("hidden");

}