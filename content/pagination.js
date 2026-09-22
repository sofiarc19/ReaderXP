import { state } from "./state.js";
import { renderChunk, updateReaderProgress } from "./readerUI.js";
import { extractSentences } from "./sentenceProcessing.js";

// Character Thresholds
const SHORT_THRESHOLD = 300;
const LONG_THRESHOLD = 700;

state.paragraphCache = new Map();

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
  if (totalChars < SHORT_THRESHOLD) {
    count = Math.min(MAX, BASE + 2);
  } else if (totalChars > LONG_THRESHOLD) {
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

// Level system based on Time‑based validation + Paragraph uniqueness + 
// Paragraph difficulty scaling → award XP → level up
// later add Store XP + levels in chrome.storage.sync
export function updateLeveling() {
  const paragraphId = state.currentPage;
  const sentences = state.currentChunk;
  const timeMs = Date.now() - state.timeStarted;

  // 1. Prevent double XP
  if (state.paragraphXpMap.has(paragraphId)) {
    console.log("[LEVEL] No XP: paragraph already rewarded.");
    return;
  }

  // 2. Determine expected reading time
  const { expectedTime, difficulty } = getCachedStats(paragraphId, sentences);
  console.log("[LEVEL] Time spent:", timeMs, "Expected:", expectedTime);

  if (timeMs < expectedTime) {
    console.log("[LEVEL] No XP: user did not spend enough time.");
    return;
  }

  // 3. Calculate difficulty-based XP
  const xp = difficulty;
  state.xp += xp;

  console.log("[LEVEL] XP gained:", xp, "Total XP:", state.xp);

  // 4. Mark paragraph as rewarded 
  state.paragraphXpMap.add(paragraphId);

  // 5. Level up check 
  if (state.xp >= state.level * 100) {
    state.level++;
    console.log("[LEVEL] Level up! New level:", state.level);
  }

  // 6. Reset timer for next paragraph
  state.timeStarted = Date.now();
}

//Navigation, Moves forward/backward through pages using the index map.
export function nextPage() {
  if (state.currentPage < state.pageIndexMap.length - 1) {
    state.lastInteraction = Date.now(); // user interacted
    console.log("[READER] Interaction: nextPage → lastInteraction:", state.lastInteraction);

    state.paragraphSwitches++;
    state.currentPage++;
    updateLeveling(); // award XP + check level
    setActiveParagraph();
  }
}

export function prevPage() {
  if (state.currentPage > 0) {
    state.lastInteraction = Date.now(); // user interacted
    console.log("[READER] Interaction: prevPage → lastInteraction:", state.lastInteraction);

    state.paragraphSwitches++;
    state.currentPage--;
    setActiveParagraph();
  }
}

// helper functions
// Cached paragraph stats (density, expected time, difficulty)
function getCachedStats(paragraphId, sentences) {
  if (state.paragraphCache.has(paragraphId)) {
    return state.paragraphCache.get(paragraphId);
  }

  // Compute stats
  const { chars, sentenceCount } = getParagraphStats(sentences);

  const expectedTime = getExpectedTimeMs(sentences);
  const difficulty = getParagraphDifficulty(sentences);

  const stats = { chars, sentenceCount, expectedTime, difficulty };

  // Store in cache
  state.paragraphCache.set(paragraphId, stats);

  return stats;
}

function getParagraphStats(sentences) {
  const chars = sentences.reduce((sum, s) => sum + s.length, 0);
  const sentenceCount = sentences.length;

  return { chars, sentenceCount };
}

function getExpectedTimeMs(sentences) {
  const { chars } = getParagraphStats(sentences);

  // Base time per paragraph
  let base = 15000; // 15 seconds minimum

  // Adjust based on density
  if (chars < SHORT_THRESHOLD) base -= 5000;   // short paragraph = -5 secs → 10s
  if (chars > LONG_THRESHOLD) base += 5000;   // long paragraph = +5 → 20s

  return base;
}

function getParagraphDifficulty(sentences) {
  const { chars, sentenceCount } = getParagraphStats(sentences);

  let xp = 5; // base XP
  // Minimum XP per paragraph
  xp = Math.max(xp, 3);
  // Max XP per paragraph 
  xp = Math.min(xp, 20);

  if (chars < SHORT_THRESHOLD) xp += 2;   // short paragraph
  if (chars > LONG_THRESHOLD) xp += 6;   // long paragraph

  xp += Math.floor(sentenceCount / 2); // more sentences → more XP

  return xp;
}
