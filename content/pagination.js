import { state } from "./state.js";
import { renderChunk, updateReaderProgress } from "./readerUI.js";
import { extractSentences } from "./sentenceProcessing.js";
import { showSummaryPage } from "./summary.js";

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
    state.totalWordsRead =state.allSentences.join(" ").split(/\s+/).filter(Boolean).length;
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
  const gainedXp = difficulty;

  state.xp += gainedXp;
  state.sessionXp += gainedXp;
  // 3.5: Save XP + level to chrome.storage.sync
  chrome.storage.sync.set({
    sessionXp: state.sessionXp,
    xp: state.xp,
    level: state.level
  }, () => {
    console.log("[LEVEL] Saved XP + Level:", state.xp, state.level);
  });

  // 4. Mark paragraph as rewarded 
  state.paragraphXpMap.add(paragraphId);

  // 5. Level up check 
  const required = state.level * 100;

  if (state.xp >= required) {
    state.xp -= required;   // subtract required XP
    state.level++;          // level up
    console.log("[LEVEL] Level up! New level:", state.level);
  }

  // 6. Reset timer for next paragraph
  state.timeStarted = Date.now();
}

//Navigation, Moves forward/backward through pages using the index map.
export function nextPage() {
  console.log(
    "[NEXT PAGE] Before:",
    state.currentPage,
    "/",
    state.pageIndexMap.length - 1
  );
    
  if (state.currentPage < state.pageIndexMap.length - 1) {
    state.lastInteraction = Date.now();
    
    state.paragraphSwitches++;
    state.wordsReadSoFar += state.currentWords;
    state.currentPage++;
    chrome.storage.sync.set({
      wordsReadSoFar: state.wordsReadSoFar,
    });
    state.percentComplete =
    (
      ((state.currentPage + 1) /
        state.pageIndexMap.length)
      * 100
    );
    
    chrome.storage.sync.set({
      readingActive: true,
      sessionXp: state.sessionXp,
      wordsReadSoFar: state.wordsReadSoFar,
      percentComplete: state.percentComplete,
    });

      updateLeveling();
      setActiveParagraph();

      state.currentWords =
      state.currentChunk
        .join(" ")
        .split(/\s+/)
        .filter(Boolean)
        .length;

      chrome.storage.sync.set({
        currentWords: state.currentWords,
      });
   } else {
      console.log(
        "[SUMMARY] Showing summary"
      );

    showSummaryPage();
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
  const { chars, sentenceCount } = getParagraphStats(sentences);

  // Base time: 1.2 seconds per sentence
  let base = sentenceCount * 1200;

  // Density multiplier: more characters = slower reading
  const densityMultiplier = chars / (sentenceCount * 80); 
  // 80 chars per sentence is average

  base *= densityMultiplier;

  // Clamp between 8s and 30s
  base = Math.max(base, 8000);
  base = Math.min(base, 30000);

  return Math.round(base);
}

function getParagraphDifficulty(sentences) {
  const { chars, sentenceCount } = getParagraphStats(sentences);

  let xp = 0;

  // XP from sentence count (structure)
  xp += sentenceCount * 1.5; // 1.5 XP per sentence

  // XP from density (content weight)
  xp += chars / 120; // 120 chars ≈ 1 XP

  // Short paragraph bonus
  if (chars < SHORT_THRESHOLD) xp += 1;

  // Long paragraph bonus
  if (chars > LONG_THRESHOLD) xp += 4;

  // Clamp between 3 and 30 XP
  xp = Math.max(xp, 3);
  xp = Math.min(xp, 30);

  return Math.round(xp);
}