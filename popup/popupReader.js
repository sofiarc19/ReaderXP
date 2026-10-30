import {api, $, $$, getActiveTab, sendMessageToTab, ensureContentScript, sendToReader} from "./popupUtils";
import {popupSettings, applyPopupStyle, applyPopupTheme} from "./popupSettings"
import {resumeReadingPage} from "../content/summary"

export function initReader(){
    //Load saved settings (apply to popup UI only — page gets them on Play / change)
    api.storage.sync.get(["font", "fontSize", "theme", "bionic"], (data) => {
    popupSettings.font = data.font || "sans-serif";
    popupSettings.fontSize = Number(data.fontSize) || 16;
    popupSettings.theme = data.theme || "theme-light";
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
        $("#reader-status").textContent =
        "Reading paused";

        $("#reader-pause-popup")
        ?.classList.add("hidden");

        $("#reader-resume-popup")
        ?.classList.remove("hidden");

        sendToReader("pause-reader");

        chrome.storage.sync.set({
        isPaused: true,
        pausedAt: Date.now(),
        });
    });


    $("#reader-resume-popup")
    ?.addEventListener("click", () => {
        $("#reader-status").textContent =
        "Reading now";

        $("#reader-resume-popup")
        ?.classList.add("hidden");

        $("#reader-pause-popup")
        ?.classList.remove("hidden");
        resumeReadingPage();
        sendToReader("resume-reader");

        chrome.storage.sync.set({
        isPaused: false,
        });
    });

    $("#reader-finish-popup")
    ?.addEventListener("click", () => {
        sendToReader("finish-reader");
    });

    $("#reader-aa")?.addEventListener("click", () => {
    document
        .querySelector(".reader-settings")
        ?.classList.toggle("hidden");

        // Hide stats if open 
        document
        .querySelector("#all-reader-stats")
        ?.classList.add("hidden");
    });

    $("#reader-alltime-stats")?.addEventListener("click", () => {
    document
        .querySelector("#all-reader-stats")
    ?.classList.remove("hidden");

    // Hide aa if open 
    document
        .querySelector(".reader-settings")
        ?.classList.add("hidden");
    });

    // Close
    $("#closePopover")?.addEventListener("click", () => {
        window.close();
    });
}

export function updateReaderPopupStats() {
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
        "sessionReadingcoins",
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

        // Keep pause/resume buttons in sync
        if (data.isPaused) {
            $("#reader-pause-popup")
            ?.classList.add("hidden");

            $("#reader-resume-popup")
            ?.classList.remove("hidden");
        } else {
            $("#reader-pause-popup")
            ?.classList.remove("hidden");

            $("#reader-resume-popup")
            ?.classList.add("hidden");
        }

        const xp = data.sessionXp || 0;
        const words = data.wordsReadSoFar || 0;
        // const sessionCoins= data.sessionReadingcoins || 0;
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

        const progress =
            data.percentComplete || 0;

        document.getElementById(
            "reader-progress-popup"
        ).style.width = `${progress}%`;
         
        //  document.getElementById(
        //     "reader-coin-popup"
        // ).style.width = `${sessionCoins}`;
    });
}

export function updateLifeTimeStats(){
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
    });
}

export async function validateReaderState() {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    try {
        const response =
        await sendMessageToTab(tab.id, {
            action: "reader-active",
        });
        if (!response?.active) {
        chrome.storage.sync.set({
            readingActive: false,
            isPaused: false,
        });
        $("#reader-active-popup")
            ?.classList.add("hidden");
        $("#reader-prestart")
            ?.classList.remove("hidden");
        }
    } catch {
        chrome.storage.sync.set({
        readingActive: false,
        isPaused: false,
        });
    }
}