import { state } from "./state.js";
import { renderChunk, updateReaderProgress } from "./readerUI.js";
import { extractSentences } from "./sentenceProcessing.js";

// Dynamic Sentence Count, Determines how many sentences to show on a page based on text length.
export function getDynamicSentenceCount(sentences, startIndex) {
  const BASE = 9;
  const MIN = 1;
  const MAX = 15;

  let count = BASE;
  let totalChars = 0;

  // Measure the combined length of the next BASE sentences
  for (let i = 0; i < BASE; i++) {
    const s = sentences[startIndex + i];
    if (!s) break;
    totalChars += s.length;
  }

  // Adjust count based on density
  if (totalChars < 300) {
    count = Math.min(MAX, BASE + 2);
  } else if (totalChars > 700) {
    count = Math.max(MIN, BASE - 2);
  }

  return count;
}

// Page Index Map, Builds an array of starting indexes for each page.
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

//Active Paragraph, Selects the correct chunk of sentences for the current page, 
//renders it, and updates progress.
export function setActiveParagraph() {
  // If no sentences yet, extract from page
  if (state.allSentences.length === 0) {
    state.allSentences = extractSentences();
  }

  // Build pagination if missing
  if (state.pageIndexMap.length === 0) {
    state.pageIndexMap = buildPageIndexMap();
  }
  // Determine the starting index for the current page
  const start = state.pageIndexMap[state.currentPage];
  
  // Calculate how many sentences this page should display
  const count = getDynamicSentenceCount(state.allSentences, start);
  const end = start + count;

  // Slice out the chunk of sentences for this page
  state.currentChunk = state.allSentences.slice(start, end);

  // Render the chunk into the reader UI
  renderChunk(state.currentChunk);

  // Update progress bar / page indicator
  updateReaderProgress();

  // Track which sentence index is active
  state.activeElement = start;
}

//Navigation, Moves forward/backward through pages using the index map.
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
