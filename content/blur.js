// blur.js turns ReaderXP's reading mode on and off and helps ensure the reader 
// remains isolated from the rest of the webpage.

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

    // If the reader bar exists, remove it when blur is turned off
    const bar = document.getElementById("reader-area-bar");
    if (bar) bar.remove(); 
  }
}


export function startObserver() {
  function attachObserver() {
    // Wait until <body> exists before attaching the observer
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

        const bar = document.getElementById("reader-area-bar");

        // Reader isn't active
        if (!bar) return;

        // Keep reader at top of DOM
        if (bar.parentElement !== document.documentElement) {
          document.documentElement.appendChild(bar);
        } else {
          document.documentElement.appendChild(bar);
        }

        // Reassert z-index in case site scripts mess with it
        bar.style.zIndex = "2147483647";
      }, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  attachObserver();
}