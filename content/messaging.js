import {
  extractSentences,
  extractSentencesFromText,
} from "./sentenceProcessing.js";
import { injectReaderArea, updateReaderStyle } from "./readerUI.js";
import { toggleBlur, blurEnabled } from "./blur.js";
import { state } from "./state.js";
import { buildPageIndexMap, setActiveParagraph, nextPage } from "./pagination.js";
import { showSummaryPage } from "./summary.js";

export function setupMessaging() {
  // Normalize extension API between Chrome (chrome) and Firefox (browser)
  const api = globalThis.browser || globalThis.chrome;

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    console.log("[CONTENT] Message received:", msg);

    switch (msg.action) {
      case "ping":
        // Simple health check from the popup
        sendResponse({ ok: true });
        return false;

      case "start-reader":
        chrome.storage.sync.get(["xp", "level"], (data) => {
          try {
            if (data.xp !== undefined) state.xp = data.xp;
            if (data.level !== undefined) state.level = data.level;

            console.log("[LEVEL] Loaded XP + Level:", state.xp, state.level);

            console.log(
              "[CONTENT] Starting reader, selectedText length:",
              msg.selectedText ? msg.selectedText.length : 0,
            );

            state.sessionStartedAt = Date.now();
            state.pausedAt = null;
            state.isPaused = false;
            state.totalPausedMs = 0;
            state.totalSessionTime = 0;

            state.articleTitle = document.title;
            state.wordsReadSoFar = 0;
            state.currentWords = 0;
            
            state.levelAtStart = state.level;
            state.sessionXp = 0;

            state.percentComplete = 0;
            state.paragraphSwitches = 0;

            state.sessionNotes = [];
            state.sessionTags = [];

            state.paragraphXpMap.clear();

            chrome.storage.sync.set({
              readingActive: true,
              sessionStartedAt: state.sessionStartedAt,
              articleTitle: document.title,

              sessionXp: 0,
              wordsReadSoFar: 0,
              currentWords: 0,

              percentComplete: 0,

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

            state.idleIntervalId = setInterval(() => {
              const idleMs =
                Date.now() - state.lastInteraction;
              console.log(
                "[READER] Idle check:",
                idleMs,
                "ms"
              );

              if (idleMs > 45000) {
                console.log(
                  "[READER] User idle too long"
                );
              }
            }, 5000);

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
            const manual = msg.selectedText?.trim();
            if (manual && manual.length > 0) {
              state.allSentences = extractSentencesFromText(manual);
            } else {
              // Otherwise extract sentences from the page
              state.allSentences = extractSentences();
            }
            
            // Build pagination structure for reader
            state.pageIndexMap = buildPageIndexMap();
            state.currentPage = 0;

            // Apply styling + highlight first paragraph
            updateReaderStyle();
            setActiveParagraph();
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
        nextPage();        // move to next paragraph
        sendResponse({ ok: true });
        break;

      case "pause-reader":
        state.isPaused = true;
        state.pausedAt = Date.now();
        showPausedPage();
        chrome.storage.sync.set({
          isPaused: true,
        });

        sendResponse({ ok: true });
        break;

      case "resume-reader":
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

        sendResponse({ ok: true });

        break;
        
      case "finish-reader":
        console.log("[READER] Finish clicked");
        state.sessionStatus = "completed";
        showSummaryPage();
        sendResponse({ ok: true });
        chrome.storage.sync.set({
          readingActive: false,
        });
        break;

      case "bookmark-reader":
        state.sessionStatus =
          "bookmarked";

        saveReadingSession(
          buildReadingSession(state)
        );

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

  console.log("[CONTENT] Messaging ready");
}