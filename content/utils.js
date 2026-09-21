// Collapse multiple spaces/newlines into a single space
export function normalizeWhitespace(str) {
  return str.replace(/\s+/g, " ").trim();
}

// Shortcut for querySelector
export function $(selector) {
  return document.querySelector(selector);
}

// Shortcut for querySelectorAll
export function $all(selector) {
  return document.querySelectorAll(selector);
}

// Check if a string is empty or whitespace
export function isEmpty(str) {
  return !str || str.trim().length === 0;
}

// Conditional debug logging
export function debug(...args) {
  if (window.__DEBUG__) console.log("[DEBUG]", ...args);
}

// Debounce: delay function execution until user stops triggering it
export function debounce(fn, delay = 100) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
