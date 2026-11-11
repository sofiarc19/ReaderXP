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
  // Future placeholder for:
  // Detect navigation changes
  // Restore Reader UI
  // Reapply blur mode
  // Save checkpoints
}