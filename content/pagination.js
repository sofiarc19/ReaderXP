// pagination.js is the reading progression engine of ReaderXP. It takes the processed 
// sentences and turns them into pages, tracks user progress through those pages, determines 
// when XP should be awarded, calculates reading difficulty, handles leveling, and updates completion progress.

import { state } from "./state.js";
import { renderChunk, updateReaderProgress } from "./readerUI.js";
import { extractSentences } from "./sentenceProcessing.js";
import { showSummaryPage } from "./summary.js";
import { saveSessionCheckpoint } from "./sessions.js";


const MAX_PAGE_CHARS = 850; // need to tweak it still 
const MAX_PAGE_SENTENCES = 6; // no more than 7 or no more than 850/900 char?

// XP multipliers for rereads
const XP_MULTIPLIERS = {
  FIRST_READ: 1,
  SECOND_READ: 0.5,
  REPEAT_READ: 0.25,
};
// state.paragraphCache = new Map();

export function getPageChunkInfo(sentences, startIndex) {
  let chars = 0;
  let count = 0;

  while (startIndex + count < sentences.length) {
    const sentence = sentences[startIndex + count];

    if (!sentence) break;

     // stop if we've reached the sentence cap
    if (count >= MAX_PAGE_SENTENCES) {
      break;
    }

    const nextChars = chars + sentence.length;
    // stop if adding another sentence would exceed page size
    if (count > 0 && nextChars > MAX_PAGE_CHARS) {
      break;
    }

    chars = nextChars;
    count++;
  }

  return { count: Math.max(1, count), chars,};
}

// Page Index Map, Builds an array of starting indexes for each page.
export function buildPageIndexMap() {
  const map = [];
  let index = 0;

  while (index < state.allSentences.length) {
    map.push(index);

    const { count } = getPageChunkInfo(state.allSentences,index);
    index += count;
  }

  return map;
}

//Active Paragraph, Selects the correct chunk of sentences for the current page, 
//renders it, and updates progress.
export function setActivePage() {
  // If no sentences yet, extract from page
  if (state.allSentences.length === 0) {
    state.allSentences = extractSentences();
  }
  state.articleWordCount = state.allSentences.join(" ").split(/\s+/).filter(Boolean).length;
        
  // Build pagination if missing
  if (state.pageIndexMap.length === 0) {
    state.pageIndexMap = buildPageIndexMap();
  }
  
  // Determine the starting index for the current page
  const start = state.pageIndexMap[state.currentPage];
  
  // Calculate how many sentences this page should display
  const { count } = getPageChunkInfo(state.allSentences, start);
  const end = start + count;

  // Slice out the chunk of sentences for this page
  state.currentChunk = state.allSentences.slice(start, end);
  const pageText = state.currentChunk.join(" ");

  state.currentPageWords = pageText.split(/\s+/).filter(Boolean).length;

  state.currentPageChars = pageText.length;
  console.log("[PAGE]", {
    page: state.currentPage + 1,
    chars: state.currentPageChars,
    words: state.currentPageWords,
    sentences: state.currentChunk.length,
  });
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
  console.trace("[LEVEL] updateLeveling called");
  return new Promise((resolve) => {
  const pageId = state.currentPage;
  const sentences = state.currentChunk;

  if (!state.timeStarted) {
    state.timeStarted = Date.now();
    resolve();
    return;
  }

  const timeMs = Date.now() - state.timeStarted;

  // Prevent double XP
  if (state.pageXpmap.has(pageId)) {
    console.log("[LEVEL] No XP: paragraph already rewarded.");
    resolve();
    return;
  }

  // Determine expected reading time
  const { expectedTime, difficulty } = getCachedStats(pageId, sentences);
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

    const sessionCount = existingArticle?.sessionCount || 0;

    const completedArticle =
      existingArticle && ( existingArticle.status === "completed" ||
        existingArticle.percentComplete >= 100
      );

    let xpMultiplier = XP_MULTIPLIERS.FIRST_READ;

    const reads = existingArticle?.sessionCount || 0;

    if (completedArticle) {
      const nextRead = reads + 1;

      if (nextRead >= 3) {
        xpMultiplier = XP_MULTIPLIERS.REPEAT_READ;
      } else if (nextRead >= 2) {
        xpMultiplier = XP_MULTIPLIERS.SECOND_READ;
      }
    }

    // Calculate difficulty-based XP
    const gainedXp = Math.max( 1, Math.round(difficulty * xpMultiplier));

    state.xp += gainedXp;
    state.sessionXp += gainedXp;

    // Mark paragraph as rewarded
    state.pageXpmap.add(pageId);
    state.completedPages.add(pageId);
    updateCompletionProgress();

    // Level up check
    while (state.xp >= getRequiredXp(state.level)) {

      state.xp -= getRequiredXp(state.level);
      const levelReward = getLevelUpCoins(state.level + 1);
      state.level++;

      state.coins += levelReward;
      state.totalCoinsEarned += levelReward;
      state.sessionLevelCoins += levelReward;
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
      "Reread Multiplier:", xpMultiplier,
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
        totalCoinsEarned: state.totalCoinsEarned,
        totalCoinsSpent: state.totalCoinsSpent,
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
      saveSessionCheckpoint();
      setActivePage();

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
      updateCompletionProgress();

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
    setActivePage();
  }
}

// helper functions
// Cached paragraph stats (density, expected time, difficulty)
function getCachedStats(pageId, sentences) {
  if (state.paragraphCache.has(pageId)) {
    return state.paragraphCache.get(pageId);
  }

  // Compute stats
  const { chars, sentenceCount } = getParagraphStats(sentences);

  const expectedTime = getExpectedTimeMs(sentences);
  const difficulty = getParagraphDifficulty(sentences);

  const stats = { chars, sentenceCount, expectedTime, difficulty };

  // Store in cache
  state.paragraphCache.set(pageId, stats);

  return stats;
}

function getParagraphStats(sentences) {
  const chars = sentences.reduce((sum, s) => sum + s.length, 0);
  const sentenceCount = sentences.length;

  return { chars, sentenceCount };
}

// 72 words  -> 10.8s
// 80 words  -> 12.0s
// 100 words -> 15.0s
// 120 words -> 18.0s
// 143 words -> 20.0s
function getExpectedTimeMs(sentences) {
  const text = sentences.join(" ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Focused reading mode
  const minutes = wordCount / 400;
  const rawMs = minutes * 60 * 1000;

  const finalMs = Math.max(3000,
    Math.min(18000, Math.round(rawMs))
  ); //cap at 20secs per page?

  console.log("[READ TIME]", {
    words: wordCount,
    rawMs: Math.round(rawMs),
    finalMs,
  });

  return finalMs;
}

function getParagraphDifficulty(sentences) {
  const { chars } = getParagraphStats(sentences);

  const words = sentences.join(" ").split(/\s+/).filter(Boolean).length;

  let xp = 0;

  xp += words / 50;
  xp += chars / 300;

  xp = Math.max(xp, 3);
  xp = Math.min(xp, 20);

  return Math.round(xp);
}

// xp helper 
function getRequiredXp(level) {
  return 100 + ((level - 1) * 50);
}

// progress helper
function updateCompletionProgress() {
  state.percentComplete = Math.round(
    (state.completedPages.size / state.pageIndexMap.length) * 100
  );
}

//coin helper 
function getLevelUpCoins(level) {
  if (level <= 5) return 5;
  if (level <= 10) return 10;
  if (level <= 20) return 15;

  // After level 20:
  return 20 + Math.floor((level - 21) / 10) * 2;
}