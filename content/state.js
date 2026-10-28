// Global shared state for the reader system
export const state = {
  allSentences: [],
  pageIndexMap: [],
  currentPage: 0,
  
  // Time tracking
  // Reader timing (used for active reading detection)
  timeStarted: null,
  timeSpentMs: 0,
  lastInteraction: Date.now(),
  idleIntervalId: null,
  autosaveId: null,

  // Session tracking
  sessionStartedAt: null,
  totalSessionTime: 0,
  pausedAt: null,
  isPaused: false,
  totalPausedMs: 0,

  sessionXp: 0,
  coinsAtStart: 0,
  levelAtStart: 1,

  // Reading stats
  articleTitle: "",
  articleUrl: "",
  articleWordCount: 0, // total words in article
  currentPageWords: 0, // words in visible page
  wordsReadSoFar: 0,  // accumulated words read

  percentComplete: 0,

  sessionStatus: "active",

  topicId: null,
  sessionCategory: "Reading",

  sessionTags: [],
  sessionNotes: [],

  // Reader progress
  paragraphSwitches: 0,

  // Track which paragraphs have already given XP
  paragraphXpMap: new Set(),

  // Leveling system
  level: 1,
  xp: 0,
  required: 0,
  coins: 0,
  sessionCoinsGained: 0,
  
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