import { state } from "./state.js";
import { renderChunk, updateReaderProgress } from "./readerUI.js";
import { extractSentences } from "./sentenceProcessing.js";

  // Dynamic Sentence Count
export function getDynamicSentenceCount(sentences, startIndex) {
  const BASE = 9;
  const MIN = 1;
  const MAX = 15;

  let count = BASE;
  let totalChars = 0;

  for (let i = 0; i < BASE; i++) {
    const s = sentences[startIndex + i];
    if (!s) break;
    totalChars += s.length;
  }

  if (totalChars < 300) {
    count = Math.min(MAX, BASE + 2);
  } else if (totalChars > 700) {
    count = Math.max(MIN, BASE - 2);
  }

  return count;
}

  // Page Index Map
export function buildPageIndexMap() {
  const map = [];
  let index = 0;

  while (index < state.allSentences.length) {
    map.push(index);
    const count = getDynamicSentenceCount(state.allSentences, index);
    index += count;
  }

  return map;
}

 //Active Paragraph
export function setActiveParagraph() {
  if (state.allSentences.length === 0) {
    state.allSentences = extractSentences();
  }

  if (state.pageIndexMap.length === 0) {
    state.pageIndexMap = buildPageIndexMap();
  }

  const start = state.pageIndexMap[state.currentPage];
  const count = getDynamicSentenceCount(state.allSentences, start);
  const end = start + count;

  state.currentChunk = state.allSentences.slice(start, end);

  renderChunk(state.currentChunk);
  updateReaderProgress();

  state.activeElement = start;
}

  //Navigation
export function nextPage() {
  if (state.currentPage < state.pageIndexMap.length - 1) {
    state.currentPage++;
    setActiveParagraph();
  }
}

export function prevPage() {
  if (state.currentPage > 0) {
    state.currentPage--;
    setActiveParagraph();
  }
}
