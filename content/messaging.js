import {
  extractSentences,
  extractSentencesFromText,
} from "./sentenceProcessing.js";
import { injectReaderArea, updateReaderStyle } from "./readerUI.js";
import { toggleBlur, blurEnabled } from "./blur.js";
import { state } from "./state.js";
import { buildPageIndexMap, setActiveParagraph } from "./pagination.js";

export function setupMessaging() {
  const api = globalThis.browser || globalThis.chrome;

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    console.log("[CONTENT] Message received:", msg);

    switch (msg.action) {
      case "ping":
        sendResponse({ ok: true });
        return false;

      case "start-reader":
        console.log(
          "[CONTENT] Starting reader, selectedText length:",
          msg.selectedText ? msg.selectedText.length : 0,
        );
        if (msg.settings) {
          Object.assign(state.readerSettings, msg.settings);
        }
        toggleBlur();
        if (!blurEnabled) {
          sendResponse({ ok: true, active: false });
          return false;
        }
        injectReaderArea();
        const manual = msg.selectedText?.trim();
        if (manual && manual.length > 0) {
          state.allSentences = extractSentencesFromText(manual);
        } else {
          state.allSentences = extractSentences();
        }
        state.pageIndexMap = buildPageIndexMap();
        state.currentPage = 0;
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

    return false;
  });

  console.log("[CONTENT] Messaging ready");
}