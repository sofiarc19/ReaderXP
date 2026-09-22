// Global shared state for the reader system
export const state = {
  allSentences: [],
  pageIndexMap: [],
  currentPage: 0,
  
  // Time tracking
  timeStarted: null,
  timeSpentMs: 0,
  lastInteraction: Date.now(),

  // Reader progress
  paragraphSwitches: 0,

  // Track which paragraphs have already given XP
  paragraphXpMap: new Set(),

  // Leveling system
  level: 1,
  xp: 0,

  // The actual slice of sentences being displayed
  currentChunk: null,
  // Index of the first sentence in the current chunk
  activeElement: null,

  // cacheing prevents recalculating density and difficulty every time the user switches pages.
  paragraphCache: new Map(),

  readerSettings: {
    font: "sans-serif",
    fontSize: "16px",
    bionic: false,
    theme: "theme-dark"
  }
};