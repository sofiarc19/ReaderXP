import {
  extractSentences,
  extractSentencesFromText,
} from "./sentenceProcessing.js";
import { injectReaderArea, updateReaderStyle } from "./readerUI.js";
import { toggleBlur, blurEnabled } from "./blur.js";
import { state } from "./state.js";
import { buildPageIndexMap, setActiveParagraph } from "./pagination.js";

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
        console.log(
          "[CONTENT] Starting reader, selectedText length:",
          msg.selectedText ? msg.selectedText.length : 0,
        );

        // Apply any reader settings sent from popup
        if (msg.settings) {
          Object.assign(state.readerSettings, msg.settings);
        }

        // Toggle blur mode (enables/disables reader)
        toggleBlur();
        if (!blurEnabled) {
          // Reader was closed instead of opened
          sendResponse({ ok: true, active: false });
          return false;
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

        sendResponse({ ok: true, active: true });
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

    return false; // Required for async sendResponse in MV3
  });

  console.log("[CONTENT] Messaging ready");
}