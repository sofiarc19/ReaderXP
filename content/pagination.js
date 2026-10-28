import { state } from "./state.js";
import { renderChunk, updateReaderProgress } from "./readerUI.js";
import { extractSentences } from "./sentenceProcessing.js";
import { showSummaryPage } from "./summary.js";
import { saveSessionCheckpoint } from "./sessions.js";

// Character Thresholds
const SHORT_THRESHOLD = 300;
const LONG_THRESHOLD = 700;

// XP multipliers for rereads
const XP_MULTIPLIERS = {
  FIRST_READ: 1,
  SECOND_READ: 0.5,
  REPEAT_READ: 0.25,
};
// state.paragraphCache = new Map();

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
  state.articleWordCount =
      state.allSentences
        .join(" ")
        .split(/\s+/)
        .filter(Boolean)
        .length;
        
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
  state.currentPageWords =
    state.currentChunk
      .join(" ")
      .split(/\s+/)
      .filter(Boolean)
      .length;

  // Render the chunk into the reader UI
  renderChunk(state.currentChunk);

  // Update progress bar / page indicator
  updateReaderProgress();

  // Track which sentence index is active
  state.activeElement = start;
}

// XP is awarded when leaving a page, not when entering a page. This ensures the user has
// spent sufficient time reading the content before receiving XP.
export function updateLeveling() {
  return new Promise((resolve) => {
  const paragraphId = state.currentPage;
  const sentences = state.currentChunk;

  if (!state.timeStarted) {
    state.timeStarted = Date.now();
    resolve();
    return;
  }

  const timeMs = Date.now() - state.timeStarted;

  // Prevent double XP
  if (state.paragraphXpMap.has(paragraphId)) {
    console.log("[LEVEL] No XP: paragraph already rewarded.");
    resolve();
    return;
  }

  // Determine expected reading time
  const { expectedTime, difficulty } = getCachedStats(paragraphId, sentences);
  console.log("[LEVEL] Time spent:", timeMs, "Expected:", expectedTime);

  if (timeMs < expectedTime) {
    console.log("[LEVEL] No XP: user did not spend enough time.");
    resolve();
    return;
  }

  // Find previous reads of this article
  chrome.storage.sync.get(["history"], (data) => {
    const history = data.history || [];

    const existingArticle = history
      .filter((item) => item.url === window.location.href)
      .sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0))[0];

    const sessionCount =
      existingArticle?.sessionCount || 0;

    const completedArticle =
      existingArticle && ( existingArticle.status === "completed" ||
        existingArticle.percentComplete >= 100
      );

    let xpMultiplier = XP_MULTIPLIERS.FIRST_READ;

    if (completedArticle) {
      const reads =
        existingArticle.sessionCount || 1;

      if (reads >= 3) {
        xpMultiplier =
          XP_MULTIPLIERS.REPEAT_READ;
      }
      else if (reads >= 2) {
        xpMultiplier =
          XP_MULTIPLIERS.SECOND_READ;
      }
    }

    // Calculate difficulty-based XP
    const gainedXp = Math.max( 1, Math.round(difficulty * xpMultiplier));

    state.xp += gainedXp;
    state.sessionXp += gainedXp;

    // Mark paragraph as rewarded
    state.paragraphXpMap.add(paragraphId);

    // Level up check
    while (state.xp >= getRequiredXp(state.level)) {

      state.xp -= getRequiredXp(state.level);
      
      const levelReward =
        getLevelUpCoins(
          state.level + 1
        );

      state.level++;

      state.coins += levelReward;
      // could be wrong:
      state.sessionCoinsGained += levelReward;

      console.log(
        "[LEVEL] Level up! New level:",
        state.level,
        "Coins Earned:",
        levelReward
      );
    }

    // XP required for next level
    state.required = getRequiredXp(state.level);

    console.log(
      "[LEVEL] XP Award:", gainedXp,
      "Current XP:", state.xp, 
      "/ Required:", state.required,
      "Mood Multiplier:", xpMultiplier,
      "Coins Gained:", state.sessionCoinsGained,
      "Session Count:", sessionCount);
    // Save progression
    chrome.storage.sync.set(
      {
        sessionXp: state.sessionXp,
        xp: state.xp,
        required: state.required,
        level: state.level,
        coins: state.coins,
      },
      () => {
        console.log(
          "[LEVEL] Saved XP + Level:",
          state.xp,
          state.level
        );
      // Reset timer for next paragraph
      state.timeStarted = Date.now();
      resolve();
      }
    );
  });
});
}
//Navigation, Moves forward/backward through pages using the index map.
export function nextPage() {
  console.log(
    "[SUMMARY] Final session XP:",
    state.sessionXp
  );
  // currentPageWords = words in the page currently visible, When moving pages:
  // 1. Add current page words to running total
  // 2. Award XP for current page
  // 3. Move to next page
  // 4. Render next page
  // 5. Calculate the next page's word count
  console.log("Page: ", state.currentPage + 2);
    
  if (state.currentPage < state.pageIndexMap.length - 1) {
    state.lastInteraction = Date.now();
    state.paragraphSwitches++;

    state.wordsReadSoFar += state.currentPageWords;

    updateLeveling().then(() => {
      state.currentPage++;

      state.percentComplete =
        Math.round(
          ((state.currentPage + 1) /
            state.pageIndexMap.length) * 100
        );
      saveSessionCheckpoint();
      setActiveParagraph();

      chrome.storage.sync.set({
        readingActive: true,
        sessionXp: state.sessionXp,
        wordsReadSoFar: state.wordsReadSoFar,
        currentPageWords: state.currentPageWords,
        percentComplete: state.percentComplete,
      });
    });
   } else {
    state.wordsReadSoFar += state.currentPageWords;

    updateLeveling().then(() => {
      state.percentComplete = 100;
      state.sessionStatus =
        state.percentComplete >= 100
          ? "completed"
          : "in_progress";

      console.log(
        "[SUMMARY] Final session XP:",
        state.sessionXp
      );

      showSummaryPage();
    });
  }
}

export function prevPage() {
  if (state.currentPage > 0) {
    state.lastInteraction = Date.now(); // user interacted
    console.log("[READER] Interaction: prevPage → lastInteraction:", state.lastInteraction);

    state.paragraphSwitches++;
    state.currentPage--;
    saveSessionCheckpoint();
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

// xp helper 
function getRequiredXp(level) {
  return 100 + ((level - 1) * 50);
}

//coin helper 
function getLevelUpCoins(level) {
  if (level <= 5) return 5;
  if (level <= 10) return 10;
  if (level <= 20) return 15;

  // After level 20:
  return 20 + Math.floor((level - 21) / 10) * 2;
}