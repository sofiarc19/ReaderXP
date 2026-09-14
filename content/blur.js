export let blurEnabled = false;

export function toggleBlur() {
  blurEnabled = !blurEnabled;

  if (blurEnabled) {
    document.body.classList.add("fr-blur-all");
  } else {
    document.body.classList.remove("fr-blur-all");
    const bar = document.getElementById("reader-area-bar");
    if (bar) bar.remove(); //closing the reader
  }
}

export function startObserver() {
  function attachObserver() {
    if (!document.body) {
      // Try again shortly
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