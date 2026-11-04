import { api, getActiveTab, ensureContentScript, sendMessageToTab } from "./popupUtils";
import {loadHistory} from "../content/sessions";
import {popupSettings} from "./popupSettings";

export function initSessions(){
    //doesnt do anything atm
    document
    .getElementById("refreshHistory")?.addEventListener("click", () => {
        loadHistory((history) => {
        console.log("[HISTORY]", history);
        renderSessionList(history);
        });
    });
    document.getElementById("openSessionArticle")
        ?.addEventListener("click", async () => {

        const url = document.getElementById("openSessionArticle")?.dataset.url;
        if (!url) return;
        const tab = await getActiveTab();

        if (tab?.id) {
            chrome.tabs.update(tab.id, { url });
        }
    });
    // Continue reading btn if there is a previous session
    document
    .getElementById("btn-continue-reading")
    ?.addEventListener("click", async () => {

        const tab = await getActiveTab();

        if (!tab?.id) return;

        const ok = await ensureContentScript(tab.id);

        if (!ok) return;

        const resumePage = window.resumeSession?.currentPage ?? 0;

        const response =
            await sendMessageToTab(tab.id, {
                action: "start-reader",
                resumePage,
                resumePercent:
                window.resumeSession?.percentComplete || 0,
                settings: { ...popupSettings },
            });

        if (response?.ok) {
        document
            .getElementById("reader-previous-sesh")
            ?.classList.add("hidden");

        document
            .getElementById("reader-active-popup")
            ?.classList.remove("hidden");
        }
    });

    loadHistory(renderSessionList);
    
    checkForPreviousSession();
}

// Reading Sessions Render
function renderSessionList(history) {
    const sessionsList = document.getElementById("sessionsList");

    if (!sessionsList) return;
    sessionsList.innerHTML = "";

    history.forEach((session, index) => {
        const btn = document.createElement("button");
        const count = session.sessionCount ?? 1;
        //const xp = session.xpGained ?? 0;

        btn.className = "sessions-item";

        btn.innerHTML = `
        <span class="sessions-dot sessions-${index % 5}"></span>

        <span>
            <strong>${session.title}</strong>
            <small>
            ${count} session${count !== 1 ? "s" : ""}
            </small>
        </span>

        <span>›</span>
        `; 

        btn.addEventListener("click", () => {
        showSessionSummary(session);
        });

        sessionsList.appendChild(btn);
    });
}

// Check to see if there is a previous uncompleted session
export async function checkForPreviousSession() {
    const tab = await getActiveTab();
    const currentUrl = tab?.url;

    if (!currentUrl) return;
    chrome.storage.sync.get(
        ["readingActive"],
        (data) => {

        // Don't show "Continue Reading"
        // if a session is already active
        if (data.readingActive) {
            return;
        }

        loadHistory((history) => {
        const session = history
            .filter((item) => item.url === currentUrl)
            .sort((a, b) => b.lastReadAt - a.lastReadAt)[0];

        if (!session) {
            return;
        }
            
        // Ignore completed sessions
        if (session.status === "completed" ||
            (session.percentComplete || 0) >= 100
        ) {
            return;
        }
            
        window.resumeSession = session;
        console.log("[RESUME SESSION]", session);

        document
            .getElementById("reader-prestart")
            ?.classList.add("hidden");

        document
            .getElementById("reader-previous-sesh")
            ?.classList.remove("hidden");

        const titleEl =
            document.getElementById(
                "resume-title"
            );

        const metaEl =
            document.getElementById(
                "resume-meta"
            );

            if (titleEl) {
                titleEl.textContent = session.title;
            }

            if (metaEl) {
                metaEl.textContent =
                `${session.wordsRead || 0} words read • ` +
                `${session.totalXp || 0} XP earned • ` +
                `${session.percentComplete || 0}% complete • ` +
                 `Page ${(session.currentPage ?? 0) + 1}`;
            }
        });
    });
}
    
// Session Summary 
function showSessionSummary(session) {
    const title = document.getElementById("sessionsNextTitle");

    const meta = document.getElementById("sessionsNextMeta");


    const openBtn = document.getElementById("openSessionArticle");

    if (!title || !meta) return;

    title.textContent = session.title;

    //const xp = session.totalXp ?? session.xpGained ?? 0;

    meta.textContent =
        `${session.wordsRead || 0} words • ` +
        `${session.totalXp || session.xpGained || 0} XP earned • ` +
        `${session.sessionCount || 1} sessions`;

    if (openBtn) {
        if (session.url) {
            openBtn.dataset.url = session.url;
            openBtn.classList.remove("hidden");
        } else {
            openBtn.classList.add("hidden");
        }
    }
}