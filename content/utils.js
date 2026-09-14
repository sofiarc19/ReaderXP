
export function normalizeWhitespace(str) {
  return str.replace(/\s+/g, " ").trim();
}

export function $(selector) {
  return document.querySelector(selector);
}

export function $all(selector) {
  return document.querySelectorAll(selector);
}

export function isEmpty(str) {
  return !str || str.trim().length === 0;
}

export function debug(...args) {
  if (window.__DEBUG__) console.log("[DEBUG]", ...args);
}

export function debounce(fn, delay = 100) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
