// state.js exports a single shared state object that holds:
// Current article data
// Reading progress
// Session information
// XP and levels
// Coins
// Reader settings
// Pet-related progression data
// Cached paragraph analysis
// UI state

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

  // Session tracking
  sessionStartedAt: null,
  totalSessionTime: 0,
  pausedAt: null,
  isPaused: false,
  totalPausedMs: 0,

  sessionStartPercent: 0,
  sessionXp: 0,
  levelAtStart: 1,

  // Reading stats
  articleTitle: "",
  articleUrl: "",
  articleWordCount: 0, // total words in article
  currentPageWords: 0, // words in visible page
  currentPageChars: 0, // current page character count
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
  pageXpmap: new Set(),
  completedPages: new Set(),

  // Leveling system
  level: 1,
  xp: 0,
  required: 0,

  // Coin system
  coins: 15,                  // current balance + start with 15

  totalCoinsEarned: 0,       // lifetime earned
  totalCoinsSpent: 0,        // lifetime spent

  coinsAtStart: 0,           // balance when session began

  sessionCoinsGained: 0,     // ALL session rewards combined

  sessionLevelCoins: 0,      // from leveling
  sessionReadingCoins: 0,    // from article progress
  
  // The actual slice of sentences being displayed
  currentChunk: [],
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