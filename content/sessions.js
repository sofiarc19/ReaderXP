// Build a reading session object
export function buildReadingSession(state) {
  const coinsEarned =
    (state.coins || 0) -
    (state.coinsAtStart || 0);
  return {
    id: crypto.randomUUID(),

    title: document.title,
    url: window.location.href,

    startedAt: state.sessionStartedAt,
    endedAt: Date.now(),

    totalTimeMs: state.totalSessionTime,

    articleWords: state.articleWordCount || 0,
    wordsRead: state.wordsReadSoFar,

    percentComplete: state.percentComplete,

    xpGained: state.sessionXp || 0,
    totalXp: state.xp,

    coinsGained: coinsEarned,

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
        currentSession.wordsRead =
          (currentSession.wordsRead || 0) +
          (session.wordsRead || 0);
        currentSession.totalTimeMs =
          (currentSession.totalTimeMs || 0) +
          (session.totalTimeMs || 0);
        currentSession.totalXp =
          (currentSession.totalXp || 0) +
          (session.xpGained || 0);
        currentSession.coinsGained =
          (currentSession.coinsGained || 0) +
          (session.coinsGained || 0);
        currentSession.percentComplete = Math.max(
          currentSession.percentComplete || 0,
          session.percentComplete || 0);
        currentSession.sessionCount =
          (currentSession.sessionCount || 1) + 1;
        currentSession.lastReadAt = session.endedAt;
        currentSession.endedAt = session.endedAt;
    } else {
      // Otherwise its a brand new article so we need to add it to the sync storage
      currentSession = session;
       history.unshift(currentSession);
    }
    currentSession.history ??= [];
    currentSession.history.unshift({
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        xpGained: session.xpGained,
        coinsGained: session.coinsGained,
        wordsRead: session.wordsRead,
        totalTimeMs: session.totalTimeMs,
        percentComplete: session.percentComplete,
      })

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

// Load topics (used by popup or summary page)
export function loadTopics(callback) {
  chrome.storage.sync.get(["readingTopics"], (data) => {
    callback(data.readingTopics || []);
  });
}

export function createTopic(title) {
  chrome.storage.sync.get(["readingTopics"], (data) => {
    const topics = data.readingTopics || [];

    topics.push({
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
      readingTopics: topics,
    });
  });
}

export function addReadingToTopic(topicId, reading) {
  chrome.storage.sync.get(["readingTopics"], (data) => {
    const topics = data.readingTopics || [];

    const topic = topics.find((t) => t.id === topicId);
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
      readingTopics: topics,
    });
  });
}