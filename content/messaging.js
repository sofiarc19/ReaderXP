import {
  extractSentences,
  extractSentencesFromText,
} from "./sentenceProcessing.js";
import { injectReaderArea, updateReaderStyle } from "./readerUI.js";
import { toggleBlur, blurEnabled } from "./blur.js";
import { state } from "./state.js";
import { buildPageIndexMap, setActiveParagraph } from "./pagination.js";

export function setupMessaging() {
  browser.runtime.onMessage.addListener((msg) => {
    console.log("[CONTENT] Message received:", msg);

    switch (msg.action) {
      case "start-reader":
        console.log("[CONTENT] Starting reader, selectedText length:",
                    msg.selectedText ? msg.selectedText.length : 0);
        toggleBlur();
        if (!blurEnabled) return;
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
        break;

      case "set-basic-font":
        state.readerSettings.font = msg.value;
        updateReaderStyle();
        break;

      case "set-bionic":
        state.readerSettings.bionic = msg.value;
        updateReaderStyle();
        break;

      case "set-font-size":
        state.readerSettings.fontSize = msg.value;
        updateReaderStyle();
        break;

      case "set-theme":
        state.readerSettings.theme = msg.value;
        updateReaderStyle();
        break;

      default:
        console.log("[CONTENT] Unknown action:", msg.action);
        break;
    }
  });
}