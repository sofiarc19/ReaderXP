// content/textExtraction.js

// Check if a node is inside the extension's reader UI (exclude from extraction)
export function isInsideExtensionUI(el) {
  return el.closest("#reader-area-bar");
}

export function extractAllText(excludedIds = [], excludedClasses = []) {
  // Common selectors to ignore (headers, nav, ads, sidebars, etc.)
  const commonExcluded = [
    "header", "nav", "footer", "aside",
    "#extension-box", "#reader-area-bar",
    ".sidebar", ".menu", ".toolbar", ".ruler",
    ".infobox", ".metadata", ".reference", ".navbox",
    ".subscription", ".login", ".advertisement", ".promo",
    ".related", ".share", ".toc", ".mw-jump-link"
  ];

  // Combine user‑provided exclusions with built‑in ones
  const allExcluded = [
    ...excludedIds.map(id => `#${CSS.escape(id)}`),
    ...excludedClasses.map(cls => `.${CSS.escape(cls)}`),
    ...commonExcluded
  ];

  // Prefer main content containers; fallback to body
  const roots = document.querySelectorAll(
    "article, main, #content, .content, .mw-parser-output, .post, .entry-content, .document-content"
  );
  const walkerRoots = roots.length ? roots : [document.body];

  let text = "";

  for (const root of walkerRoots) {
    // TreeWalker to collect visible text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const t = node.textContent.trim();
        if (!t) return NodeFilter.FILTER_REJECT;

        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;

        // Skip excluded containers
        for (const sel of allExcluded) {
          if (p.closest(sel)) return NodeFilter.FILTER_REJECT;
        }

        // Skip captions, tables, alt/aria text
        if (p.closest("figcaption, caption, table, th, td"))
          return NodeFilter.FILTER_REJECT;

        if (p.hasAttribute("aria-label") || p.hasAttribute("alt"))
          return NodeFilter.FILTER_REJECT;

        // Skip link fragments, footnotes, coordinates, IPA, tiny UI text
        if (p.closest("a")) {
          if (/^\[\w+\]$/.test(t)) return NodeFilter.FILTER_REJECT; // footnotes
          if (/°/.test(t)) return NodeFilter.FILTER_REJECT; // coordinates
          if (/^\/.*\/$/.test(t)) return NodeFilter.FILTER_REJECT; // IPA
          if (t.length < 3) return NodeFilter.FILTER_REJECT; // UI fragments
        }

        // Skip hidden elements
        const style = window.getComputedStyle(p);
        if (style.display === "none" || style.visibility === "hidden")
          return NodeFilter.FILTER_REJECT;

        // Skip non‑content tags
        const tag = p.tagName.toLowerCase();
        if (["script", "style", "noscript", "svg", "math", "meta", "link"].includes(tag))
          return NodeFilter.FILTER_REJECT;

        // Skip extremely short fragments
        if (t.length < 10) return NodeFilter.FILTER_REJECT;

        // Skip common UI phrases
        if (/^(Create your free account|Subscribe|Login|Register|Share|Download|Jump to|Navigation|From Wikipedia|Contents|Tools|Languages)/i.test(t))
          return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    // Collect accepted text nodes
    let node;
    while ((node = walker.nextNode())) {
      text += " " + node.textContent;
    }
  }

  // Project Gutenberg cleanup
  if (location.hostname.includes("gutenberg.org")) {
    const start = text.match(/START OF THE PROJECT GUTENBERG EBOOK/i);
    if (start) text = text.slice(start.index + start[0].length);
    text = text.replace(/END OF THE PROJECT GUTENBERG EBOOK[\s\S]+$/i, "");
    text = text.replace(/Project Gutenberg License[\s\S]+?www\.gutenberg\.org/gi, "");
  }

  // Wikipedia cleanup
  if (location.hostname.includes("wikipedia.org")) {
    text = text.replace(/^From Wikipedia, the free encyclopedia/i, "");
    text = text.replace(/^\s*This article is about[\s\S]+?(?=\b[A-Z])/i, "");
    text = text.replace(/\b\(born\b.*?\)|\b\(died\b.*?\)/gi, "");
    text = text.replace(/References[\s\S]+$/i, "");
    text = text.replace(/External links[\s\S]+$/i, "");
    text = text.replace(/See also[\s\S]+$/i, "");
  }

  // General cleanup
  text = text.replace(/\s*,\s*,/g, ",");
  text = text.replace(/\s{2,}/g, " ");

  return text.trim();
}