import { extractSentences, extractSentencesFromText } from "./sentenceProcessing.js";
import { injectReaderArea, updateReaderStyle } from "./readerUI.js";
import { toggleBlur, blurEnabled } from "./blur.js";
import { buildPageIndexMap, setActivePage, nextPage, updateLeveling } from "./pagination.js";
import { showSummaryPage, showPausedPage} from "./summary.js";
import { state } from "./state.js";

export function setupMessaging() {
  // Normalize extension API between Chrome (chrome) and Firefox (browser)
  const api = globalThis.browser || globalThis.chrome;

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    // console.log("[CONTENT] Message received:", msg);

    switch (msg.action) {
      case "ping":
        // Simple health check from the popup
        sendResponse({ ok: true });
        return false;

      case "start-reader":
        chrome.storage.sync.get(["xp", "level", "required", 
          "coins", "totalCoinsEarned", "totalCoinsSpent"], (data) => {
          try {
            // Load persistent player progression (these survive across sessions)
            if (data.xp !== undefined) state.xp = data.xp;
            if (data.level !== undefined) state.level = data.level;
            if (data.required !== undefined) state.required = data.required;
            if (data.coins !== undefined) state.coins = data.coins;
            if (data.totalCoinsEarned !== undefined) state.totalCoinsEarned = data.totalCoinsEarned;
            if (data.totalCoinsSpent !== undefined) state.totalCoinsSpent = data.totalCoinsSpent;
            console.log("[LEVEL] Loaded XP + Level:", state.xp, state.level);

            chrome.storage.local.remove("readerCheckpoint");
            // Start a NEW reading session
            state.sessionStartedAt = Date.now();
            // Reset reader content
            state.allSentences = [];
            state.pageIndexMap = [];
            state.currentChunk = [];
            state.activeElement = null;
            state.currentPage = 0;
            // Current article information
            console.log("[TITLE]", document.title);

            state.articleTitle = msg.articleTitle || document.title;
            state.articleWordCount  = 0;
            // Reading progress
            state.wordsReadSoFar = 0;
            state.currentPageWords = 0;
            state.currentPageChars = 0;
           // XP / Coin tracking
            state.coinsAtStart = state.coins;
            state.levelAtStart = state.level;
            state.sessionXp = 0;

            state.sessionCoinsGained = 0;
            state.sessionLevelCoins = 0;
            state.sessionReadingCoins = 0;
            // Progress tracking
            state.percentComplete = 0;
            state.paragraphSwitches = 0;

            // Session starts active
            state.sessionStatus = "active";

            // New article starts at 0%
            // Resumed article starts where it left off
            state.sessionStartPercent =
              msg.resumePercent || 0;
            // Topic metadata
            state.topicId = null;
            state.sessionCategory = "Reading";
            // User-created metadata
            state.sessionNotes = [];
            state.sessionTags = [];
            // Reset XP awards for paragraphs
            state.pageXpmap.clear();
            state.completedPages.clear();
            state.paragraphCache.clear();

            // Pause-related tracking
            state.pausedAt = null;
            state.isPaused = false;
            state.totalPausedMs = 0;
            // Running timer for this session
            state.totalSessionTime = 0;

            chrome.storage.sync.set({
              // Persist live session data so popup.js can display statistics even when reopened
              readingActive: true,
              sessionStartedAt: state.sessionStartedAt,
              articleTitle: state.articleTitle,

              //coinsGained: 0,
              sessionXp: 0,
              wordsReadSoFar: 0,
              currentPageWords: 0,
              percentComplete: 0,
              sessionReadingCoins: 0,

              pausedAt: null,
              totalPausedMs: 0,
              isPaused: false,
            });

            // Start timing the reading session
            state.timeStarted = Date.now();
            state.lastInteraction = Date.now();
            console.log("[READER] Started at:", state.timeStarted);

            // Track last interaction time for idle detection
            if (state.idleIntervalId) {
              clearInterval(state.idleIntervalId);
            }

            // state.idleIntervalId = setInterval(() => {
            //   const idleMs =
            //     Date.now() - state.lastInteraction;
            //   console.log("[READER] Idle check:", idleMs, "ms");

            //   if (idleMs > 45000) {
            //     console.log(
            //       "[READER] User idle too long"
            //     );
            //   }
            // }, 5000);

            // Apply any reader settings sent from popup
            if (msg.settings) {
              Object.assign(state.readerSettings, msg.settings);
            }

            // Toggle blur mode (enables/disables reader)
            toggleBlur();
            if (!blurEnabled) {
              // Reader was closed instead of opened
              sendResponse({ ok: true, active: false });
              return;
            }

            // Insert reader UI into the page
            injectReaderArea();

            // Use manually selected text if provided
            const selectedText = msg.selectedText?.trim();
            if (selectedText) {
              console.log("[READER] Using selected text");
              state.allSentences = extractSentencesFromText(selectedText);
            } else {
              console.log("[READER] Using Readability extraction");
              state.allSentences = extractSentences();
            }
            
            // Build pagination structure for reader
            state.pageIndexMap = buildPageIndexMap();
            state.currentPage = 0;

            // Apply styling + highlight first paragraph
            if (msg.resumePage !== undefined) {
              state.currentPage = Math.max(0,
                Math.min(msg.resumePage,state.pageIndexMap.length - 1)
              );
            }

            updateReaderStyle();
            setActivePage();
            sendResponse({
              ok: true,
              active: true,
            });
          } catch (err) {
            console.error("[CONTENT] start-reader error:", err);
          
          sendResponse({
          ok: false,
          error: err.message,
          });
        }
      });
        
      return true;
        
      case "next-page":
        nextPage();        // move to next page
        sendResponse({ ok: true });
        break;

      case "pause-reader":
        console.log("[MESSAGING] pause-reader received");
        state.lastInteraction = Date.now();
        state.isPaused = true;
        state.pausedAt = Date.now();
        showPausedPage();
        chrome.storage.sync.set({
          isPaused: true,
          pausedAt: state.pausedAt,
        });

        sendResponse({ ok: true });
        break;

      case "resume-reader":
        state.lastInteraction = Date.now();
        if (state.pausedAt) {
          const pausedDuration =
            Date.now() - state.pausedAt;

          state.totalPausedMs += pausedDuration;
        }

        state.pausedAt = null;
        state.isPaused = false;

        chrome.storage.sync.set({
          isPaused: false,
          pausedAt: null,
          totalPausedMs: state.totalPausedMs,
          readingActive: true,
        });
        //resumeReadingPage();
        sendResponse({ ok: true });

        break;
        
      case "finish-reader":
        if (state.idleIntervalId) {
          clearInterval(state.idleIntervalId);
          state.idleIntervalId = null;
        }
        console.log("[MESSAGING] finish-reader received");

        updateLeveling().then(() => {

          state.sessionStatus =
            state.percentComplete >= 100
              ? "completed"
              : "in_progress";

          chrome.storage.sync.set({
            readingActive: false,
          });
        chrome.storage.local.remove("readerCheckpoint");

          showSummaryPage();

          sendResponse({ ok: true });
        });

        return true;

      case "reader-active":
        sendResponse({
          active: !!document.getElementById(
            "reader-area-bar"
          )
        });
        break;
      case "set-basic-font":
        state.readerSettings.font = msg.value;
        updateReaderStyle();
        sendResponse({ ok: true });
        break;

      case "set-bionic":
        state.readerSettings.bionic = msg.value;
        updateReaderStyle();
        sendResponse({ ok: true });
        break;

      case "set-font-size":
        state.readerSettings.fontSize = msg.value;
        updateReaderStyle();
        sendResponse({ ok: true });
        break;

      case "set-theme":
        state.readerSettings.theme = msg.value;
        updateReaderStyle();
        sendResponse({ ok: true });
        break;

      default:
        console.log("[CONTENT] Unknown action:", msg.action);
        break;
    }

    return true; 
  });

  // console.log("[CONTENT] Messaging ready");
}