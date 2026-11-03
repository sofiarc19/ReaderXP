(() => {
  // content/textExtraction.js
  function extractAllText(excludedIds = [], excludedClasses = []) {
    const commonExcluded = [
      "header",
      "nav",
      "footer",
      "aside",
      "#extension-box",
      "#reader-area-bar",
      ".sidebar",
      ".menu",
      ".toolbar",
      ".ruler",
      ".infobox",
      ".metadata",
      ".reference",
      ".navbox",
      ".subscription",
      ".login",
      ".advertisement",
      ".promo",
      ".related",
      ".share",
      ".toc",
      ".mw-jump-link"
    ];
    const allExcluded = [
      ...excludedIds.map((id) => `#${CSS.escape(id)}`),
      ...excludedClasses.map((cls) => `.${CSS.escape(cls)}`),
      ...commonExcluded
    ];
    const roots = document.querySelectorAll(
      "article, main, #content, .content, .mw-parser-output, .post, .entry-content, .document-content"
    );
    const walkerRoots = roots.length ? roots : [document.body];
    let text = "";
    for (const root of walkerRoots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node2) {
          const t = node2.textContent.trim();
          if (!t) return NodeFilter.FILTER_REJECT;
          const p = node2.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          for (const sel of allExcluded) {
            if (p.closest(sel)) return NodeFilter.FILTER_REJECT;
          }
          if (p.closest("figcaption, caption, table, th, td"))
            return NodeFilter.FILTER_REJECT;
          if (p.hasAttribute("aria-label") || p.hasAttribute("alt"))
            return NodeFilter.FILTER_REJECT;
          if (p.closest("a")) {
            if (/^\[\w+\]$/.test(t)) return NodeFilter.FILTER_REJECT;
            if (/°/.test(t)) return NodeFilter.FILTER_REJECT;
            if (/^\/.*\/$/.test(t)) return NodeFilter.FILTER_REJECT;
            if (t.length < 3) return NodeFilter.FILTER_REJECT;
          }
          const style = window.getComputedStyle(p);
          if (style.display === "none" || style.visibility === "hidden")
            return NodeFilter.FILTER_REJECT;
          const tag = p.tagName.toLowerCase();
          if (["script", "style", "noscript", "svg", "math", "meta", "link"].includes(tag))
            return NodeFilter.FILTER_REJECT;
          if (t.length < 10) return NodeFilter.FILTER_REJECT;
          if (/^(Create your free account|Subscribe|Login|Register|Share|Download|Jump to|Navigation|From Wikipedia|Contents|Tools|Languages)/i.test(t))
            return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let node;
      while (node = walker.nextNode()) {
        text += " " + node.textContent;
      }
    }
    if (location.hostname.includes("gutenberg.org")) {
      const start = text.match(/START OF THE PROJECT GUTENBERG EBOOK/i);
      if (start) text = text.slice(start.index + start[0].length);
      text = text.replace(/END OF THE PROJECT GUTENBERG EBOOK[\s\S]+$/i, "");
      text = text.replace(/Project Gutenberg License[\s\S]+?www\.gutenberg\.org/gi, "");
    }
    if (location.hostname.includes("wikipedia.org")) {
      text = text.replace(/^From Wikipedia, the free encyclopedia/i, "");
      text = text.replace(/^\s*This article is about[\s\S]+?(?=\b[A-Z])/i, "");
      text = text.replace(/\b\(born\b.*?\)|\b\(died\b.*?\)/gi, "");
      text = text.replace(/References[\s\S]+$/i, "");
      text = text.replace(/External links[\s\S]+$/i, "");
      text = text.replace(/See also[\s\S]+$/i, "");
    }
    text = text.replace(/\s*,\s*,/g, ",");
    text = text.replace(/\s{2,}/g, " ");
    return text.trim();
  }

  // content/sentenceProcessing.js
  function splitMixedFragments(text) {
    return text.replace(/([A-Z][^.!?]+:[^.!?]+)(?=\s+[A-Z])/g, "$1.");
  }
  function stitchFragments(sentences) {
    const stitched = [];
    let buffer = "";
    for (let s of sentences) {
      const trimmed = s.trim();
      const isFragment = trimmed.length < 40 || // short
      /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$/.test(trimmed) || // proper nouns
      /^[A-Za-z0-9\-]+$/.test(trimmed) || // single-word fragments
      !/[.!?]$/.test(trimmed);
      if (isFragment) {
        buffer += " " + trimmed;
      } else {
        buffer += " " + trimmed;
        stitched.push(buffer.trim());
        buffer = "";
      }
    }
    if (buffer.trim().length > 0) {
      stitched.push(buffer.trim());
    }
    return stitched;
  }
  function scoreSentence(sentence) {
    const words = sentence.split(/\s+/);
    const wordCount = words.length;
    const letters = (sentence.match(/[a-zA-Z]/g) || []).length;
    const punctuation = (sentence.match(/[,:;—–-]/g) || []).length;
    const stopWords = [
      "the",
      "and",
      "is",
      "in",
      "of",
      "to",
      "for",
      "that",
      "with",
      "on",
      "as",
      "at",
      "by",
      "from",
      "it",
      "this",
      "was",
      "are",
      "be",
      "an",
      "or",
      "but",
      "not",
      "which",
      "their",
      "his",
      "her"
    ];
    const stopCount = words.filter((w) => stopWords.includes(w.toLowerCase())).length;
    const alphabeticRatio = letters / sentence.length;
    const stopRatio = stopCount / wordCount;
    const wordScore = Math.min(1, wordCount / 20);
    const alphaScore = Math.min(1, alphabeticRatio / 0.5);
    const punctScore = Math.min(1, punctuation / 2);
    const stopScore = Math.min(1, stopRatio / 0.25);
    const confidence = 0.35 * wordScore + 0.3 * alphaScore + 0.2 * punctScore + 0.15 * stopScore;
    return confidence;
  }
  function isAdSentence(s) {
    const text = s.trim();
    if (/^(Subscribe|Sign up|Create your free account|Add|Skip to Content|Log in|Register|Join|Get started)/i.test(text))
      return true;
    if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)+.*:/.test(text) && !/\b(says|said|tells|reports|writes|posted|shared|announced|revealed)\b/i.test(text))
      return true;
    const marketingWords = /\b(Guide|Deal|Exclusive|Sale|Discount|Offer|Sponsored|Advertorial|Promotion)\b/i;
    const hasVerb = /\b(is|are|was|were|be|have|has|had|says|said|made|make|share|shared|shows|showed|posted|sparked|tells|reports|writes|announced|revealed|launched|created|produced)\b/i.test(text);
    if (marketingWords.test(text) && !hasVerb)
      return true;
    if (/[A-Z]{3,}/.test(text) && !hasVerb)
      return true;
    return false;
  }
  function filterSentencesDynamically(scoredSentences) {
    const STRICT_THRESHOLD = 0.5;
    const NORMAL_THRESHOLD = 0.35;
    const domain = location.hostname;
    const isWikiLike = /(wikipedia|wikimedia|wiktionary|britannica|encyclopedia)/i.test(domain);
    let anchorFound = false;
    let consecutiveGood = 0;
    const result = [];
    const rejected = [];
    for (const s of scoredSentences) {
      const text = s.text.trim();
      const hasVerb = /\b(is|are|was|were|be|have|has|had|says|said|made|make|share|shared|shows|showed|collided|crashed|killed|injured|posted|sparked|tells|reports|writes)\b/i.test(text);
      const endsProperly = /[.!?]$/.test(text);
      if (!anchorFound) {
        if (!isWikiLike && isAdSentence(text)) {
          const split = text.split(/(?<=\.)\s+/);
          const realPart = split.find(
            (t) => /\b(is|are|was|were|be|have|has|had|says|said|posted|shared|reports|writes)\b/i.test(t)
          );
          if (realPart) {
            result.push(realPart.trim());
            rejected.push({ reason: "partial ad-like (recovered real part)", text });
            continue;
          }
          rejected.push({ reason: "ad-like (pre-anchor)", text });
          continue;
        }
        if (s.score >= STRICT_THRESHOLD || hasVerb && endsProperly) {
          consecutiveGood++;
          if (consecutiveGood >= 2) {
            anchorFound = true;
            console.log("Anchor found: true after", consecutiveGood, "good sentences");
          }
          result.push(text);
        } else {
          rejected.push({ reason: `low score (${s.score.toFixed(2)}) pre-anchor`, text });
        }
      } else {
        if (s.score >= NORMAL_THRESHOLD) {
          result.push(text);
        } else {
          rejected.push({ reason: `low score (${s.score.toFixed(2)}) post-anchor`, text });
        }
      }
    }
    console.group("Sentence Filtering Debug");
    console.log("Accepted sentences:", result.length);
    console.log("Rejected sentences:", rejected.length);
    rejected.forEach((r) => console.log(`\u274C ${r.reason}: ${r.text}`));
    console.groupEnd();
    return result;
  }
  function extractSentences() {
    const raw = extractAllText();
    const cleaned = splitMixedFragments(raw);
    const rawSentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
    const stitched = stitchFragments(rawSentences);
    const scored = stitched.map((s) => ({ text: s, score: scoreSentence(s) }));
    return filterSentencesDynamically(scored);
  }
  function extractSentencesFromText(text) {
    const cleaned = splitMixedFragments(text);
    const rawSentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
    const stitched = stitchFragments(rawSentences);
    return stitched.map((s) => s.trim());
  }

  // content/state.js
  var state = {
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
    sessionStartPercent: 0,
    sessionXp: 0,
    levelAtStart: 1,
    // Reading stats
    articleTitle: "",
    articleUrl: "",
    articleWordCount: 0,
    // total words in article
    currentPageWords: 0,
    // words in visible page
    wordsReadSoFar: 0,
    // accumulated words read
    percentComplete: 0,
    sessionStatus: "active",
    topicId: null,
    sessionCategory: "Reading",
    sessionTags: [],
    sessionNotes: [],
    // Reader progress
    paragraphSwitches: 0,
    // Track which paragraphs have already given XP
    paragraphXpMap: /* @__PURE__ */ new Set(),
    // Leveling system
    level: 1,
    xp: 0,
    required: 0,
    // Coin system
    coins: 0,
    // current balance
    totalCoinsEarned: 0,
    // lifetime earned
    totalCoinsSpent: 0,
    // lifetime spent
    coinsAtStart: 0,
    // balance when session began
    sessionCoinsGained: 0,
    // ALL session rewards combined
    sessionLevelCoins: 0,
    // from leveling
    sessionReadingCoins: 0,
    // from article progress
    // The actual slice of sentences being displayed
    currentChunk: null,
    // Index of the first sentence in the current chunk
    activeElement: null,
    // cacheing prevents recalculating density and difficulty every time the user switches pages.
    paragraphCache: /* @__PURE__ */ new Map(),
    readerSettings: {
      font: "sans-serif",
      fontSize: "16px",
      bionic: false,
      theme: "theme-dark"
    }
  };

  // content/sessions.js
  function buildReadingSession(state2) {
    return {
      id: crypto.randomUUID(),
      title: document.title,
      url: window.location.href,
      startedAt: state2.sessionStartedAt,
      endedAt: Date.now(),
      totalTimeMs: state2.totalSessionTime,
      articleWords: state2.articleWordCount || 0,
      wordsRead: state2.wordsReadSoFar,
      currentPage: state2.currentPage,
      percentComplete: state2.percentComplete,
      xpGained: state2.sessionXp || 0,
      totalXp: state2.xp,
      coinsGained: state2.sessionCoinsGained,
      coinBreakdown: {
        readingCoins: state2.sessionReadingCoins,
        levelCoins: state2.sessionLevelCoins,
        totalCoins: state2.sessionCoinsGained
      },
      coinsAtStart: state2.coinsAtStart,
      coinsAtEnd: state2.coins,
      levelAtStart: state2.levelAtStart,
      levelAtEnd: state2.level,
      paragraphsRead: state2.paragraphSwitches,
      status: state2.sessionStatus || "completed",
      sessionCount: 1,
      topicId: state2.topicId || null,
      topicName: state2.sessionCategory || null,
      tags: [...state2.sessionTags || []],
      notes: [...state2.sessionNotes || []],
      history: [],
      createdAt: Date.now(),
      lastReadAt: Date.now()
    };
  }
  function saveReadingSession(session) {
    chrome.storage.sync.get(["history"], (data) => {
      const history = data.history || [];
      const MAX_HISTORY = 100;
      console.log("session: ", session, session.url);
      const existingIndex = history.findIndex(
        (item) => item.url === session.url
      );
      console.log("matches: ", existingIndex);
      let currentSession;
      if (existingIndex !== -1) {
        currentSession = history.splice(existingIndex, 1)[0];
        history.unshift(currentSession);
        if (session.isCheckpoint) {
          currentSession.wordsRead = session.wordsRead;
          currentSession.totalTimeMs = session.totalTimeMs;
          currentSession.totalXp = session.totalXp;
          currentSession.coinsGained = session.coinsGained;
          currentSession.percentComplete = session.percentComplete;
          currentSession.currentPage = session.currentPage;
          currentSession.lastReadAt = session.endedAt;
          currentSession.endedAt = session.endedAt;
          currentSession.status = session.status;
        } else {
          currentSession.wordsRead = (currentSession.wordsRead || 0) + (session.wordsRead || 0);
          currentSession.totalTimeMs = (currentSession.totalTimeMs || 0) + (session.totalTimeMs || 0);
          currentSession.totalXp = session.totalXp;
          currentSession.coinsGained = (currentSession.coinsGained || 0) + (session.coinsGained || 0);
          currentSession.percentComplete = Math.max(
            currentSession.percentComplete || 0,
            session.percentComplete || 0
          );
          currentSession.currentPage = session.currentPage;
          currentSession.sessionCount = (currentSession.sessionCount || 0) + 1;
          currentSession.lastReadAt = session.endedAt;
          currentSession.endedAt = session.endedAt;
          currentSession.status = session.status;
        }
      } else {
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
          currentPage: session.currentPage
        });
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
  function getSessionCoinReward() {
    let coins = Math.floor(
      state.wordsReadSoFar / 500
    );
    if (state.percentComplete >= 100) {
      coins += 5;
    }
    return Math.max(1, coins);
  }
  function saveSessionCheckpoint() {
    if (!state.sessionStartedAt) return;
    if (!state.pageIndexMap.length) return;
    const sessionEnd = state.isPaused && state.pausedAt ? state.pausedAt : Date.now();
    state.totalSessionTime = sessionEnd - state.sessionStartedAt - state.totalPausedMs;
    const session = buildReadingSession(state);
    session.isCheckpoint = true;
    session.coinsGained = 0;
    session.status = state.percentComplete >= 100 ? "completed" : "in_progress";
    saveReadingSession(session);
    console.log(
      "[CHECKPOINT]",
      "Page:",
      session.currentPage + 1,
      "Progress:",
      session.percentComplete + "%"
    );
  }

  // popup/pet.js
  var DEFAULT_PET = {
    name: "Pet name",
    hunger: 100,
    mood: 100,
    hygiene: 100,
    social: 100,
    energy: 100,
    activity: null,
    activityChangedAt: null,
    currentMood: null,
    dailyCareUses: 3,
    lastCareReset: Date.now(),
    dailyReadingRewards: 0,
    lastReadingReset: Date.now(),
    lastUpdated: Date.now(),
    //evolutionStage: 1,
    inventory: []
  };
  function loadPet(callback) {
    chrome.storage.sync.get(["pet"], (data) => {
      const pet = { ...DEFAULT_PET, ...data.pet || {} };
      if (pet.dailyCareUses === void 0) {
        pet.dailyCareUses = 3;
      }
      if (!pet.lastCareReset) {
        pet.lastCareReset = Date.now();
      }
      resetDailyCare(pet);
      resetDailyRewards(pet);
      updatePetDecay(pet);
      savePet(pet);
      callback(pet);
    });
  }
  function savePet(pet) {
    chrome.storage.sync.set({ pet });
  }
  function updatePetDecay(pet) {
    const now = Date.now();
    const hoursPassed = (now - pet.lastUpdated) / (1e3 * 60 * 60);
    pet.hunger = Math.max(0, pet.hunger - hoursPassed * 2.5);
    pet.energy = Math.max(0, pet.energy - hoursPassed * 1.5);
    pet.social = Math.max(0, pet.social - hoursPassed * 1);
    pet.hygiene = Math.max(0, pet.hygiene - hoursPassed * 0.75);
    let moodDecay = hoursPassed * 0.5;
    if (pet.hunger < 25) moodDecay += hoursPassed * 2;
    if (pet.energy < 25) moodDecay += hoursPassed * 1.5;
    if (pet.social < 25) moodDecay += hoursPassed * 1;
    if (pet.hygiene < 25) moodDecay += hoursPassed * 1;
    pet.mood = Math.max(0, pet.mood - moodDecay);
    pet.lastUpdated = now;
  }
  var MAX_DAILY_READING_REWARDS = 10;
  function rewardPetForReading(pet) {
    if (pet.dailyReadingRewards >= MAX_DAILY_READING_REWARDS) {
      return false;
    }
    pet.mood = Math.min(100, pet.mood + 1);
    pet.social = Math.min(100, pet.social + 1);
    pet.dailyReadingRewards++;
    return true;
  }
  function resetDailyRewards(pet) {
    const now = Date.now();
    const lastReset = new Date(pet.lastReadingReset || now);
    const today = new Date(now);
    if (lastReset.toDateString() !== today.toDateString()) {
      pet.dailyReadingRewards = 0;
      pet.lastReadingReset = now;
    }
  }
  function resetDailyCare(pet) {
    const now = Date.now();
    const lastReset = new Date(pet.lastCareReset || now);
    const today = new Date(now);
    const isNewDay = lastReset.toDateString() !== today.toDateString();
    if (isNewDay) {
      pet.dailyCareUses = 3;
      pet.lastCareReset = now;
    }
  }
  function getMoodCoinMultiplier(pet) {
    if (pet.mood >= 80) {
      return 1.2;
    }
    if (pet.mood >= 50) {
      return 1;
    }
    if (pet.mood >= 25) {
      return 0.9;
    }
    return 0.8;
  }
  window.inspectSprite = (file, frames) => {
    const img = new Image();
    img.src = `assets/cat/${file}`;
    img.onload = () => {
      const frameWidth = img.width / frames;
      const scale = 96 / img.height;
      console.log({
        imageWidth: img.width,
        imageHeight: img.height,
        frames,
        originalFrameWidth: frameWidth,
        scaledFrameWidth: frameWidth * scale
      });
    };
  };

  // content/blur.js
  var blurEnabled = false;
  function toggleBlur() {
    blurEnabled = !blurEnabled;
    if (blurEnabled) {
      document.body.classList.add("fr-blur-all");
    } else {
      document.body.classList.remove("fr-blur-all");
      const bar = document.getElementById("reader-area-bar");
      if (bar) bar.remove();
    }
  }
  function startObserver() {
    function attachObserver() {
      if (!document.body) {
        setTimeout(attachObserver, 50);
        return;
      }
      let scheduled = false;
      const observer = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        setTimeout(() => {
          scheduled = false;
        }, 100);
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    attachObserver();
  }

  // content/summary.js
  function showSummaryPage() {
    console.log(
      "[SUMMARY] sessionXp at summary:",
      state.sessionXp
    );
    chrome.storage.sync.set({
      readingActive: false,
      isPaused: false,
      sessionXp: state.sessionXp,
      wordsReadSoFar: state.wordsReadSoFar,
      percentComplete: state.percentComplete
    });
    state.isPaused = false;
    state.pausedAt = null;
    state.totalSessionTime = Date.now() - state.sessionStartedAt - state.totalPausedMs;
    if (state.idleIntervalId) {
      clearInterval(state.idleIntervalId);
      state.idleIntervalId = null;
    }
    if (state.autosaveId) {
      clearInterval(state.autosaveId);
      state.autosaveId = null;
    }
    loadPet((pet) => {
      const sessionCoins = getSessionCoinReward(
        state.percentComplete
      );
      const multiplier = getMoodCoinMultiplier(pet);
      const finalCoins = Math.max(
        1,
        Math.round(
          sessionCoins * multiplier
        )
      );
      state.sessionReadingCoins = finalCoins;
      state.sessionCoinsGained += finalCoins;
      state.coins += finalCoins;
      state.totalCoinsEarned += finalCoins;
      chrome.storage.sync.set({
        coins: state.coins,
        totalCoinsEarned: state.totalCoinsEarned,
        sessionXp: state.sessionXp
      });
      rewardPetForReading(pet, { xpGained: state.sessionXp });
      savePet(pet);
      console.log(
        "[COINS]",
        {
          percentComplete: state.percentComplete,
          baseCoins: sessionCoins,
          mood: pet.mood,
          multiplier,
          finalCoins
        }
      );
      const session = buildReadingSession(state);
      saveReadingSession(session);
      const totalSeconds = Math.floor(session.totalTimeMs / 1e3);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor(totalSeconds % 3600 / 60);
      const seconds = totalSeconds % 60;
      const formattedTime = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
      document.getElementById("reader-page")?.classList.add("hidden");
      document.getElementById("reader-paused")?.classList.add("hidden");
      document.getElementById("reader-summary")?.classList.remove("hidden");
      document.getElementById("summary-content").innerHTML = `
    
      <div class="summary-header">
        <h1>Reading Summary</h1>
        <p>Your session has been saved.</p>
      </div>

      <div class="summary-stats">

        <div class="summary-stat">
          <span>Title</span>
          <strong>${session.title}</strong>
        </div>

        <div class="summary-stat">
          <span>Session Stats</span>

          <div class="summary-inline">
            <strong>+${session.xpGained} XP |</strong>
            <strong>Level: ${state.level} |</strong>
            <strong>Current XP: ${state.xp} / ${state.required}</strong>
          </div>
        </div>

        <div class="summary-stat">
          <span>Coin Rewards</span>
          <div class="summary-inline">
            <strong>Reading: ${state.sessionReadingCoins} +</strong>
            <strong>Level: ${state.sessionLevelCoins} =</strong>
            <strong>Total Coins gained: +${session.coinsGained}</strong>
          </div>
        </div>

        <div class="summary-stat">
        <span>Reading Stats:</span>
          <div class="summary-inline">
            <strong>Words Read: ${session.wordsRead} |</strong>
          <strong>Time Reading: ${formattedTime}</strong>
          </div>
        </div>

        <div class="summary-stat">
          <span>Progress</span>
          <strong>${(session.percentComplete || 0).toFixed(1)}%</strong>
        </div>

      </div>

      <div class="summary-actions">

        <button id="summary-pet-shop">
          Go To Pet Shop
        </button>

        <button id="summary-close-btn">
          Close
        </button>

      </div>

      <div id="summary-topic-picker" class="hidden"></div>
    `;
      document.getElementById("summary-close-btn")?.addEventListener("click", () => {
        chrome.storage.sync.set({
          readingActive: false
        });
        toggleBlur();
        document.getElementById("reader-area-bar")?.remove();
      });
      document.getElementById("summary-pet-shop")?.addEventListener("click", () => {
        toggleBlur();
        document.getElementById("reader-area-bar")?.remove();
        console.log(
          "[SUMMARY] Open pet shop later"
        );
      });
    });
  }
  function showPausedPage() {
    document.getElementById("reader-page")?.classList.add("hidden");
    document.getElementById("reader-summary")?.classList.add("hidden");
    document.getElementById("reader-paused")?.classList.remove("hidden");
    const resumeBtn = document.getElementById(
      "paused-resume-btn"
    );
    if (resumeBtn) {
      resumeBtn.onclick = () => {
        if (state.pausedAt) {
          const pausedDuration = Date.now() - state.pausedAt;
          state.totalPausedMs += pausedDuration;
        }
        state.pausedAt = null;
        state.isPaused = false;
        chrome.storage.sync.set({
          isPaused: false,
          totalPausedMs: state.totalPausedMs,
          readingActive: true
        });
        resumeReadingPage();
      };
    }
    document.getElementById("paused-finish-btn")?.addEventListener("click", () => {
      updateLeveling().then(() => {
        state.sessionStatus = state.percentComplete >= 100 ? "completed" : "in_progress";
        chrome.storage.sync.set({
          readingActive: false
        });
        showSummaryPage();
        state.isPaused = false;
        state.pausedAt = null;
      });
    });
  }
  function resumeReadingPage() {
    document.getElementById("reader-paused")?.classList.add("hidden");
    document.getElementById("reader-page")?.classList.remove("hidden");
  }

  // content/pagination.js
  var SHORT_THRESHOLD = 300;
  var LONG_THRESHOLD = 700;
  var XP_MULTIPLIERS = {
    FIRST_READ: 1,
    SECOND_READ: 0.5,
    REPEAT_READ: 0.25
  };
  function getDynamicSentenceCount(sentences, startIndex) {
    const BASE = 9;
    const MIN = 1;
    const MAX = 15;
    let count = BASE;
    let totalChars = 0;
    for (let i = 0; i < BASE; i++) {
      const s = sentences[startIndex + i];
      if (!s) break;
      totalChars += s.length;
    }
    if (totalChars < SHORT_THRESHOLD) {
      count = Math.min(MAX, BASE + 2);
    } else if (totalChars > LONG_THRESHOLD) {
      count = Math.max(MIN, BASE - 2);
    }
    return count;
  }
  function buildPageIndexMap() {
    const map = [];
    let index = 0;
    while (index < state.allSentences.length) {
      map.push(index);
      const count = getDynamicSentenceCount(state.allSentences, index);
      index += count;
    }
    return map;
  }
  function setActiveParagraph() {
    if (state.allSentences.length === 0) {
      state.allSentences = extractSentences();
    }
    state.articleWordCount = state.allSentences.join(" ").split(/\s+/).filter(Boolean).length;
    if (state.pageIndexMap.length === 0) {
      state.pageIndexMap = buildPageIndexMap();
    }
    const start = state.pageIndexMap[state.currentPage];
    const count = getDynamicSentenceCount(state.allSentences, start);
    const end = start + count;
    state.currentChunk = state.allSentences.slice(start, end);
    state.currentPageWords = state.currentChunk.join(" ").split(/\s+/).filter(Boolean).length;
    renderChunk(state.currentChunk);
    updateReaderProgress();
    state.activeElement = start;
  }
  function updateLeveling() {
    return new Promise((resolve) => {
      const paragraphId = state.currentPage;
      const sentences = state.currentChunk;
      if (!state.timeStarted) {
        state.timeStarted = Date.now();
        resolve();
        return;
      }
      const timeMs = Date.now() - state.timeStarted;
      if (state.paragraphXpMap.has(paragraphId)) {
        console.log("[LEVEL] No XP: paragraph already rewarded.");
        resolve();
        return;
      }
      const { expectedTime, difficulty } = getCachedStats(paragraphId, sentences);
      console.log("[LEVEL] Time spent:", timeMs, "Expected:", expectedTime);
      if (timeMs < expectedTime) {
        console.log("[LEVEL] No XP: user did not spend enough time.");
        resolve();
        return;
      }
      chrome.storage.sync.get(["history"], (data) => {
        const history = data.history || [];
        const existingArticle = history.filter((item) => item.url === window.location.href).sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0))[0];
        const sessionCount = existingArticle?.sessionCount || 0;
        const completedArticle = existingArticle && (existingArticle.status === "completed" || existingArticle.percentComplete >= 100);
        let xpMultiplier = XP_MULTIPLIERS.FIRST_READ;
        if (completedArticle) {
          const reads = existingArticle.sessionCount || 1;
          if (reads >= 3) {
            xpMultiplier = XP_MULTIPLIERS.REPEAT_READ;
          } else if (reads >= 2) {
            xpMultiplier = XP_MULTIPLIERS.SECOND_READ;
          }
        }
        const gainedXp = Math.max(1, Math.round(difficulty * xpMultiplier));
        state.xp += gainedXp;
        state.sessionXp += gainedXp;
        state.paragraphXpMap.add(paragraphId);
        while (state.xp >= getRequiredXp(state.level)) {
          state.xp -= getRequiredXp(state.level);
          const levelReward = getLevelUpCoins(
            state.level + 1
          );
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
        state.required = getRequiredXp(state.level);
        console.log(
          "[LEVEL] XP Award:",
          gainedXp,
          "Current XP:",
          state.xp,
          "/ Required:",
          state.required,
          "Mood Multiplier:",
          xpMultiplier,
          "Coins Gained:",
          state.sessionCoinsGained,
          "Session Count:",
          sessionCount
        );
        chrome.storage.sync.set(
          {
            sessionXp: state.sessionXp,
            xp: state.xp,
            required: state.required,
            level: state.level,
            coins: state.coins,
            totalCoinsEarned: state.totalCoinsEarned,
            totalCoinsSpent: state.totalCoinsSpent
          },
          () => {
            console.log(
              "[LEVEL] Saved XP + Level:",
              state.xp,
              state.level
            );
            state.timeStarted = Date.now();
            resolve();
          }
        );
      });
    });
  }
  function nextPage() {
    console.log(
      "[SUMMARY] Final session XP:",
      state.sessionXp
    );
    console.log("Page: ", state.currentPage + 2);
    if (state.currentPage < state.pageIndexMap.length - 1) {
      state.lastInteraction = Date.now();
      state.paragraphSwitches++;
      state.wordsReadSoFar += state.currentPageWords;
      updateLeveling().then(() => {
        state.currentPage++;
        state.percentComplete = Math.round(
          (state.currentPage + 1) / state.pageIndexMap.length * 100
        );
        saveSessionCheckpoint();
        setActiveParagraph();
        chrome.storage.sync.set({
          readingActive: true,
          sessionXp: state.sessionXp,
          wordsReadSoFar: state.wordsReadSoFar,
          currentPageWords: state.currentPageWords,
          percentComplete: state.percentComplete
        });
      });
    } else {
      state.wordsReadSoFar += state.currentPageWords;
      updateLeveling().then(() => {
        state.percentComplete = 100;
        state.sessionStatus = state.percentComplete >= 100 ? "completed" : "in_progress";
        console.log(
          "[SUMMARY] Final session XP:",
          state.sessionXp
        );
        showSummaryPage();
      });
    }
  }
  function prevPage() {
    if (state.currentPage > 0) {
      state.lastInteraction = Date.now();
      console.log("[READER] Interaction: prevPage \u2192 lastInteraction:", state.lastInteraction);
      state.paragraphSwitches++;
      state.currentPage--;
      saveSessionCheckpoint();
      setActiveParagraph();
    }
  }
  function getCachedStats(paragraphId, sentences) {
    if (state.paragraphCache.has(paragraphId)) {
      return state.paragraphCache.get(paragraphId);
    }
    const { chars, sentenceCount } = getParagraphStats(sentences);
    const expectedTime = getExpectedTimeMs(sentences);
    const difficulty = getParagraphDifficulty(sentences);
    const stats = { chars, sentenceCount, expectedTime, difficulty };
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
    let base = sentenceCount * 1200;
    const densityMultiplier = chars / (sentenceCount * 80);
    base *= densityMultiplier;
    base = Math.max(base, 8e3);
    base = Math.min(base, 3e4);
    return Math.round(base);
  }
  function getParagraphDifficulty(sentences) {
    const { chars, sentenceCount } = getParagraphStats(sentences);
    let xp = 0;
    xp += sentenceCount * 1.5;
    xp += chars / 120;
    if (chars < SHORT_THRESHOLD) xp += 1;
    if (chars > LONG_THRESHOLD) xp += 4;
    xp = Math.max(xp, 3);
    xp = Math.min(xp, 30);
    return Math.round(xp);
  }
  function getRequiredXp(level) {
    return 100 + (level - 1) * 50;
  }
  function getLevelUpCoins(level) {
    if (level <= 5) return 5;
    if (level <= 10) return 10;
    if (level <= 20) return 15;
    return 20 + Math.floor((level - 21) / 10) * 2;
  }

  // content/readerUI.js
  function getActiveTransformFunction() {
    return state.readerSettings.bionic ? transformBionic : transformNormal;
  }
  function renderChunk(chunk) {
    const readerActive = document.getElementById("reader-active");
    if (!readerActive) return;
    const transform = getActiveTransformFunction();
    const html = chunk.map(
      (sentence) => sentence.split(" ").map((word) => transform(word)).join(" ")
    ).join(" ");
    readerActive.innerHTML = html;
  }
  function rerenderReader() {
    console.log(
      "[RERENDER]",
      state.currentChunk
    );
    if (!state.currentChunk) return;
    renderChunk(state.currentChunk);
  }
  function transformNormal(word) {
    return word;
  }
  function transformBionic(word) {
    const cutoff = Math.ceil(word.length * 0.4);
    const first = word.slice(0, cutoff);
    const rest = word.slice(cutoff);
    return `<span class="bionic-first">${first}</span>${rest}`;
  }
  function updateReaderProgress() {
    const progressEl = document.getElementById("reader-progress");
    if (!progressEl) return;
    const total = state.pageIndexMap.length;
    const current = state.currentPage + 1;
    progressEl.textContent = `${current} / ${total}`;
  }
  function injectReaderArea() {
    const existing = document.getElementById("reader-area-bar");
    if (existing) existing.remove();
    const bar = document.createElement("div");
    bar.id = "reader-area-bar";
    bar.classList.add("extension-theme");
    bar.innerHTML = `
    <div id="reader-page">
      <div id="reader-area-header">
        <span id="reader-status">Reading now</span>
  
        <div class="mini-progress">
          <div id="reader-progress"></div>
        </div>
        <div class="reader-session-actions">
          <button id="reader-pause">Pause</button>
          <button id="reader-finish">Finish Session</button>
          
          <button id="btn-prev">Previous</button>
          <button id="btn-next">Next</button>
        </div>
      </div>
      <div id="reader-active"></div>
    </div>
    <div id="reader-paused" class="hidden">
      <div class="paused-content">
        <h1>Reading Paused</h1>
        <p> Your reading session is currently paused. </p>
        <p> Would you like to continue where you left off? </p>
        <div class="paused-actions">
          <button id="paused-resume-btn">
            Resume Reading
          </button>
          <button id="paused-finish-btn">
            Finish Session
          </button>
        </div>
      </div>
    </div>
      <div id="reader-summary" class="hidden">
        <div id="summary-content"></div>
      </div>
  `;
    document.documentElement.appendChild(bar);
    document.getElementById("btn-next").addEventListener("click", nextPage);
    document.getElementById("btn-prev").addEventListener("click", prevPage);
    const pausedResumeBtn = document.getElementById("paused-resume-btn");
    const pausedFinishBtn = document.getElementById("paused-finish-btn");
    if (pausedResumeBtn) {
      pausedResumeBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          action: "resume-reader"
        });
      });
    }
    if (pausedFinishBtn) {
      pausedFinishBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          action: "finish-reader"
        });
      });
    }
    const pauseBtn = document.getElementById("reader-pause");
    const finishBtn = document.getElementById("reader-finish");
    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        console.log("[UI] Pause clicked");
        state.lastInteraction = Date.now();
        state.isPaused = true;
        state.pausedAt = Date.now();
        chrome.storage.sync.set({
          isPaused: true,
          pausedAt: state.pausedAt
        });
        showPausedPage();
      });
    }
    if (finishBtn) {
      finishBtn.addEventListener("click", () => {
        console.log("[UI] Finish clicked");
        if (state.idleIntervalId) {
          clearInterval(state.idleIntervalId);
          state.idleIntervalId = null;
        }
        if (state.autosaveId) {
          clearInterval(state.autosaveId);
          state.autosaveId = null;
        }
        updateLeveling().then(() => {
          state.sessionStatus = state.percentComplete >= 100 ? "completed" : "in_progress";
          chrome.storage.sync.set({
            readingActive: false
          });
          showSummaryPage();
        });
      });
    }
  }
  function updateReaderStyle() {
    const bar = document.getElementById("reader-area-bar");
    if (!bar) return;
    bar.style.setProperty("--reader-font", state.readerSettings.font);
    bar.style.setProperty("--reader-font-size", state.readerSettings.fontSize + "px");
    const targets = document.querySelectorAll(".extension-theme");
    targets.forEach((el) => {
      el.classList.remove("theme-dark", "theme-light", "theme-forest");
      el.classList.add(state.readerSettings.theme);
    });
    rerenderReader();
  }

  // content/messaging.js
  function setupMessaging() {
    const api = globalThis.browser || globalThis.chrome;
    api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      console.log("[CONTENT] Message received:", msg);
      switch (msg.action) {
        case "ping":
          sendResponse({ ok: true });
          return false;
        case "start-reader":
          chrome.storage.sync.get([
            "xp",
            "level",
            "required",
            "coins",
            "totalCoinsEarned",
            "totalCoinsSpent"
          ], (data) => {
            try {
              if (data.xp !== void 0) state.xp = data.xp;
              if (data.level !== void 0) state.level = data.level;
              if (data.required !== void 0) state.required = data.required;
              if (data.coins !== void 0) state.coins = data.coins;
              if (data.totalCoinsEarned !== void 0) state.totalCoinsEarned = data.totalCoinsEarned;
              if (data.totalCoinsSpent !== void 0) state.totalCoinsSpent = data.totalCoinsSpent;
              console.log("[LEVEL] Loaded XP + Level:", state.xp, state.level);
              state.sessionStartedAt = Date.now();
              state.allSentences = [];
              state.pageIndexMap = [];
              state.currentChunk = null;
              state.activeElement = null;
              state.currentPage = 0;
              state.articleTitle = document.title;
              state.articleWordCount = 0;
              state.wordsReadSoFar = 0;
              state.currentPageWords = 0;
              state.coinsAtStart = state.coins;
              state.levelAtStart = state.level;
              state.sessionXp = 0;
              state.sessionCoinsGained = 0;
              state.sessionLevelCoins = 0;
              state.sessionReadingCoins = 0;
              state.percentComplete = 0;
              state.paragraphSwitches = 0;
              state.sessionStatus = "active";
              state.sessionStartPercent = msg.resumePercent || 0;
              state.topicId = null;
              state.sessionCategory = "Reading";
              state.sessionNotes = [];
              state.sessionTags = [];
              state.paragraphXpMap.clear();
              state.pausedAt = null;
              state.isPaused = false;
              state.totalPausedMs = 0;
              state.totalSessionTime = 0;
              chrome.storage.sync.set({
                // Persist live session data so popup.js can display statistics even when reopened
                readingActive: true,
                sessionStartedAt: state.sessionStartedAt,
                articleTitle: document.title,
                //coinsGained: 0,
                sessionXp: 0,
                wordsReadSoFar: 0,
                currentPageWords: 0,
                percentComplete: 0,
                sessionReadingCoins: 0,
                pausedAt: null,
                totalPausedMs: 0,
                isPaused: false
              });
              state.timeStarted = Date.now();
              state.lastInteraction = Date.now();
              console.log("[READER] Started at:", state.timeStarted);
              if (state.idleIntervalId) {
                clearInterval(state.idleIntervalId);
              }
              state.idleIntervalId = setInterval(() => {
                const idleMs = Date.now() - state.lastInteraction;
                console.log(
                  "[READER] Idle check:",
                  idleMs,
                  "ms"
                );
                if (idleMs > 45e3) {
                  console.log(
                    "[READER] User idle too long"
                  );
                }
              }, 5e3);
              if (state.autosaveId) {
                clearInterval(state.autosaveId);
              }
              state.autosaveId = setInterval(() => {
                saveSessionCheckpoint();
              }, 3e4);
              if (msg.settings) {
                Object.assign(state.readerSettings, msg.settings);
              }
              toggleBlur();
              if (!blurEnabled) {
                sendResponse({ ok: true, active: false });
                return;
              }
              injectReaderArea();
              const manual = msg.selectedText?.trim();
              if (manual && manual.length > 0) {
                state.allSentences = extractSentencesFromText(manual);
              } else {
                state.allSentences = extractSentences();
              }
              state.pageIndexMap = buildPageIndexMap();
              state.currentPage = 0;
              if (msg.resumePage !== void 0) {
                state.currentPage = msg.resumePage;
              }
              if (msg.resumePercent !== void 0) {
                state.percentComplete = msg.resumePercent;
              }
              updateReaderStyle();
              setActiveParagraph();
              sendResponse({
                ok: true,
                active: true
              });
            } catch (err) {
              console.error("[CONTENT] start-reader error:", err);
              sendResponse({
                ok: false,
                error: err.message
              });
            }
          });
          return true;
        case "next-page":
          nextPage();
          sendResponse({ ok: true });
          break;
        case "pause-reader":
          console.log("[MESSAGING] pause-reader received");
          state.lastInteraction = Date.now();
          state.isPaused = true;
          state.pausedAt = Date.now();
          showPausedPage();
          chrome.storage.sync.set({
            isPaused: true,
            pausedAt: state.pausedAt
          });
          sendResponse({ ok: true });
          break;
        case "resume-reader":
          state.lastInteraction = Date.now();
          if (state.pausedAt) {
            const pausedDuration = Date.now() - state.pausedAt;
            state.totalPausedMs += pausedDuration;
          }
          state.pausedAt = null;
          state.isPaused = false;
          chrome.storage.sync.set({
            isPaused: false,
            pausedAt: null,
            totalPausedMs: state.totalPausedMs,
            readingActive: true
          });
          sendResponse({ ok: true });
          break;
        case "finish-reader":
          if (state.idleIntervalId) {
            clearInterval(state.idleIntervalId);
            state.idleIntervalId = null;
          }
          if (state.autosaveId) {
            clearInterval(state.autosaveId);
            state.autosaveId = null;
          }
          console.log("[MESSAGING] finish-reader received");
          updateLeveling().then(() => {
            state.sessionStatus = state.percentComplete >= 100 ? "completed" : "in_progress";
            chrome.storage.sync.set({
              readingActive: false
            });
            showSummaryPage();
            sendResponse({ ok: true });
          });
          return true;
        case "reader-active":
          sendResponse({
            active: !!document.getElementById(
              "reader-area-bar"
            )
          });
          break;
        case "set-basic-font":
          state.readerSettings.font = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        case "set-bionic":
          state.readerSettings.bionic = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        case "set-font-size":
          state.readerSettings.fontSize = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        case "set-theme":
          state.readerSettings.theme = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        default:
          console.log("[CONTENT] Unknown action:", msg.action);
          break;
      }
      return true;
    });
    console.log("[CONTENT] Messaging ready");
  }

  // content/content.js
  console.log("CONTENT SCRIPT LOADED");
  globalThis.browser = globalThis.browser || globalThis.chrome;
  function init() {
    startObserver();
    setupMessaging();
  }
  init();
})();
