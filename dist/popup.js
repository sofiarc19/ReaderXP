(() => {
  // popup/popupUtils.js
  var api = typeof browser !== "undefined" ? browser : chrome;
  window.browser = api;
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
    console.log("[SEND MESSAGE]", message.action);
    return new Promise((resolve, reject) => {
      api.tabs.sendMessage(tabId, message, (response) => {
        const err = api.runtime.lastError;
        if (err) {
          console.log(
            "[MESSAGE FAILED]",
            message.action,
            err.message
          );
          reject(new Error(err.message));
        } else {
          console.log(
            "[MESSAGE OK]",
            message.action,
            response
          );
          resolve(response);
        }
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
    fontSize: 14,
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
      "theme-light",
      "theme-dark",
      "theme-sepia",
      "theme-dracula",
      "theme-night",
      "theme-solarized",
      "theme-blue",
      "theme-green",
      "theme-purple",
      "theme-pink"
    );
    root.classList.add(themeName);
  }

  // content/utils.js
  function $(selector) {
    return document.querySelector(selector);
  }
  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  // popup/popupReader.js
  function initReader() {
    api.storage.sync.get(["font", "fontSize", "theme", "bionic"], (data) => {
      popupSettings.font = data.font || "sans-serif";
      popupSettings.fontSize = Number(data.fontSize) || 14;
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
        $(`.tab-panel[data-panel="${tab}"]`)?.classList.remove("hidden");
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
                if (api.runtime.lastError) {
                  console.log(
                    "[GET-SELECTION ERROR]",
                    api.runtime.lastError.message
                  );
                  resolve("");
                  return;
                }
                console.log(
                  "[GET-SELECTION RESPONSE]",
                  response
                );
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
          console.log("[POPUP] Sending start-reader");
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
    $$(".reader-aa").forEach((button) => {
      button.addEventListener("click", () => {
        console.log("clicked", $(".reader-settings"));
        $("#all-reader-stats")?.classList.add("hidden");
        $(".reader-settings")?.classList.toggle("hidden");
      });
    });
    $$(".reader-alltime-stats").forEach((button) => {
      button.addEventListener("click", () => {
        $("#all-reader-stats")?.classList.toggle("hidden");
        $(".reader-settings")?.classList.add("hidden");
      });
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
        if (!data.readingActive) {
          $("#reader-active-popup")?.classList.add("hidden");
          return;
        }
        const statusText = data.articleTitle ? `Reading: ${data.articleTitle}` : "Reading now";
        const status = document.getElementById("reader-status");
        if (data.isPaused) {
          document.getElementById("reader-status").textContent = "Reading paused";
        } else if (status) {
          status.textContent = statusText;
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
        ).textContent = `${data.level || 1}`;
        document.getElementById(
          "reader-xp-next"
        ).textContent = `${data.xp || 0}/${data.required || 100}`;
        document.getElementById(
          "reader-current-coins"
        ).textContent = `${data.coins || 15}`;
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

  // popup/petAnimations.js
  var PET_ANIMATIONS = {
    idle: {
      sheet: "Idle.png",
      frames: 10,
      frameWidth: 96,
      width: 96,
      height: 100,
      row: 0
    },
    box: {
      sheet: "Box1.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    box2: {
      sheet: "Box2.png",
      frames: 12,
      frameWidth: 96,
      row: 0
    },
    box3: {
      sheet: "Box3.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    sick1: {
      sheet: "catsick1.png",
      frames: 5,
      frameWidth: 96,
      row: 0
    },
    sick2: {
      sheet: "catsick2.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    cry: {
      sheet: "Cry.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    dance: {
      sheet: "Dance.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    dead: {
      sheet: "DeadCat.png",
      frames: 1,
      frameWidth: 96,
      row: 0
    },
    eating: {
      sheet: "Eating.png",
      frames: 15,
      frameWidth: 96,
      row: 0
    },
    excited: {
      sheet: "Excited.png",
      frames: 12,
      frameWidth: 96,
      row: 0
    },
    idle2: {
      sheet: "Idle2.png",
      frames: 10,
      frameWidth: 96,
      row: 0
    },
    laydown: {
      sheet: "laydown.png",
      frames: 12,
      frameWidth: 96,
      row: 0
    },
    sad: {
      sheet: "Sad.png",
      frames: 9,
      frameWidth: 96,
      row: 0
    },
    sleep: {
      sheet: "Sleep.png",
      frames: 4,
      frameWidth: 96,
      row: 0
    },
    sleepy: {
      sheet: "Sleepy.png",
      frames: 8,
      frameWidth: 96,
      row: 0
    },
    surprised: {
      sheet: "Surprised.png",
      frames: 12,
      frameWidth: 96,
      row: 0
    },
    waiting: {
      sheet: "Waiting.png",
      frames: 6,
      frameWidth: 96,
      row: 0
    },
    //Sprite Sheets:
    refusing: {
      sheet: "AnimationSheet.png",
      frames: 13,
      frameWidth: 32,
      frameHeight: 32,
      width: 96,
      height: 96,
      row: 15
    },
    angry: {
      sheet: "AnimationSheet.png",
      frames: 9,
      frameWidth: 32,
      frameHeight: 32,
      width: 96,
      height: 96,
      row: 16
    },
    shy: {
      sheet: "AnimationSheet.png",
      frames: 12,
      frameWidth: 32,
      frameHeight: 32,
      width: 96,
      height: 96,
      row: 17
    },
    annoyed: {
      sheet: "AnimationSheet.png",
      frames: 4,
      frameWidth: 32,
      frameHeight: 32,
      width: 96,
      height: 96,
      row: 18
    },
    paw: {
      sheet: "AnimationSheet.png",
      frames: 11,
      frameWidth: 32,
      frameHeight: 32,
      width: 96,
      height: 96,
      row: 19
    }
  };

  // popup/pet.js
  var DEFAULT_PET = {
    name: null,
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
  var animationInterval = null;
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
  function renderPet(pet) {
    console.log("[PET] Rendering:", pet);
    chrome.storage.sync.get(
      ["level", "coins", "xp", "required"],
      (data) => {
        const currentLevel = data.level ?? 1;
        const currentXp = data.xp ?? 0;
        const requiredXp = data.required ?? 100;
        const stageLevelEl = $(".pet-level");
        if (stageLevelEl) {
          stageLevelEl.textContent = `Level ${currentLevel}`;
        }
        const currentLevelEl = document.getElementById("pet-current-level");
        if (currentLevelEl) {
          currentLevelEl.textContent = `Level ${currentLevel}`;
        }
        const xpEl = document.getElementById("pet-current-xp");
        if (xpEl) {
          xpEl.textContent = `${currentXp} / ${requiredXp} XP`;
        }
        const levelBar = document.getElementById("pet-level-bar");
        if (levelBar) {
          levelBar.style.width = `${Math.min(100, requiredXp > 0 ? currentXp / requiredXp * 100 : 0)}%`;
        }
        const careInfo = document.getElementById("careInfo");
        if (careInfo) {
          careInfo.textContent = `$10 \u2022 ${pet.dailyCareUses}/3 uses`;
        }
      }
    );
    const petName = $(".pet-title strong");
    if (petName) {
      petName.textContent = pet.name || "Unnamed Pet";
    }
    const namingPrompt = document.getElementById("petNamingPrompt");
    if (namingPrompt) {
      namingPrompt.classList.toggle("hidden", !!pet.name);
    }
    const mood = getPetStats(pet);
    const moodEl = document.getElementById("petMood");
    if (moodEl) {
      const label = moodEl.querySelector(".pet-label");
      if (label) {
        label.textContent = mood;
      }
    }
    const moodTooltip = document.getElementById("moodTooltip");
    if (moodTooltip) {
      moodTooltip.innerHTML = `
      <strong>${mood}</strong>
      ${getPetGuidance(pet)}<br><br>

      <strong>Stats: </strong>
      Hunger: ${Math.round(pet.hunger)}%<br>
      Energy: ${Math.round(pet.energy)}%<br>
      Social: ${Math.round(pet.social)}%<br>
      Hygiene: ${Math.round(pet.hygiene)}%<br>
      Mood: ${Math.round(pet.mood)}%
    `;
    }
    const activityEl = document.getElementById("petActivity");
    if (activityEl) {
      const label = activityEl.querySelector(".pet-label");
      if (label) {
        label.textContent = pet.activity || "Idle";
      }
    }
    const activityTooltip = document.getElementById("activityTooltip");
    if (activityTooltip) {
      activityTooltip.innerHTML = `
      <strong>${pet.activity || "Idle"}</strong>
      ${getActivityDescription(pet.activity, pet)}
    `;
    }
    updateEffectsUI(pet);
    updatePetBar("pet-hunger-bar", "pet-hunger-value", pet.hunger);
    updatePetBar("pet-mood-bar", "pet-mood-value", pet.mood);
    updatePetBar("pet-hygiene-bar", "pet-hygiene-value", pet.hygiene);
    updatePetBar("pet-social-bar", "pet-social-value", pet.social);
    updatePetBar("pet-energy-bar", "pet-energy-value", pet.energy);
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
  function getPetGuidance(pet) {
    const mood = getPetStats(pet);
    const petName = pet?.name || "Your pet";
    const lowest = [
      { name: "hunger", value: pet.hunger },
      { name: "energy", value: pet.energy },
      { name: "social", value: pet.social },
      { name: "hygiene", value: pet.hygiene },
      { name: "mood", value: pet.mood }
    ].sort((a, b) => a.value - b.value)[0];
    switch (mood) {
      case "Happy":
        return `${petName} is thriving and enjoying life. Keep reading and caring for them to maintain that happiness.`;
      case "Content":
        return pickRandom([
          `${petName} is feeling content and relaxed.`,
          `${petName} seems comfortable but could use a little extra attention.`,
          `${petName} is doing well overall, though ${lowest.name} is starting to fall behind.`
        ]);
      case "Tired":
        return `${petName} is running low on energy and could use some rest.`;
      case "Lonely":
        return `${petName} feels lonely and would appreciate some attention.`;
      case "Hungry":
        return `${petName} is hungry and would love something to eat.`;
      case "Sad":
        return `${petName}'s spirits are low. Improving their needs should help them feel better.`;
      case "Uncomfortable":
        return `${petName} isn't feeling comfortable right now. ${lowest.name} is only at ${Math.round(lowest.value)}%.`;
      case "Sick":
        return `${petName} is feeling sick because several needs have dropped too low.`;
      case "Weary":
        return `${petName} is exhausted. Most needs are critically low and require urgent attention.`;
      case "Neglected":
        return `${petName} has been neglected for too long and needs immediate care.`;
      default:
        return `${petName} is quietly observing the world.`;
    }
  }
  function getActivityDescription(activity, pet) {
    const petName = pet?.name || "your pet";
    const descriptions = {
      Dancing: `${petName} is full of energy and celebrating.`,
      Excited: `Something has ${petName} feeling especially happy.`,
      Relaxing: `${petName} is taking it easy.`,
      Observing: `${petName} is watching the world around it.`,
      Sleeping: `${petName} is recovering energy.`,
      Yawning: `${petName} is getting sleepy.`,
      Waiting: `${petName} is hoping for attention.`,
      Staring: `${petName} seems lonely.`,
      Crying: `${petName} is feeling down.`,
      Moping: `${petName} isn't having a great day.`,
      Angry: `${petName} is frustrated by unmet needs.`,
      Annoyed: `Something is bothering ${petName}.`,
      Refusing: `${petName} is unhappy and doesn't want to cooperate.`,
      "Life Support": `${petName} is in very poor condition and needs help immediately.`,
      Fever: `${petName} is feeling sick and needs some care.`,
      Coma: `${petName} has been neglected for too long and needs immediate care.`,
      Surprised: `${petName} is surprised`
    };
    return descriptions[activity] ?? `${petName} is doing its own thing at the moment.`;
  }
  function getPetStats(pet) {
    const problems = [];
    const totalStats = pet.hunger + pet.energy + pet.social + pet.hygiene + pet.mood;
    const statMap = [
      { value: pet.hunger, mood: "Hungry" },
      { value: pet.energy, mood: "Tired" },
      { value: pet.social, mood: "Lonely" },
      { value: pet.hygiene, mood: "Uncomfortable" },
      { value: pet.mood, mood: "Sad" }
    ];
    const lowest = [...statMap].sort((a, b) => a.value - b.value)[0];
    if (totalStats <= 150) {
      if (totalStats === 0) {
        return "Neglected";
      }
      if (totalStats <= 50) {
        return "Weary";
      }
      if (totalStats <= 75) {
        return "Sick";
      }
      return lowest.mood;
    } else if (totalStats < 250) {
      if (pet.hunger <= 50)
        problems.push("Hungry");
      if (pet.energy <= 50)
        problems.push("Tired");
      if (pet.social <= 50)
        problems.push("Lonely");
      if (pet.hygiene <= 50)
        problems.push("Uncomfortable");
      if (pet.mood <= 50)
        problems.push("Sad");
      if (problems.length) {
        if (totalStats >= 200 && totalStats < 250) {
          problems.push("Content");
        }
        return pickRandom(problems);
      }
    } else if (totalStats <= 300) {
      if (pet.hunger <= 30)
        problems.push("Hungry");
      if (pet.energy <= 30)
        problems.push("Tired");
      if (pet.social <= 30)
        problems.push("Lonely");
      if (pet.hygiene <= 30)
        problems.push("Uncomfortable");
      if (pet.mood <= 30)
        problems.push("Sad");
      if (problems.length) {
        problems.push("Content");
        return pickRandom(problems);
      }
      return "Content";
    } else if (totalStats < 425) {
      if (pet.hunger <= 15)
        problems.push("Hungry");
      if (pet.energy <= 15)
        problems.push("Tired");
      if (pet.social <= 15)
        problems.push("Lonely");
      if (pet.hygiene <= 15)
        problems.push("Uncomfortable");
      if (pet.mood <= 15)
        problems.push("Sad");
      if (problems.length) {
        problems.push("Content");
        return pickRandom(problems);
      }
      return "Content";
    }
    if (totalStats >= 425) {
      return "Happy";
    }
    return "Content";
  }
  function rollPetActivity(pet) {
    const mood = getPetStats(pet);
    switch (mood) {
      case "Happy":
        return pickRandom([
          "Dancing",
          "Excited"
        ]);
      case "Content":
        return pickRandom([
          "Relaxing",
          "Observing",
          "Box",
          "Box2",
          "Box3",
          "Shy",
          "Paw"
        ]);
      case "Tired":
        return pickRandom([
          "Yawning",
          "Sleeping"
        ]);
      case "Lonely":
        return pickRandom([
          "Waiting",
          "Staring"
        ]);
      case "Hungry":
        return pickRandom([
          "Angry",
          "Annoyed",
          "Refusing"
        ]);
      case "Mad":
        return pickRandom([
          "Angry",
          "Annoyed",
          "Refusing"
        ]);
      case "Uncomfortable":
        return pickRandom([
          "Angry",
          "Annoyed",
          "Crying",
          "Surprised"
        ]);
      case "Sad":
        return pickRandom([
          "Moping",
          "Crying"
        ]);
      case "Sick":
        return pickRandom([
          "Fever"
        ]);
      case "Weary":
        return pickRandom([
          "Life Support"
        ]);
      case "Neglected":
        return pickRandom([
          "Coma"
        ]);
      default:
        return "Content";
    }
  }
  function updatePetActivity(pet) {
    const now = Date.now();
    const mood = getPetStats(pet);
    const moodChanged = pet.currentMood !== mood;
    const activityExpired = !pet.activityChangedAt || now - pet.activityChangedAt > 3e5;
    if (moodChanged || activityExpired || !pet.activity) {
      pet.activity = rollPetActivity(pet);
      pet.activityChangedAt = now;
      pet.currentMood = mood;
      savePet(pet);
    }
  }
  function updatePetUI(pet) {
    updatePetActivity(pet);
    updateEffectsUI(pet);
    const mood = getPetStats(pet);
    const activity = pet.activity;
    const moodTooltip = document.getElementById("moodTooltip");
    if (moodTooltip) {
      moodTooltip.innerHTML = `
      <strong>${mood}</strong>
      ${getPetGuidance(pet)}<br><br>
      <strong>Stats:</strong>
      Hunger: ${Math.round(pet.hunger)}%<br>
      Energy: ${Math.round(pet.energy)}%<br>
      Social: ${Math.round(pet.social)}%<br>
      Hygiene: ${Math.round(pet.hygiene)}%<br>
      Mood: ${Math.round(pet.mood)}%
    `;
    }
    const activityTooltip = document.getElementById("activityTooltip");
    if (activityTooltip) {
      activityTooltip.innerHTML = `
      <strong>${activity || "Idle"}</strong>
      ${getActivityDescription(activity, pet)}
    `;
    }
    const moodEl = document.getElementById("petMood");
    if (moodEl) {
      const label = moodEl.querySelector(".pet-label");
      if (label) {
        label.textContent = mood;
      }
    }
    const activityEl = document.getElementById("petActivity");
    if (activityEl) {
      const label = activityEl.querySelector(".pet-label");
      if (label) {
        label.textContent = activity || "Idle";
      }
    }
    switch (activity) {
      default:
        setPetState("idle2");
        break;
      // Happy:
      case "Dancing":
        setPetState("dance");
        break;
      case "Excited":
        setPetState("excited");
        break;
      // Content: 
      case "Relaxing":
        setPetState("laydown");
        break;
      case "Observing":
        setPetState("idle2");
        break;
      case "Box":
        setPetState("box");
        break;
      case "Box2":
        setPetState("box2");
        break;
      case "Box3":
        setPetState("box3");
        break;
      case "Shy":
        setPetState("shy");
        break;
      case "Paw":
        setPetState("paw");
        break;
      // Tired:
      case "Yawning":
        setPetState("sleepy");
        break;
      case "Sleeping":
        setPetState("sleep");
        break;
      // Lonely:
      case "Staring":
        setPetState("idle");
        break;
      case "Waiting":
        setPetState("waiting");
        break;
      // Sad:
      case "Moping":
        setPetState("sad");
        break;
      case "Crying":
        setPetState("cry");
        break;
      // Sick:
      case "Life Support":
        setPetState("sick1");
        break;
      case "Fever":
        setPetState("sick2");
        break;
      case "Coma":
        setPetState("dead");
        break;
      // Mad:
      case "Angry":
        setPetState("angry");
        break;
      case "Annoyed":
        setPetState("annoyed");
        break;
      case "Refusing":
        setPetState("refusing");
        break;
      // Other:
      case "Eating":
        setPetState("eating");
        break;
      case "Surprised":
        setPetState("surprised");
        break;
    }
    console.log("[PET]", "Mood:", mood, "Activity:", activity);
  }
  function setPetState(state2) {
    startPetAnimation(state2);
    console.log("[PET] Animation:", state2);
  }
  function startPetAnimation(animation = "idle") {
    const petSprite = document.getElementById("petSprite");
    if (!petSprite) return;
    const config = PET_ANIMATIONS[animation];
    if (!config) return;
    if (!config.frames) return;
    if (animationInterval) {
      clearInterval(animationInterval);
    }
    petSprite.style.backgroundImage = `url("../popup/assets/cat/${config.sheet}")`;
    petSprite.style.width = `${config.width ?? 96}px`;
    petSprite.style.height = `${config.height ?? 96}px`;
    const frameWidth = config.frameWidth ?? 96;
    const frameHeight = config.frameHeight ?? 96;
    const row = config.row ?? 0;
    const startFrame = config.startFrame ?? 0;
    let scale = 1;
    if (config.sheet === "AnimationSheet.png") {
      scale = 3;
      petSprite.style.backgroundSize = `${512 * scale}px ${800 * scale}px`;
    } else {
      petSprite.style.backgroundSize = "";
    }
    let frame = 0;
    const initialX = startFrame * frameWidth * scale;
    const initialY = row * frameHeight * scale;
    petSprite.style.backgroundPosition = `-${initialX}px -${initialY}px`;
    animationInterval = setInterval(() => {
      const currentFrame = startFrame + frame;
      const x = currentFrame * frameWidth * scale;
      const y = row * frameHeight * scale;
      petSprite.style.backgroundPosition = `-${x}px -${y}px`;
      frame = (frame + 1) % config.frames;
    }, 150);
    console.log("[PET]", {
      animation,
      row,
      frameWidth,
      frameHeight,
      startFrame,
      frames: config.frames
    });
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
  var CARE_PRICE = 10;
  function careForPet(pet) {
    if (pet.dailyCareUses <= 0) {
      return {
        success: false,
        reason: "No daily care uses remaining."
      };
    }
    pet.dailyCareUses--;
    pet.hunger = Math.min(100, pet.hunger + 10);
    pet.hygiene = Math.min(100, pet.hygiene + 10);
    pet.energy = Math.min(100, pet.energy + 10);
    pet.social = Math.min(100, pet.social + 10);
    pet.mood = Math.min(100, pet.mood + 10);
    return {
      success: true,
      price: CARE_PRICE
    };
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
  var MAX_DAILY_READING_REWARDS = 10;
  function resetDailyRewards(pet) {
    const now = Date.now();
    const lastReset = new Date(pet.lastReadingReset || now);
    const today = new Date(now);
    if (lastReset.toDateString() !== today.toDateString()) {
      pet.dailyReadingRewards = 0;
      pet.lastReadingReset = now;
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
  function getActiveEffects(pet) {
    const modifiers = [];
    const passives = [];
    const coinMultiplier = getMoodCoinMultiplier(pet);
    if (coinMultiplier > 1) {
      modifiers.push(
        `Happy Mood (+${Math.round((coinMultiplier - 1) * 100)}% Coin Rewards)`
      );
    }
    if (coinMultiplier < 1) {
      modifiers.push(
        `Low Mood (-${Math.round((1 - coinMultiplier) * 100)}% Coin Rewards)`
      );
    }
    passives.push(
      "Reading sessions grant +1 Mood and +1 Social"
    );
    passives.push(
      `Daily Reading Rewards Remaining: ${MAX_DAILY_READING_REWARDS - pet.dailyReadingRewards}/${MAX_DAILY_READING_REWARDS}`
    );
    return {
      activeCount: modifiers.length,
      passiveCount: passives.length,
      totalCount: modifiers.length + passives.length,
      modifiers,
      passives
    };
  }
  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }
  function updateEffectsUI(pet) {
    const effectsEl = document.getElementById("petEffects");
    if (!effectsEl) return;
    const effects = getActiveEffects(pet);
    effectsEl.innerHTML = `
    Effects: ${effects.totalCount}
    <div id="effectsTooltip" class="effects-tooltip">
      <strong>Active Effects (${effects.activeCount})</strong>

      ${effects.modifiers.length ? effects.modifiers.map((effect) => `<div>\u2022 ${effect}</div>`).join("") : "<div>\u2022 No active effects.</div>"}
      <br>
      <strong>Passive Effects (${effects.passiveCount})</strong>
      ${effects.passives.length ? effects.passives.map((effect) => `<div>\u2022 ${effect}</div>`).join("") : "<div>\u2022 No passive effects.</div>"}
    </div>
  `;
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
  window.testPetAnimation = (animation) => {
    console.log("Testing animation:", animation);
    setPetState(animation);
  };
  window.listPetAnimations = () => {
    console.table(Object.keys(PET_ANIMATIONS));
    const img = new Image();
    img.src = "assets/cat/AnimationSheet.png";
    img.onload = () => {
      console.log(img.width, img.height);
    };
  };

  // popup/shopItems.js
  var SHOP_ITEMS = {
    Food: [
      {
        id: "catfood",
        name: "Kibble",
        price: 8,
        icon: "assets/food/kibble.png",
        description: "+6 Hunger",
        effects: {
          hunger: 6
        }
      },
      {
        id: "burger",
        name: "Burger",
        price: 15,
        icon: "assets/food/burger.png",
        description: "+8 Hunger, +2 Mood",
        effects: {
          hunger: 8,
          mood: 2
        }
      },
      {
        id: "pizzaSlice",
        name: "Pizza Slice",
        price: 15,
        icon: "assets/food/pizzaSlice.png",
        description: "+8 Hunger, +2 Mood",
        effects: {
          hunger: 8,
          mood: 2
        }
      },
      {
        id: "soda",
        name: "Can of Soda",
        price: 16,
        icon: "assets/food/soda.png",
        description: "+2 Hunger, +8 energy",
        effects: {
          hunger: 2,
          energy: 8
        }
      },
      {
        id: "sushi",
        name: "Sushi",
        price: 25,
        icon: "assets/food/sushi.png",
        description: "+15 Hunger, +5 Mood",
        effects: {
          hunger: 15,
          mood: 5
        }
      },
      {
        id: "magicPotion3",
        name: "Green Magic Potion",
        price: 99,
        icon: "assets/items/magicPotion3.png",
        description: "+75 hunger",
        effects: {
          hunger: 75
        }
      }
    ],
    Toys: [
      {
        id: "pinkBall",
        name: "Pink ball",
        price: 8,
        icon: "assets/items/pinkBall.png",
        description: "+1 Social, +3 mood",
        effects: {
          mood: 3,
          social: 1
        }
      },
      {
        id: "stick",
        name: "Stick",
        price: 15,
        icon: "assets/items/stick.png",
        description: "+10 Social, +4 mood",
        effects: {
          mood: 4,
          social: 10
        }
      },
      {
        id: "mouse",
        name: "Toy Mouse",
        price: 25,
        icon: "assets/items/mouse.png",
        description: "+18 Social, +6 mood",
        effects: {
          mood: 6,
          social: 18
        }
      },
      {
        id: "tower",
        name: "Tower",
        price: 42,
        icon: "assets/items/tower.png",
        description: "+22 Social, +5 mood",
        effects: {
          mood: 5,
          social: 22
        }
      },
      {
        id: "magicPotion2",
        name: "Pink Magic Potion",
        price: 99,
        icon: "assets/items/magicPotion2.png",
        description: "+50 Social, +50 mood",
        effects: {
          mood: 50,
          social: 50
        }
      }
    ],
    Hygiene: [
      {
        id: "soap",
        name: "Soap",
        price: 6,
        icon: "assets/items/soap.png",
        description: "+5 Hygiene",
        effects: {
          hygiene: 5
        }
      },
      {
        id: "toothBrush",
        name: "Tooth Brush",
        price: 15,
        icon: "assets/items/toothBrush.png",
        description: "+12 Hygiene",
        effects: {
          hygiene: 12
        }
      },
      {
        id: "bed",
        name: "Basic Bed",
        price: 20,
        icon: "assets/items/CatBedBlue.png",
        description: "+15 Energy",
        effects: {
          energy: 15
        }
      },
      {
        id: "magicPotion1",
        name: "Blue Magic Potion",
        price: 99,
        icon: "assets/items/magicPotion1.png",
        description: "+50 Hygiene, +50 Energy",
        effects: {
          hygiene: 50,
          energy: 50
        }
      }
    ],
    Accessories: [],
    Decor: []
  };

  // popup/shop.js
  function buyItem(pet, state2, item, quantity = 1) {
    pet.inventory ??= [];
    const totalCost = item.price * quantity;
    if (state2.coins < totalCost) {
      return false;
    }
    state2.coins -= totalCost;
    state2.totalCoinsSpent ??= 0;
    state2.totalCoinsSpent += totalCost;
    const existing = pet.inventory.find(
      (i) => i.id === item.id
    );
    if (existing) {
      existing.quantity ??= 0;
      existing.quantity += quantity;
    } else {
      pet.inventory.push({
        id: item.id,
        name: item.name,
        icon: item.icon,
        description: item.description,
        price: item.price,
        effects: item.effects,
        quantity
      });
    }
    return true;
  }
  function renderShopCategory(category, pet, state2) {
    console.log("[SHOP] Category:", category);
    const shopGrid = document.getElementById("shopGrid");
    if (!shopGrid) return;
    console.log("[SHOP] Grid:", shopGrid);
    if (category === "Accessories") {
      shopGrid.innerHTML = `
      <div class="shop-coming-soon">
        <strong>Accessories Coming Soon</strong>
      </div>`;
      return;
    }
    if (category === "Decor") {
      shopGrid.innerHTML = `
      <div class="shop-coming-soon">
        <strong>Room + Decor Coming Soon</strong>
      </div>`;
      return;
    }
    const items = SHOP_ITEMS[category] || [];
    console.log("[SHOP] Items:", items);
    shopGrid.innerHTML = items.map((item) => `
    <button class="shop-item" data-item="${item.id}">
      <span class="shop-item-icon">
        <img src="${item.icon}" alt="${item.name}">
      </span>
      <div>
        <strong>${item.name}</strong>
        <small>${item.description}</small>
      </div>

      <small><i>$</i>${item.price}</small>
    </button>
  `).join("");
    shopGrid.querySelectorAll(".shop-item").forEach((button) => {
      button.addEventListener("click", () => {
        const itemId = button.dataset.item;
        const item = items.find((i) => i.id === itemId);
        if (!item) return;
        const details = document.getElementById("shopDetails");
        if (!details) return;
        details.classList.remove("hidden");
        details.innerHTML = `
          <div class="shop-details-header">
            <img src="${item.icon}" alt="${item.name}">
            <h4>${item.name}</h4>
          </div>

          <p>${item.description}</p>
          <p>Price: $${item.price}</p>

          <div class="shop-buy-actions">
            <button id="buyOne">
              Buy 1
            </button>

            <button id="buyFive">
              Buy 5
            </button>
          </div>`;
        document.getElementById("buyOne")?.addEventListener(
          "click",
          () => {
            purchaseItem(item, 1, state2);
          }
        );
        document.getElementById("buyFive")?.addEventListener(
          "click",
          () => {
            purchaseItem(item, 5, state2);
          }
        );
      });
    });
  }
  function showShopMessage(text) {
    const msg = document.getElementById("shopMessage");
    document.getElementById("shopMessage")?.classList.remove("hidden");
    if (!msg) return;
    msg.textContent = text;
    setTimeout(() => {
      if (msg.textContent === text) {
        msg.textContent = "";
        document.getElementById("shopMessage")?.classList.add("hidden");
      }
    }, 3e3);
  }
  function purchaseItem(item, quantity, state2) {
    loadPet((pet) => {
      const success = buyItem(pet, state2, item, quantity);
      if (!success) {
        showShopMessage("Not enough coins!");
        return;
      }
      savePet(pet);
      chrome.storage.sync.set({
        coins: state2.coins,
        totalCoinsSpent: state2.totalCoinsSpent
      });
      updateCoinsUI(state2);
      renderInventory(pet);
      showShopMessage(`Purchased ${quantity} ${item.name}!`);
    });
  }
  function updateCoinsUI(state2) {
    const petCoins = document.getElementById("petCoins");
    const shopCoins = document.getElementById("shopCoins");
    if (petCoins) {
      petCoins.textContent = state2.coins;
    }
    if (shopCoins) {
      shopCoins.textContent = state2.coins;
    }
  }
  function renderInventory(pet) {
    const container = document.getElementById("inventoryList");
    const details = document.getElementById("inventoryDetails");
    if (!container) return;
    if (!pet.inventory || pet.inventory.length === 0) {
      container.innerHTML = "No items owned.";
      if (details) {
        details.innerHTML = "Select an item.";
      }
      return;
    }
    container.innerHTML = pet.inventory.map((item) => `
    <button class="inventory-item" data-item="${item.id}">
      <span>
        <img class="inventory-icon" src="${item.icon}" alt="${item.name}">
        ${item.name}
      </span>
      <span>x${item.quantity}</span>
    </button>
  `).join("");
    container.querySelectorAll(".inventory-item").forEach((button) => {
      button.addEventListener("click", () => {
        const itemId = button.dataset.item;
        const item = pet.inventory.find(
          (i) => i.id === itemId
        );
        if (!item || !details) {
          return;
        }
        details.innerHTML = `
            <h4>
              <span>
                <img class="inventory-icon" src="${item.icon}" alt="${item.name}">
                ${item.name}
              </span>
            </h4>
            <p>${item.description}</p>
            <p>Owned: ${item.quantity}</p>
            <button id="useItem">
              Use Item
            </button>`;
        document.getElementById("useItem")?.addEventListener("click", () => {
          const success = useInventoryItem(pet, item.id);
          if (!success) {
            return;
          }
          renderInventory(pet);
          renderPet(pet);
          updatePetUI(pet);
          details.innerHTML = "<p>Item used!</p>";
        });
      });
    });
  }
  function useInventoryItem(pet, itemId) {
    pet.inventory ??= [];
    const item = pet.inventory.find((i) => i.id === itemId);
    if (!item) {
      return false;
    }
    Object.entries(item.effects || {}).forEach(
      ([stat, amount]) => {
        if (typeof pet[stat] === "number") {
          pet[stat] = Math.min(100, pet[stat] + amount);
        }
      }
    );
    item.quantity--;
    if (item.quantity <= 0) {
      pet.inventory = pet.inventory.filter((i) => i.id !== itemId);
    }
    savePet(pet);
    return true;
  }
  function spendCoins(amount, callback) {
    chrome.storage.sync.get(["coins"], (state2) => {
      state2.coins ??= 0;
      if (state2.coins < amount) {
        callback(false);
        return;
      }
      state2.coins -= amount;
      chrome.storage.sync.set({
        coins: state2.coins
      }, () => {
        callback(true, state2);
      });
    });
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
    currentPageChars: 0,
    // current page character count
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
    pageXpmap: /* @__PURE__ */ new Set(),
    completedPages: /* @__PURE__ */ new Set(),
    // Leveling system
    level: 1,
    xp: 0,
    required: 0,
    // Coin system
    coins: 15,
    // current balance + start with 15
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
    currentChunk: [],
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

  // popup/popupSession.js
  function initSessions() {
    document.getElementById("openSessionArticle")?.addEventListener("click", () => {
      const url = document.getElementById("openSessionArticle")?.dataset.url;
      if (!url) return;
      chrome.tabs.update({
        url,
        active: true
      });
      window.close();
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
        completedPages: window.resumeSession?.completedPages || [],
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
      btn.className = "sessions-item";
      btn.innerHTML = `
        <span class="sessions-dot sessions-${index % 5}"></span>

        <span>
            <strong>${session.title}</strong>
            <br>
            <small>
            ${count} session${count !== 1 ? "s" : ""}
            </small>
        </span>

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
            metaEl.textContent = `${session.wordsRead || 0} words read \u2022 ${session.xpGained || 0} XP earned \u2022 ${session.percentComplete || 0}% complete \u2022 Page ${(session.currentPage ?? 0) + 1}`;
          }
        });
      }
    );
  }
  function showSessionSummary(session) {
    const title = document.getElementById("sessionsNextTitle");
    const meta = document.getElementById("sessionsNextMeta");
    const openBtn = document.getElementById("openSessionArticle");
    if (!title || !meta) return;
    title.textContent = session.title;
    meta.textContent = `${session.wordsRead || 0} words \u2022 ${session.xpGained || 0} XP earned \u2022 ${session.sessionCount || 1} sessions  \u2022 ${session.percentComplete || 0}% complete`;
    if (openBtn) {
      if (session.url) {
        openBtn.dataset.url = session.url;
        openBtn.classList.remove("hidden");
      } else {
        openBtn.classList.add("hidden");
      }
    }
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
    const articleTitle = $(".article-title");
    if (articleTitle) {
      articleTitle.textContent = title;
    }
  }
  function initPetUI() {
    $("#carePet")?.addEventListener("click", () => {
      console.log("[PET] Care button clicked");
      loadPet((pet) => {
        const result = careForPet(pet);
        if (!result.success) {
          alert(result.reason);
          return;
        }
        spendCoins(result.price, (success, state2) => {
          if (!success) {
            alert("Not enough coins.");
            return;
          }
          savePet(pet);
          updatePetUI(pet);
          renderPet(pet);
          updateCoinsUI(state2);
        });
      });
    });
    $("#savePetName")?.addEventListener("click", () => {
      const input = document.getElementById("petNameInput");
      const name = input?.value?.trim();
      if (!name || name.length < 2) {
        alert("Please enter a name at least 2 characters long.");
        return;
      }
      loadPet((pet) => {
        pet.name = name.substring(0, 20);
        savePet(pet);
        input.value = "";
        renderPet(pet);
        updatePetUI(pet);
      });
    });
    $("#openInventory")?.addEventListener("click", () => {
      loadPet((pet) => {
        renderInventory(pet);
        document.getElementById("inventoryPanel")?.classList.toggle("hidden");
      });
    });
    document.addEventListener("click", (e) => {
      const petEffects = $("#petEffects");
      if (petEffects && petEffects.contains(e.target)) {
        $("#effectsTooltip")?.classList.toggle("visible");
        e.stopPropagation();
        return;
      }
      $("#effectsTooltip")?.classList.remove("visible");
    });
  }
  function initShopUI() {
    loadPet((pet) => {
      chrome.storage.sync.get(
        ["coins", "totalCoinsSpent"],
        (state2) => {
          state2.coins ??= 0;
          state2.totalCoinsSpent ??= 0;
          renderShopCategory("Food", pet, state2);
          $$(".shop-categories button").forEach((btn) => {
            btn.addEventListener("click", () => {
              $$(".shop-categories button").forEach((b) => b.classList.remove("active"));
              btn.classList.add("active");
              const details = document.getElementById("shopDetails");
              details.classList.add("hidden");
              const category = btn.dataset.shop;
              chrome.storage.sync.get(
                ["coins", "totalCoinsSpent"],
                (freshState) => {
                  freshState.coins ??= 0;
                  freshState.totalCoinsSpent ??= 0;
                  renderShopCategory(category, pet, freshState);
                }
              );
            });
          });
        }
      );
    });
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
      console.log("[PET] Rendering:", pet);
      updatePetUI(pet);
      renderPet(pet);
      renderInventory(pet);
    });
    chrome.storage.sync.get(
      ["coins", "totalCoinsEarned", "totalCoinsSpent"],
      (state2) => {
        state2.coins ??= 15;
        state2.totalCoinsEarned ??= 15;
        state2.totalCoinsSpent ??= 0;
        chrome.storage.sync.set({
          coins: state2.coins,
          totalCoinsEarned: state2.totalCoinsEarned,
          totalCoinsSpent: state2.totalCoinsSpent
        });
        updateCoinsUI(state2);
      }
    );
  });
})();
