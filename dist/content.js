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
  var state2 = {
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
    paragraphXpMap: /* @__PURE__ */ new Set(),
    // Leveling system
    level: 1,
    xp: 0,
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

  // content/pagination.js
  var SHORT_THRESHOLD = 300;
  var LONG_THRESHOLD = 700;
  state2.paragraphCache = /* @__PURE__ */ new Map();
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
    while (index < state2.allSentences.length) {
      map.push(index);
      const count = getDynamicSentenceCount(state2.allSentences, index);
      index += count;
    }
    return map;
  }
  function setActiveParagraph() {
    if (state2.allSentences.length === 0) {
      state2.allSentences = extractSentences();
    }
    if (state2.pageIndexMap.length === 0) {
      state2.pageIndexMap = buildPageIndexMap();
    }
    const start = state2.pageIndexMap[state2.currentPage];
    const count = getDynamicSentenceCount(state2.allSentences, start);
    const end = start + count;
    state2.currentChunk = state2.allSentences.slice(start, end);
    renderChunk(state2.currentChunk);
    updateReaderProgress();
    state2.activeElement = start;
  }
  function updateLeveling() {
    const paragraphId = state2.currentPage;
    const sentences = state2.currentChunk;
    const timeMs = Date.now() - state2.timeStarted;
    if (state2.paragraphXpMap.has(paragraphId)) {
      console.log("[LEVEL] No XP: paragraph already rewarded.");
      return;
    }
    const { expectedTime, difficulty } = getCachedStats(paragraphId, sentences);
    console.log("[LEVEL] Time spent:", timeMs, "Expected:", expectedTime);
    if (timeMs < expectedTime) {
      console.log("[LEVEL] No XP: user did not spend enough time.");
      return;
    }
    const xp = difficulty;
    state2.xp += xp;
    console.log("[LEVEL] XP gained:", xp, "Total XP:", state2.xp);
    state2.paragraphXpMap.add(paragraphId);
    if (state2.xp >= state2.level * 100) {
      state2.level++;
      console.log("[LEVEL] Level up! New level:", state2.level);
    }
    state2.timeStarted = Date.now();
  }
  function nextPage() {
    if (state2.currentPage < state2.pageIndexMap.length - 1) {
      state2.lastInteraction = Date.now();
      console.log("[READER] Interaction: nextPage \u2192 lastInteraction:", state2.lastInteraction);
      state2.paragraphSwitches++;
      state2.currentPage++;
      updateLeveling();
      setActiveParagraph();
    }
  }
  function prevPage() {
    if (state2.currentPage > 0) {
      state2.lastInteraction = Date.now();
      console.log("[READER] Interaction: prevPage \u2192 lastInteraction:", state2.lastInteraction);
      state2.paragraphSwitches++;
      state2.currentPage--;
      setActiveParagraph();
    }
  }
  function getCachedStats(paragraphId, sentences) {
    if (state2.paragraphCache.has(paragraphId)) {
      return state2.paragraphCache.get(paragraphId);
    }
    const { chars, sentenceCount } = getParagraphStats(sentences);
    const expectedTime = getExpectedTimeMs(sentences);
    const difficulty = getParagraphDifficulty(sentences);
    const stats = { chars, sentenceCount, expectedTime, difficulty };
    state2.paragraphCache.set(paragraphId, stats);
    return stats;
  }
  function getParagraphStats(sentences) {
    const chars = sentences.reduce((sum, s) => sum + s.length, 0);
    const sentenceCount = sentences.length;
    return { chars, sentenceCount };
  }
  function getExpectedTimeMs(sentences) {
    const { chars } = getParagraphStats(sentences);
    let base = 15e3;
    if (chars < SHORT_THRESHOLD) base -= 5e3;
    if (chars > LONG_THRESHOLD) base += 5e3;
    return base;
  }
  function getParagraphDifficulty(sentences) {
    const { chars, sentenceCount } = getParagraphStats(sentences);
    let xp = 5;
    xp = Math.max(xp, 3);
    xp = Math.min(xp, 20);
    if (chars < SHORT_THRESHOLD) xp += 2;
    if (chars > LONG_THRESHOLD) xp += 6;
    xp += Math.floor(sentenceCount / 2);
    return xp;
  }

  // content/readerUI.js
  function getActiveTransformFunction() {
    return state2.readerSettings.bionic ? transformBionic : transformNormal;
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
    const total = state2.pageIndexMap.length;
    const current = state2.currentPage + 1;
    progressEl.textContent = `${current} / ${total}`;
  }
  function injectReaderArea() {
    const existing = document.getElementById("reader-area-bar");
    if (existing) existing.remove();
    const bar = document.createElement("div");
    bar.id = "reader-area-bar";
    bar.classList.add("extension-theme");
    bar.innerHTML = `
    <div id="reader-area-header">
      <div id="reader-progress"></div>
      <button id="btn-prev">Previous</button>
      <button id="btn-next">Next</button>
    </div>
    <div id="reader-active"></div>
  `;
    document.documentElement.appendChild(bar);
    document.getElementById("btn-next").addEventListener("click", nextPage);
    document.getElementById("btn-prev").addEventListener("click", prevPage);
  }
  function updateReaderStyle() {
    const bar = document.getElementById("reader-area-bar");
    if (!bar) return;
    bar.style.setProperty("--reader-font", state2.readerSettings.font);
    bar.style.setProperty("--reader-font-size", state2.readerSettings.fontSize + "px");
    const targets = document.querySelectorAll(".extension-theme");
    targets.forEach((el) => {
      el.classList.remove("theme-dark", "theme-light", "theme-forest");
      el.classList.add(state2.readerSettings.theme);
    });
  }

  // content/blur.js
  var blurEnabled = false;
  function toggleBlur() {
    blurEnabled = !blurEnabled;
    if (blurEnabled) {
      document.body.classList.add("fr-blur-all");
    } else {
      document.body.classList.remove("fr-blur-all");
      if (!blurEnabled) {
        state.timeSpentMs += Date.now() - state.timeStarted;
        console.log("[READER] Session ended. Duration:", sessionMs, "ms");
        console.log("Time spent (ms):", state.timeSpentMs);
      }
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
          console.log(
            "[CONTENT] Starting reader, selectedText length:",
            msg.selectedText ? msg.selectedText.length : 0
          );
          state2.timeStarted = Date.now();
          console.log("[READER] Started at:", state2.timeStarted);
          state2.lastInteraction = Date.now();
          console.log("[READER] Initial lastInteraction:", state2.lastInteraction);
          if (msg.settings) {
            Object.assign(state2.readerSettings, msg.settings);
          }
          toggleBlur();
          if (!blurEnabled) {
            sendResponse({ ok: true, active: false });
            return false;
          }
          injectReaderArea();
          const manual = msg.selectedText?.trim();
          if (manual && manual.length > 0) {
            state2.allSentences = extractSentencesFromText(manual);
          } else {
            state2.allSentences = extractSentences();
          }
          state2.pageIndexMap = buildPageIndexMap();
          state2.currentPage = 0;
          updateReaderStyle();
          setActiveParagraph();
          sendResponse({ ok: true, active: true });
          break;
        case "set-basic-font":
          state2.readerSettings.font = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        case "set-bionic":
          state2.readerSettings.bionic = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        case "set-font-size":
          state2.readerSettings.fontSize = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        case "set-theme":
          state2.readerSettings.theme = msg.value;
          updateReaderStyle();
          sendResponse({ ok: true });
          break;
        default:
          console.log("[CONTENT] Unknown action:", msg.action);
          break;
      }
      return false;
    });
    console.log("[CONTENT] Messaging ready");
  }

  // content/content.js
  console.log("CONTENT SCRIPT LOADED");
  setInterval(() => {
    const idleMs = Date.now() - state2.lastInteraction;
    console.log("[READER] Idle check:", idleMs, "ms");
    if (idleMs > 45e3) {
      console.log("[READER] Attention check: user idle for", idleMs, "ms");
    }
  }, 5e3);
  globalThis.browser = globalThis.browser || globalThis.chrome;
  function init() {
    startObserver();
    setupMessaging();
  }
  init();
})();
