(() => {
  // popup/popupUtils.js
  var api = typeof browser !== "undefined" ? browser : chrome;
  window.browser = api;
  var $ = (sel) => document.querySelector(sel);
  var $$ = (sel) => document.querySelectorAll(sel);
  function getActiveTab() {
    return new Promise((resolve) => {
      api.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (api.runtime.lastError) {
          console.warn("[POPUP] tabs.query:", api.runtime.lastError.message);
          resolve(null);
          return;
        }
        resolve(tabs && tabs[0] ? tabs[0] : null);
      });
    });
  }
  function sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
      api.tabs.sendMessage(tabId, message, (response) => {
        const err = api.runtime.lastError;
        if (err) reject(new Error(err.message));
        else resolve(response);
      });
    });
  }
  async function ensureContentScript(tabId) {
    try {
      await sendMessageToTab(tabId, { action: "ping" });
      await api.scripting.insertCSS({
        target: { tabId, allFrames: true },
        files: ["css/readerArea.css"]
      });
      return true;
    } catch (_) {
      try {
        await api.scripting.executeScript({
          target: { tabId, allFrames: true },
          files: ["dist/content.js"]
        });
        await api.scripting.insertCSS({
          target: { tabId, allFrames: true },
          files: ["css/readerArea.css"]
        });
        return true;
      } catch (injectErr) {
        console.warn(
          "[POPUP] Could not inject content script:",
          injectErr
        );
        return false;
      }
    }
  }
  async function sendToReader(action, value) {
    const tab = await getActiveTab();
    if (!tab?.id) {
      console.warn("[POPUP] No active tab");
      return;
    }
    if (!/^https?:/.test(tab.url || "")) {
      console.warn("[POPUP] Cannot run on this page:", tab.url);
      return;
    }
    const ok = await ensureContentScript(tab.id);
    if (!ok) return;
    try {
      await sendMessageToTab(tab.id, { action, value });
    } catch (err) {
      console.warn("[POPUP] sendMessage failed:", action, err.message);
    }
  }

  // popup/popupSettings.js
  var popupSettings = {
    font: "sans-serif",
    fontSize: 16,
    theme: "theme-light",
    bionic: false
  };
  function applyPopupStyle() {
    const root = document.documentElement;
    root.style.setProperty("--reader-font", popupSettings.font);
    root.style.setProperty("--reader-font-size", popupSettings.fontSize + "px");
  }
  function applyPopupTheme(themeName) {
    const root = document.documentElement;
    root.classList.remove(
      "theme-dark",
      "theme-light",
      "theme-forest"
    );
    root.classList.add(themeName);
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
  function loadHistory(callback) {
    chrome.storage.sync.get(["history"], (data) => {
      callback(data.history || []);
    });
  }

  // popup/pet.js
  var DEFAULT_PET = {
    name: "Pet name",
    hunger: 100,
    mood: 100,
    hygiene: 100,
    social: 100,
    energy: 100,
    lastUpdated: Date.now(),
    //evolutionStage: 1,
    inventory: []
  };
  var PET_ANIMATIONS = {
    idle: {
      sheet: "Idle.png",
      frames: 10,
      frameWidth: 96,
      width: 96,
      height: 100
      //speed: 250
    },
    idle2: {
      sheet: "Idle2.png",
      frames: 10,
      frameWidth: 96
    },
    content: {
      sheet: "Box1.png",
      frames: 4,
      frameWidth: 96
    },
    cry: {
      sheet: "Cry.png",
      frames: 8,
      frameWidth: 96
    },
    dance: {
      sheet: "Dance.png",
      frames: 4,
      frameWidth: 96
    },
    starving: {
      sheet: "catsick1.png",
      frames: 5,
      frameWidth: 96
    },
    mad: {
      sheet: "catsick2.png",
      frames: 4,
      frameWidth: 96
    },
    waiting: {
      sheet: "Waiting.png",
      frames: 6,
      frameWidth: 96
    },
    sad: {
      sheet: "Sad.png",
      frames: 9,
      frameWidth: 96
    },
    sleepy: {
      sheet: "Sleepy.png",
      frames: 8,
      frameWidth: 96
    },
    superLow: {
      sheet: "DeadCat.png",
      frames: 1,
      frameWidth: 96
    },
    surprised: {
      sheet: "Surprised.png",
      frames: 12,
      frameWidth: 96
    }
  };
  var animationInterval = null;
  function loadPet(callback) {
    chrome.storage.sync.get(
      ["pet"],
      (data) => {
        const pet = data.pet || { ...DEFAULT_PET };
        updatePetDecay(pet);
        savePet(pet);
        callback(pet);
      }
    );
  }
  function savePet(pet) {
    chrome.storage.sync.set({ pet });
  }
  function renderPet(pet) {
    console.log(
      "[PET] Rendering:",
      pet
    );
    chrome.storage.sync.get(
      ["level", "coins", "xp", "required"],
      (data) => {
        const currentLevel = data.level ?? 1;
        const currentXp = data.xp ?? 0;
        const requiredXp = data.required ?? 100;
        const stageLevelEl = document.querySelector(".pet-level");
        if (stageLevelEl) {
          stageLevelEl.textContent = `Level ${currentLevel}`;
        }
        const currentLevelEl = document.getElementById(
          "pet-current-level"
        );
        if (currentLevelEl) {
          currentLevelEl.textContent = `Level ${currentLevel}`;
        }
        const xpEl = document.getElementById(
          "pet-current-xp"
        );
        if (xpEl) {
          xpEl.textContent = `${currentXp} / ${requiredXp} XP`;
        }
        const levelBar = document.getElementById(
          "pet-level-bar"
        );
        if (levelBar) {
          levelBar.style.width = `${Math.min(
            100,
            currentXp / requiredXp * 100
          )}%`;
        }
        const coinsEl = document.getElementById(
          "petCoins"
        );
        if (coinsEl) {
          coinsEl.textContent = data.coins ?? 0;
        }
      }
    );
    const petName = document.querySelector(".pet-title strong");
    if (petName) {
      petName.textContent = pet.name;
    }
    const mood = document.getElementById("petMood");
    if (mood) {
      mood.textContent = getPetMood(pet);
    }
    const status = document.getElementById("petThought");
    if (status) {
      if (pet.hunger < 25) {
        status.textContent = "Needs a snack";
      } else if (pet.energy < 25) {
        status.textContent = "Feeling sleepy";
      } else if (pet.social < 25) {
        status.textContent = "Wants some attention";
      } else if (pet.hygiene < 25) {
        status.textContent = "Needs a bath";
      } else {
        status.textContent = "Happy and ready to read";
      }
    }
    updatePetBar("pet-hunger-bar", "pet-hunger-value", pet.hunger);
    updatePetBar("pet-mood-bar", "pet-mood-value", pet.mood);
    updatePetBar("pet-hygiene-bar", "pet-hygiene-value", pet.hygiene);
    updatePetBar("pet-social-bar", "pet-social-value", pet.social);
    updatePetBar("pet-energy-bar", "pet-energy-value", pet.energy);
    mood?.setAttribute(
      "title",
      `Hunger: ${Math.round(pet.hunger)}%
    Energy: ${Math.round(pet.energy)}%
    Social: ${Math.round(pet.social)}%
    Hygiene: ${Math.round(pet.hygiene)}%`
    );
  }
  function updatePetBar(barId, valueId, value) {
    const bar = document.getElementById(barId);
    const label = document.getElementById(valueId);
    const rounded = Math.round(value);
    if (bar) {
      bar.style.width = `${rounded}%`;
    }
    if (label) {
      label.textContent = `${rounded}%`;
    }
  }
  function getPetMood(pet) {
    if (pet.hunger < 25)
      return "Starving";
    if (pet.energy < 25)
      return "Sleepy";
    if (pet.social < 25)
      return "Waiting";
    if (pet.hygiene < 25)
      return "Surprised";
    if (pet.mood > 80)
      return "Dance";
    if (pet.mood > 50)
      return "Content";
    return "Sad";
  }
  function updatePetUI(pet) {
    const mood = getPetMood(pet);
    const moodEl = document.getElementById("petMood");
    if (moodEl) {
      moodEl.textContent = mood;
    }
    switch (mood) {
      case "Starving":
        setPetState("starving");
        break;
      case "Sleepy":
        setPetState("sleepy");
        break;
      case "Waiting":
        setPetState("waiting");
        break;
      case "Surprised":
        setPetState("surprised");
        break;
      case "Dance":
        setPetState("dance");
        break;
      case "Content":
        setPetState("content");
        break;
      case "Sad":
        setPetState("sad");
        break;
    }
  }
  function setPetState(state2) {
    startPetAnimation(state2);
  }
  function updatePetDecay(pet) {
    const now = Date.now();
    const hoursPassed = (now - pet.lastUpdated) / (1e3 * 60 * 60);
    pet.hunger = Math.max(0, pet.hunger - hoursPassed * 2);
    pet.energy = Math.max(0, pet.energy - hoursPassed * 1);
    pet.social = Math.max(0, pet.social - hoursPassed * 1);
    pet.hygiene = Math.max(0, pet.hygiene - hoursPassed * 0.5);
    if (pet.hunger < 25 || pet.energy < 25 || pet.social < 25 || pet.hygiene < 25) {
      pet.mood = Math.max(0, pet.mood - 5);
    }
    pet.lastUpdated = now;
  }
  function careForPet(pet) {
    pet.hunger = Math.min(100, pet.hunger + 15);
    pet.hygiene = Math.min(100, pet.hygiene + 10);
    pet.energy = Math.min(100, pet.energy + 5);
    pet.social = Math.min(100, pet.social + 10);
    pet.mood = Math.min(100, pet.mood + 5);
  }
  function startPetAnimation(animation = "idle") {
    const petSprite = document.getElementById("petSprite");
    if (!petSprite) return;
    const config = PET_ANIMATIONS[animation];
    if (!config) return;
    if (animationInterval) {
      clearInterval(animationInterval);
    }
    petSprite.style.backgroundImage = `url("../popup/assets/cat/${config.sheet}")`;
    petSprite.style.backgroundPositionX = "0px";
    let frame = 0;
    petSprite.style.width = `${config.width ?? 96}px`;
    petSprite.style.height = `${config.height ?? 100}px`;
    animationInterval = setInterval(() => {
      petSprite.style.backgroundPositionX = `-${frame * config.frameWidth}px`;
      frame = (frame + 1) % config.frames;
    }, 150);
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

  // content/summary.js
  function resumeReadingPage() {
    document.getElementById("reader-paused")?.classList.add("hidden");
    document.getElementById("reader-page")?.classList.remove("hidden");
  }

  // popup/popupReader.js
  function initReader() {
    api.storage.sync.get(["font", "fontSize", "theme", "bionic"], (data) => {
      popupSettings.font = data.font || "sans-serif";
      popupSettings.fontSize = Number(data.fontSize) || 16;
      popupSettings.theme = data.theme || "theme-light";
      popupSettings.bionic = data.bionic || false;
      document.getElementById("font-select").value = popupSettings.font;
      document.getElementById("font-size").value = popupSettings.fontSize;
      document.getElementById("color-theme").value = popupSettings.theme;
      const bionicBtn = document.getElementById("set-bionic");
      if (popupSettings.bionic && bionicBtn) {
        bionicBtn.classList.add("active");
      }
      applyPopupStyle();
      applyPopupTheme(popupSettings.theme);
    });
    api.storage.sync.get(
      ["readingActive"],
      (data) => {
        if (data.readingActive) {
          $("#reader-prestart")?.classList.add("hidden");
          $("#reader-active-popup")?.classList.remove("hidden");
        }
      }
    );
    $$(".popover-tabs button").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".popover-tabs button").forEach(
          (b) => b.classList.remove("active")
        );
        btn.classList.add("active");
        const tab = btn.dataset.tab;
        $$(".tab-panel").forEach(
          (panel) => panel.classList.add("hidden")
        );
        document.querySelector(`.tab-panel[data-panel="${tab}"]`)?.classList.remove("hidden");
      });
    });
    $("#font-select")?.addEventListener(
      "change",
      (e) => {
        popupSettings.font = e.target.value;
        api.storage.sync.set({
          font: popupSettings.font
        });
        applyPopupStyle();
        sendToReader(
          "set-basic-font",
          popupSettings.font
        );
      }
    );
    $("#font-size")?.addEventListener(
      "change",
      (e) => {
        popupSettings.fontSize = Number(e.target.value);
        api.storage.sync.set({
          fontSize: popupSettings.fontSize
        });
        applyPopupStyle();
        sendToReader(
          "set-font-size",
          popupSettings.fontSize
        );
      }
    );
    $("#color-theme")?.addEventListener(
      "change",
      (e) => {
        popupSettings.theme = e.target.value;
        api.storage.sync.set({
          theme: popupSettings.theme
        });
        applyPopupTheme(
          popupSettings.theme
        );
        sendToReader(
          "set-theme",
          popupSettings.theme
        );
      }
    );
    $("#set-bionic")?.addEventListener(
      "click",
      () => {
        popupSettings.bionic = !popupSettings.bionic;
        $("#set-bionic").classList.toggle(
          "active",
          popupSettings.bionic
        );
        api.storage.sync.set({
          bionic: popupSettings.bionic
        });
        sendToReader(
          "set-bionic",
          popupSettings.bionic
        );
      }
    );
    $("#btn-play")?.addEventListener(
      "click",
      async () => {
        let selectedText = "";
        try {
          selectedText = await new Promise((resolve) => {
            api.runtime.sendMessage(
              { action: "get-selection" },
              (response) => {
                resolve(response?.text || "");
              }
            );
          });
        } catch (_) {
        }
        const tab = await getActiveTab();
        if (!tab?.id) return;
        const ok = await ensureContentScript(tab.id);
        if (!ok) return;
        try {
          const response = await sendMessageToTab(tab.id, {
            action: "start-reader",
            selectedText,
            settings: { ...popupSettings }
          });
          if (response?.ok) {
            $("#reader-prestart")?.classList.add("hidden");
            $("#reader-active-popup")?.classList.remove("hidden");
            api.storage.sync.set({
              readingActive: true
            });
          }
        } catch (err) {
          console.warn("[POPUP] start-reader failed:", err.message);
        }
      }
    );
    $("#reader-pause-popup")?.addEventListener("click", () => {
      $("#reader-status").textContent = "Reading paused";
      $("#reader-pause-popup")?.classList.add("hidden");
      $("#reader-resume-popup")?.classList.remove("hidden");
      sendToReader("pause-reader");
      chrome.storage.sync.set({
        isPaused: true,
        pausedAt: Date.now()
      });
    });
    $("#reader-resume-popup")?.addEventListener("click", () => {
      $("#reader-status").textContent = "Reading now";
      $("#reader-resume-popup")?.classList.add("hidden");
      $("#reader-pause-popup")?.classList.remove("hidden");
      resumeReadingPage();
      sendToReader("resume-reader");
      chrome.storage.sync.set({
        isPaused: false
      });
    });
    $("#reader-finish-popup")?.addEventListener("click", () => {
      sendToReader("finish-reader");
    });
    $("#reader-aa")?.addEventListener("click", () => {
      document.querySelector(".reader-settings")?.classList.toggle("hidden");
      document.querySelector("#all-reader-stats")?.classList.add("hidden");
    });
    $("#reader-alltime-stats")?.addEventListener("click", () => {
      document.querySelector("#all-reader-stats")?.classList.remove("hidden");
      document.querySelector(".reader-settings")?.classList.add("hidden");
    });
    $("#closePopover")?.addEventListener("click", () => {
      window.close();
    });
  }
  function updateReaderPopupStats() {
    api.storage.sync.get(
      [
        "sessionXp",
        "wordsReadSoFar",
        "percentComplete",
        "sessionStartedAt",
        "readingActive",
        "articleTitle",
        "isPaused",
        "pausedAt",
        "totalPausedMs",
        "sessionReadingcoins"
      ],
      (data) => {
        if (!data.readingActive) return;
        const statusText = data.articleTitle ? `Reading: ${data.articleTitle}` : "Reading now";
        const status = document.getElementById(
          "reader-status"
        );
        if (data.isPaused) {
          document.getElementById(
            "reader-status"
          ).textContent = "Reading paused";
        } else if (status) {
          status.textContent = statusText;
        }
        if (data.isPaused) {
          $("#reader-pause-popup")?.classList.add("hidden");
          $("#reader-resume-popup")?.classList.remove("hidden");
        } else {
          $("#reader-pause-popup")?.classList.remove("hidden");
          $("#reader-resume-popup")?.classList.add("hidden");
        }
        const xp = data.sessionXp || 0;
        const words = data.wordsReadSoFar || 0;
        let timeText = "00:00";
        let elapsed = 0;
        if (data.sessionStartedAt) {
          const now = data.isPaused ? data.pausedAt || Date.now() : Date.now();
          elapsed = Math.floor(
            (now - data.sessionStartedAt - (data.totalPausedMs || 0)) / 1e3
          );
        }
        const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const secs = String(elapsed % 60).padStart(2, "0");
        timeText = `${mins}:${secs}`;
        document.getElementById(
          "reader-time-popup"
        ).textContent = timeText;
        document.getElementById(
          "reader-words-popup"
        ).textContent = words.toLocaleString();
        document.getElementById(
          "reader-xp-popup"
        ).textContent = `+${xp}`;
        const progress = data.percentComplete || 0;
        document.getElementById(
          "reader-progress-popup"
        ).style.width = `${progress}%`;
      }
    );
  }
  function updateLifeTimeStats() {
    api.storage.sync.get(
      [
        "level",
        "xp",
        "required",
        "coins"
      ],
      (data) => {
        document.getElementById(
          "reader-current-level"
        ).textContent = `${data.level}`;
        document.getElementById(
          "reader-xp-next"
        ).textContent = `${data.xp}/${data.required}`;
        document.getElementById(
          "reader-current-coins"
        ).textContent = `${data.coins}`;
      }
    );
  }
  async function validateReaderState() {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    try {
      const response = await sendMessageToTab(tab.id, {
        action: "reader-active"
      });
      if (!response?.active) {
        chrome.storage.sync.set({
          readingActive: false,
          isPaused: false
        });
        $("#reader-active-popup")?.classList.add("hidden");
        $("#reader-prestart")?.classList.remove("hidden");
      }
    } catch {
      chrome.storage.sync.set({
        readingActive: false,
        isPaused: false
      });
    }
  }

  // popup/popupSession.js
  function initSessions() {
    document.getElementById("refreshHistory")?.addEventListener("click", () => {
      loadHistory((history) => {
        console.log("[HISTORY]", history);
        renderSessionList(history);
      });
    });
    document.getElementById("btn-continue-reading")?.addEventListener("click", async () => {
      const tab = await getActiveTab();
      if (!tab?.id) return;
      const ok = await ensureContentScript(tab.id);
      if (!ok) return;
      const resumePage = window.resumeSession?.currentPage ?? 0;
      const response = await sendMessageToTab(tab.id, {
        action: "start-reader",
        resumePage,
        resumePercent: window.resumeSession?.percentComplete || 0,
        settings: { ...popupSettings }
      });
      if (response?.ok) {
        document.getElementById("reader-previous-sesh")?.classList.add("hidden");
        document.getElementById("reader-active-popup")?.classList.remove("hidden");
      }
    });
    loadHistory(renderSessionList);
    checkForPreviousSession();
  }
  function renderSessionList(history) {
    const sessionsList = document.getElementById("sessionsList");
    if (!sessionsList) return;
    sessionsList.innerHTML = "";
    history.forEach((session, index) => {
      const btn = document.createElement("button");
      const count = session.sessionCount ?? 1;
      const xp = session.totalXp ?? session.xpGained ?? 0;
      btn.className = "sessions-item";
      btn.innerHTML = `
        <span class="sessions-dot sessions-${index % 5}"></span>

        <span>
            <strong>${session.title}</strong>
            <small>
            ${count} session${count !== 1 ? "s" : ""}
            </small>
        </span>

        <b>${xp} XP</b>

        <span>\u203A</span>
        `;
      btn.addEventListener("click", () => {
        showSessionSummary(session);
      });
      sessionsList.appendChild(btn);
    });
  }
  async function checkForPreviousSession() {
    const tab = await getActiveTab();
    const currentUrl = tab?.url;
    if (!currentUrl) return;
    chrome.storage.sync.get(
      ["readingActive"],
      (data) => {
        if (data.readingActive) {
          return;
        }
        loadHistory((history) => {
          const session = history.filter((item) => item.url === currentUrl).sort((a, b) => b.lastReadAt - a.lastReadAt)[0];
          if (!session) {
            return;
          }
          if (session.status === "completed" || (session.percentComplete || 0) >= 100) {
            return;
          }
          window.resumeSession = session;
          console.log("[RESUME SESSION]", session);
          document.getElementById("reader-prestart")?.classList.add("hidden");
          document.getElementById("reader-previous-sesh")?.classList.remove("hidden");
          const titleEl = document.getElementById(
            "resume-title"
          );
          const metaEl = document.getElementById(
            "resume-meta"
          );
          if (titleEl) {
            titleEl.textContent = session.title;
          }
          if (metaEl) {
            metaEl.textContent = `${session.wordsRead || 0} words \u2022 ${session.totalXp || 0} XP \u2022 ${session.percentComplete || 0}% complete \u2022 Page ${(session.currentPage ?? 0) + 1}`;
          }
        });
      }
    );
  }
  function showSessionSummary(session) {
    const title = document.getElementById("sessionsNextTitle");
    const meta = document.getElementById("sessionsNextMeta");
    if (!title || !meta) return;
    title.textContent = session.title;
    meta.textContent = `${session.wordsRead || 0} words \u2022 ${session.totalXp || session.xpGained || 0} XP earned \u2022 ${session.sessionCount || 1} sessions`;
  }

  // popup/popup.js
  async function loadCurrentArticleTitle() {
    const tabs = await new Promise((resolve) => {
      api.tabs.query(
        {
          active: true,
          currentWindow: true
        },
        resolve
      );
    });
    const title = tabs?.[0]?.title || "Unknown Article";
    const articleTitle = document.querySelector(".article-title");
    if (articleTitle) {
      articleTitle.textContent = title;
    }
  }
  function initPetUI() {
    $("#carePet")?.addEventListener("click", () => {
      loadPet((pet) => {
        careForPet(pet);
        updatePetUI(pet);
        renderPet(pet);
      });
    });
  }
  function initShopUI() {
    $$(".shop-categories button").forEach(
      (btn) => {
        btn.addEventListener("click", () => {
          $$(".shop-categories button").forEach(
            (b) => b.classList.remove("active")
          );
          btn.classList.add("active");
          const category = btn.dataset.shop.toLowerCase();
          $("#shopCategoryLabel").textContent = `Showing ${category} items`;
        });
      }
    );
  }
  document.addEventListener("DOMContentLoaded", async () => {
    await loadCurrentArticleTitle();
    await validateReaderState();
    initReader();
    initSessions();
    initPetUI();
    initShopUI();
    updateReaderPopupStats();
    updateLifeTimeStats();
    setInterval(() => {
      updateReaderPopupStats();
    }, 1e3);
    loadPet((pet) => {
      console.log(
        "[PET] Rendering:",
        pet
      );
      updatePetUI(pet);
      renderPet(pet);
    });
  });
})();
