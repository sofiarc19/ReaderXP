// Tracks whether blur mode is currently active
export let blurEnabled = false;

export function toggleBlur() {
  // Flip blur state on/off
  blurEnabled = !blurEnabled;

  if (blurEnabled) {
    // Apply global blur class to the page
    document.body.classList.add("fr-blur-all");

  } else {
    // Remove blur from the page
    document.body.classList.remove("fr-blur-all");

    // When reader turns off, add session duration to total time
    if (!blurEnabled) {
      state.timeSpentMs += Date.now() - state.timeStarted;
        console.log("[READER] Session ended. Duration:", sessionMs, "ms");
      console.log("Time spent (ms):", state.timeSpentMs);
    }

    // If the reader bar exists, remove it when blur is turned off
    const bar = document.getElementById("reader-area-bar");
    if (bar) bar.remove(); 
  }
}

export function startObserver() {
  function attachObserver() {
      // Wait until <body> exists before attaching the observer
    if (!document.body) {
      // Try again shortly
      setTimeout(attachObserver, 50);
      return;
    }

    let scheduled = false;
    // Watch for DOM changes
    const observer = new MutationObserver(() => {
      // Prevent rapid repeated triggers
      if (scheduled) return;
      scheduled = true;

      // Debounce mutation handling
      setTimeout(() => {
        scheduled = false;
      }, 100);
    });

    // Observe additions/removals anywhere in the document
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Begin observer setup
  attachObserver();
}