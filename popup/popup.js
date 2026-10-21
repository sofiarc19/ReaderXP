// Normalize Chrome/Firefox extension API
const api = typeof browser !== "undefined" ? browser : chrome;
window.browser = api;

import { loadHistory } from "../content/sessions";

// Utility selectors
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Popup UI settings (synced to storage)
let popupSettings = {
  font: "sans-serif",
  fontSize: 16,
  theme: "theme-dark",
  bionic: false,
};

chrome.tabs.query(
  { active: true, currentWindow: true },
  (tabs) => {
    const title =
      tabs[0]?.title || "Unknown Article";

    const articleTitle =
      document.querySelector(".article-title");

    if (articleTitle) {
      articleTitle.textContent = title;
    }
  }
);

// function renderTopicList(topics) {
//   const topicList = document.getElementById("topicList");

//   if (!topicList) return;

//   topicList.innerHTML = "";

//   topics.forEach((topic, index) => {
//     const btn = document.createElement("button");

//     btn.innerHTML = `
//       <span class="topic-dot topic-${index % 5}"></span>

//       <span>
//         <strong>${topic.name}</strong>
//         <small>
//           ${topic.readings.length} reading${topic.readings.length !== 1 ? "s" : ""}
//         </small>
//       </span>

//       <b>${topic.totalXp}</b>

//       <span>›</span>
//     `;

//     topicList.appendChild(btn);
//   });
// }

// Get the currently active browser tab
function getActiveTab() {
  return new Promise((resolve) => {
    // lastFocusedWindow avoids DevTools/popup confusion
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

// Send a message to a specific tab
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    api.tabs.sendMessage(tabId, message, (response) => {
      const err = api.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(response);
    });
  });
}

// Ensure content script is injected before messaging
async function ensureContentScript(tabId) {
  try {
    await sendMessageToTab(tabId, { action: "ping" });

    await api.scripting.insertCSS({
      target: { tabId, allFrames: true },
      files: ["css/readerArea.css"],
    });

    return true;
  } catch (_) {
    try {
      await api.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ["dist/content.js"],
      });

      await api.scripting.insertCSS({
        target: { tabId, allFrames: true },
        files: ["css/readerArea.css"],
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

// Send a reader-related action to the active tab
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

// Apply popup font + size to popup UI
function applyPopupStyle() {
  const root = document.documentElement;
  root.style.setProperty("--reader-font", popupSettings.font);
  root.style.setProperty("--reader-font-size", popupSettings.fontSize + "px");
}

// Apply popup theme (popup only, not page)
function applyPopupTheme(themeName) {
  const root = document.documentElement;
  root.classList.remove(
    "theme-dark",
    "theme-light",
    "theme-forest"
  );
  root.classList.add(themeName);
}

//Load saved settings (apply to popup UI only — page gets them on Play / change)
api.storage.sync.get(["font", "fontSize", "theme", "bionic"], (data) => {
  popupSettings.font = data.font || "sans-serif";
  popupSettings.fontSize = Number(data.fontSize) || 16;
  popupSettings.theme = data.theme || "theme-dark";
  popupSettings.bionic = data.bionic || false;

  // Update popup controls
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
      $("#reader-prestart")
        ?.classList.add("hidden");

      $("#reader-active-popup")
        ?.classList.remove("hidden");
    }

  }
);

// Tab Switching
$$(".popover-tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".popover-tabs button").forEach((b) =>
      b.classList.remove("active")
    );

    btn.classList.add("active");
    const tab = btn.dataset.tab;

    $$(".tab-panel").forEach((panel) =>
      panel.classList.add("hidden")
    );
    document.querySelector(`.tab-panel[data-panel="${tab}"]`)
    ?.classList.remove("hidden");
  });
});

// Reader Settings Events
$("#font-select")?.addEventListener("change",
  (e) => {
    popupSettings.font = e.target.value;

    api.storage.sync.set({
      font: popupSettings.font,
    });

    applyPopupStyle();

    sendToReader(
      "set-basic-font",
      popupSettings.font
    );
  }
);

$("#font-size")?.addEventListener("change",
  (e) => {
    popupSettings.fontSize =
      Number(e.target.value);

    api.storage.sync.set({
      fontSize: popupSettings.fontSize,
    });

    applyPopupStyle();

    sendToReader(
      "set-font-size",
      popupSettings.fontSize
    );
  }
);

$("#color-theme")?.addEventListener("change",
  (e) => {
    popupSettings.theme = e.target.value;

    api.storage.sync.set({
      theme: popupSettings.theme,
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

$("#set-bionic")?.addEventListener("click", () => {
  popupSettings.bionic = !popupSettings.bionic;

    $("#set-bionic").classList.toggle(
      "active",
      popupSettings.bionic
    );

    api.storage.sync.set({
        bionic: popupSettings.bionic,
    });

    sendToReader(
      "set-bionic",
      popupSettings.bionic
    );
  }
);

// Start Reader
$("#btn-play")?.addEventListener("click",
  async () => {
    let selectedText = "";

    try {
      selectedText =
        await new Promise((resolve) => {
          api.runtime.sendMessage(
          { action: "get-selection" },
          (response) => {
            resolve(response?.text || "");
          }
        );
      });
    } catch (_) {}
    const tab = await getActiveTab();

    if (!tab?.id) return;
    const ok = await ensureContentScript(tab.id);
    if (!ok) return;
    
    try {
      const response = await sendMessageToTab(tab.id, {
        action: "start-reader",
        selectedText,
        settings: { ...popupSettings },
      });
      if (response?.ok) {
        $("#reader-prestart")
        ?.classList.add("hidden");

        $("#reader-active-popup")
        ?.classList.remove("hidden");

        api.storage.sync.set({
          readingActive: true,
        });
      }
    } catch (err) {
      console.warn("[POPUP] start-reader failed:", err.message);
    }
  }
);

// Active Reader Popup
$("#reader-pause-popup")
  ?.addEventListener("click", () => {
    $("#reader-status").textContent = "Reading paused";
    $("#reader-resume-popup")
    ?.classList.remove("hidden");
    sendToReader("pause-reader");
    chrome.storage.sync.set({
      isPaused: true,
    });
});

$("#reader-resume-popup")
  ?.addEventListener("click", () => {
    $("#reader-status").textContent = "Reading now";
    $("#reader-resume-popup")
      ?.classList.add("hidden");
  sendToReader("resume-reader");
  chrome.storage.sync.set({
    isPaused: false,
  });
});

// $("#reader-bookmark-popup")
//   ?.addEventListener("click", () => {
//     sendToReader("bookmark-reader");
// });

$("#reader-finish-popup")
  ?.addEventListener("click", () => {
    sendToReader("finish-reader");
});

//remove aa in reader ui 
$("#reader-aa")?.addEventListener("click", () => {
  document
    .querySelector(".reader-settings")
    ?.classList.toggle("hidden");
});

function updateReaderPopupStats() {
  api.storage.sync.get(
    [
      "sessionXp",
      "coinsGained",
      "coins",
      "wordsReadSoFar",
      "percentComplete",
      "sessionStartedAt",
      "readingActive",
      "articleTitle",
      "isPaused",
      "pausedAt",
      "totalPausedMs",
    ],
    (data) => {

      if (!data.readingActive) return;

      const statusText = data.articleTitle
        ? `Reading: ${data.articleTitle}`
        : "Reading now";

      const status = document.getElementById(
        "reader-status"
      );

      if (data.isPaused) {
        document.getElementById(
          "reader-status"
        ).textContent =
          "Reading paused";
      }
      else if (status) {
        status.textContent = statusText;
      }

      const xp = data.sessionXp || 0;
      //const coins = data.coins || 0;
      const coinsGained = data.coinsGained || 0;
      const words = data.wordsReadSoFar || 0;

      let timeText = "00:00";
      let elapsed = 0;

      if (data.sessionStartedAt) {
        const now = data.isPaused ? (data.pausedAt || Date.now())  : Date.now();
        elapsed = Math.floor(
          (now - data.sessionStartedAt - (data.totalPausedMs || 0)) / 1000
        );
      }

      const mins =
        String(Math.floor(elapsed / 60))
          .padStart(2, "0");

      const secs =
        String(elapsed % 60)
          .padStart(2, "0");
          
      // pause visual timer when paused 
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

      // document.getElementById(
      //   "reader-coin-popup"
      // ).textContent = `Coins earned: ${coins}`;
      document.getElementById(
        "reader-coin-popup"
      ).textContent =
        `${coinsGained}`;
        //🪙
      const progress =
        data.percentComplete || 0;

      document.getElementById(
        "reader-progress-popup"
      ).style.width = `${progress}%`;
    }
  );
}

// Reading Sessions Render
function renderSessionList(history) {
  const topicList =
    document.getElementById("topicList");

  if (!topicList) return;

  topicList.innerHTML = "";

  history.forEach((session, index) => {
    const btn = document.createElement("button");
    const count = session.sessionCount ?? 1;
    const xp = session.totalXp ?? session.xpGained ?? 0;

    btn.className = "topic-item";

    btn.innerHTML = `
      <span class="topic-dot topic-${index % 5}"></span>

      <span>
        <strong>${session.title}</strong>
        <small>
          ${count} session${count !== 1 ? "s" : ""}
        </small>
      </span>

      <b>${xp} XP</b>

      <span>›</span>
    `;

    btn.addEventListener("click", () => {
      showSessionSummary(session);
    });

    topicList.appendChild(btn);
  });
}

// Session Summary 
function showSessionSummary(session) {
  const title =
    document.getElementById("topicNextTitle");

  const meta =
    document.getElementById("topicNextMeta");

  if (!title || !meta) return;

  title.textContent = session.title;

  const xp = session.totalXp ?? session.xpGained ?? 0;

  meta.textContent =
    `${session.wordsRead || 0} words • ` +
    `${xp} XP earned • ` +
    `${session.sessionCount || 1} sessions`;
}

document
  .getElementById("refreshHistory")
  ?.addEventListener("click", () => {
    loadHistory((history) => {
      console.log("[HISTORY]", history);
      renderSessionList(history);
    });
  });

// Pet Panel
$("#carePet")?.addEventListener("click",
  () => {
    const status = $("#petStatus");
    const mood = $("#petMood");
    
    if (
      status.textContent.includes(
      "Wants")
    ) {
      status.textContent =
      "Happy and ready to read";
      mood.textContent = "Full";
    } else {
      status.textContent =
      "Wants to learn with you";
      mood.textContent = "Curious";
    }
  }
);

// Shop
$$(".shop-categories button").forEach(
  
  (btn) => {
    btn.addEventListener("click", () => {
      $$(".shop-categories button")
        .forEach((b) =>
          b.classList.remove("active")
      );
    
      btn.classList.add("active");
      const category = btn.dataset.shop.toLowerCase();
      
      $("#shopCategoryLabel").textContent =`Showing ${category} items`;
    });
  }
);

// Close
$("#closePopover")?.addEventListener("click",
  () => {
    window.close();
  }
);

document.addEventListener("DOMContentLoaded", () => {
  // Reader popup stats
  updateReaderPopupStats();

  setInterval(() => {
    updateReaderPopupStats();
  }, 1000);

  // Reading sessions
  loadHistory((history) => {
    renderSessionList(history);
  });
});