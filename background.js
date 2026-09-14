let lastSelection = "";

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "store-selection") {
    lastSelection = msg.text || "";
    console.log("[DEBUG] Stored selection:", lastSelection.slice(0, 200));
    return;
  }

  if (msg.action === "get-selection") {
    console.log("[DEBUG] Returning selection:", lastSelection.slice(0, 200));
    sendResponse({ text: lastSelection });
    return true;
  }
});