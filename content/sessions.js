// Build a reading session object
export function buildReadingSession(state) {
  return {
    id: crypto.randomUUID(),

    title: document.title,
    url: window.location.href,

    startedAt: state.sessionStartedAt,
    endedAt: Date.now(),

    totalTimeMs: state.totalSessionTime,

    articleWords: state.totalWordsRead,
    wordsRead: state.wordsReadSoFar,

    percentComplete: state.percentComplete,
    status: state.sessionStatus || "completed",

    xpGained: state.sessionXp,

    levelAtStart: state.levelAtStart,
    levelAtEnd: state.level,

    paragraphsRead: state.paragraphSwitches,

    topicId: null,
    topicId: null, topicName: state.sessionCategory || null,

    tags: [...state.sessionTags],

    notes: [...state.sessionNotes],
  };
}

// Save a reading session to history
export function saveReadingSession(session) {
  chrome.storage.sync.get(["history"], (data) => {
    const history = data.history || [];

    const MAX_HISTORY = 100;

    history.unshift(session);

    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }

    chrome.storage.sync.set({ history }, () => {
      console.log(
        "[SESSIONS] Saved reading session:",
        session
      );
    });
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

    topic.readings.push(reading);

    topic.totalXp =
    topic.readings.reduce(
      (sum, r) => sum + (r.xpGained || 0),0);

  topic.totalWords =
    topic.readings.reduce(
      (sum, r) => sum + (r.wordsRead || 0),0);

  topic.totalTimeMs =
    topic.readings.reduce(
      (sum, r) => sum + (r.totalTimeMs || 0),0);

    chrome.storage.sync.set({
      readingTopics: topics,
    });
  });
}