import { state } from "./state";
// Build a reading session object
export function buildReadingSession(state) {
  return {
    id: crypto.randomUUID(),

    title: document.title,
    url: window.location.href,

    startedAt: state.sessionStartedAt,
    endedAt: Date.now(),

    totalTimeMs: state.totalSessionTime,

    articleWords: state.articleWordCount || 0,
    wordsRead: state.wordsReadSoFar,

    currentPage: state.currentPage,
    percentComplete: state.percentComplete,

    xpGained: state.sessionXp || 0,
    totalXp: state.xp,

    coinsGained: state.sessionCoinsGained,
    coinBreakdown: {
      readingCoins:
        state.sessionReadingCoins,

      levelCoins:
        state.sessionLevelCoins,

      totalCoins:
        state.sessionCoinsGained
    },
    coinsAtStart: state.coinsAtStart,
    coinsAtEnd: state.coins,

    levelAtStart: state.levelAtStart,
    levelAtEnd: state.level,

    paragraphsRead: state.paragraphSwitches,

    status: state.sessionStatus || "completed",
    sessionCount: 1,

    topicId: state.topicId || null,
    topicName: state.sessionCategory || null,

    tags: [...(state.sessionTags || [])],
    notes: [...(state.sessionNotes || [])],

    history: [],
    createdAt: Date.now(),
    lastReadAt: Date.now(),
  };
}

// Save a reading session to history
export function saveReadingSession(session) {
  chrome.storage.sync.get(["history"], (data) => {
    const history = data.history || [];

    const MAX_HISTORY = 100;

    console.log("session: ", session, session.url);
    const existingIndex = history.findIndex(
      item => item.url === session.url
    );
    console.log("matches: ", existingIndex);
    let currentSession;
    if (existingIndex !== -1){
      // If there is already an entry for this article grab it add this to start reader as well 
      currentSession = history.splice(existingIndex, 1)[0];
      history.unshift(currentSession);
      // overwrite value if checkpoint
      if (session.isCheckpoint) {
        currentSession.wordsRead =
          session.wordsRead;
        currentSession.totalTimeMs =
          session.totalTimeMs;
        currentSession.totalXp =
          session.totalXp;
        currentSession.coinsGained =
          session.coinsGained;
        currentSession.percentComplete =
          session.percentComplete;
        currentSession.currentPage =
          session.currentPage;
        currentSession.lastReadAt =
          session.endedAt;
        currentSession.endedAt =
          session.endedAt;
        currentSession.status =
          session.status;
      } else {
        // accumulate completed-session values
        currentSession.wordsRead =
          (currentSession.wordsRead || 0) +
          (session.wordsRead || 0);
        currentSession.totalTimeMs =
          (currentSession.totalTimeMs || 0) +
          (session.totalTimeMs || 0);
        currentSession.totalXp =
          session.totalXp;
        currentSession.coinsGained =
          (currentSession.coinsGained || 0) +
          (session.coinsGained || 0);
        currentSession.percentComplete = Math.max(
          currentSession.percentComplete || 0,
          session.percentComplete || 0);
        currentSession.currentPage = session.currentPage;
        currentSession.sessionCount =
          (currentSession.sessionCount || 0) + 1;
        currentSession.lastReadAt = session.endedAt;
        currentSession.endedAt = session.endedAt;
        currentSession.status = session.status;
      }
    } else {
      // Otherwise its a brand new article so we need to add it to the sync storage
      currentSession = session;
       history.unshift(currentSession);
    }
    if (!session.isCheckpoint) {
      currentSession.history ??= [];
      currentSession.history.unshift({
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          xpGained: session.xpGained,
          coinsGained: session.coinsGained,
          wordsRead: session.wordsRead,
          totalTimeMs: session.totalTimeMs,
          percentComplete: session.percentComplete,
          currentPage: session.currentPage,
        })
    }

    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }

    chrome.storage.sync.set({ history }, () => {
      console.log(
        "[SESSIONS] Saved reading session:",
        currentSession
      );
    });
  });
}

// History sessions loader 
export function loadHistory(callback) {
  chrome.storage.sync.get(["history"], (data) => {
    callback(data.history || []);
  });
}

// Load sessions (used by popup or summary page)
export function loadsessions(callback) {
  chrome.storage.sync.get(["readingsessions"], (data) => {
    callback(data.readingsessions || []);
  });
}

// Coin helper: based on words read /500
// based on progress and amount of words
export function getSessionCoinReward() {
  // const progressMade =
  //   Math.max(0, state.percentComplete - state.sessionStartPercent);

  // const progressReward = Math.floor(progressMade / 10);

  // const effortReward = Math.floor(state.wordsReadSoFar / 1000);

  // let coins = progressReward + effortReward;
  let coins =
    Math.floor(
      state.wordsReadSoFar / 500
    );

  if (state.percentComplete >= 100) {
    coins += 5;
  }

  return Math.max(1, coins);
}

export function createTopic(title) {
  chrome.storage.sync.get(["readingsessions"], (data) => {
    const sessions = data.readingsessions || [];

    sessions.push({
      id: crypto.randomUUID(),
      name: title,

      readings: [],
      notes: [],

      totalXp: 0,
      totalWords: 0,
      totalTimeMs: 0,

      createdAt: Date.now(),
    });

    chrome.storage.sync.set({
      readingsessions: sessions,
    });
  });
}

export function addReadingToTopic(topicId, reading) {
  chrome.storage.sync.get(["readingsessions"], (data) => {
    const sessions = data.readingsessions || [];

    const topic = sessions.find((t) => t.id === topicId);
    if (!topic) return;

    topic.readings ??= [];

    const existingReading = topic.readings.find(
      (r) => r.url === reading.url
    );

    if (existingReading) {
      existingReading.wordsRead =
        (existingReading.wordsRead || 0) +
        (reading.wordsRead || 0);

      existingReading.totalTimeMs =
        (existingReading.totalTimeMs || 0) +
        (reading.totalTimeMs || 0);

      existingReading.xpGained =
        (existingReading.xpGained || 0) +
        (reading.xpGained || 0);

      existingReading.coinBreakdown ??= {
        readingCoins: 0,
        levelCoins: 0,
      };

      existingReading.coinBreakdown.readingCoins +=
        reading.coinBreakdown?.readingCoins || 0;

      existingReading.coinBreakdown.levelCoins +=
        reading.coinBreakdown?.levelCoins || 0;

      existingReading.percentComplete = Math.max(
        existingReading.percentComplete || 0,
        reading.percentComplete || 0
      );
      existingReading.sessionCount =
        (existingReading.sessionCount || 1) + 1;
      existingReading.lastReadAt =
        reading.endedAt || Date.now();
    } else {
      topic.readings.push(reading);
    }

    topic.totalXp = topic.readings.reduce(
      (sum, r) => sum + (r.xpGained || 0), 0);
    topic.totalWords = topic.readings.reduce(
      (sum, r) => sum + (r.wordsRead || 0), 0);
    topic.totalTimeMs = topic.readings.reduce(
      (sum, r) => sum + (r.totalTimeMs || 0), 0);
    topic.lastReadAt = Date.now();

    chrome.storage.sync.set({
      readingsessions: sessions,
    });
  });
}

// Session save on reload helper
export function saveSessionCheckpoint() {
  if (!state.sessionStartedAt) return;
  if (!state.pageIndexMap.length) return;

  const sessionEnd =
    state.isPaused && state.pausedAt
      ? state.pausedAt
      : Date.now();

  state.totalSessionTime =
    sessionEnd
    - state.sessionStartedAt
    - state.totalPausedMs;

  const session = buildReadingSession(state);
  session.isCheckpoint = true;
  session.coinsGained = 0;

  session.status =
    state.percentComplete >= 100
      ? "completed"
      : "in_progress";

  saveReadingSession(session);

  console.log(
    "[CHECKPOINT]",
    "Page:",
    session.currentPage + 1,
    "Progress:",
    session.percentComplete + "%"
  );
}