// content/textExtraction.js

// Prevent tree walker from picking up reader area text
export function isInsideExtensionUI(el) {
  return el.closest("#reader-area-bar");
}

export function extractAllText(excludedIds = [], excludedClasses = []) {
  const commonExcluded = [
    "header", "nav", "footer", "aside",
    "#extension-box", "#reader-area-bar",
    ".sidebar", ".menu", ".toolbar", ".ruler",
    ".infobox", ".metadata", ".reference", ".navbox",
    ".subscription", ".login", ".advertisement", ".promo",
    ".related", ".share", ".toc", ".mw-jump-link"
  ];

  const allExcluded = [
    ...excludedIds.map(id => `#${CSS.escape(id)}`),
    ...excludedClasses.map(cls => `.${CSS.escape(cls)}`),
    ...commonExcluded
  ];

  const roots = document.querySelectorAll(
    "article, main, #content, .content, .mw-parser-output, .post, .entry-content, .document-content"
  );
  const walkerRoots = roots.length ? roots : [document.body];

  let text = "";

  for (const root of walkerRoots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const t = node.textContent.trim();
        if (!t) return NodeFilter.FILTER_REJECT;

        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;

        for (const sel of allExcluded) {
          if (p.closest(sel)) return NodeFilter.FILTER_REJECT;
        }

        if (p.closest("figcaption, caption, table, th, td"))
          return NodeFilter.FILTER_REJECT;

        if (p.hasAttribute("aria-label") || p.hasAttribute("alt"))
          return NodeFilter.FILTER_REJECT;

        // Smarter link handling
        if (p.closest("a")) {
          if (/^\[\w+\]$/.test(t)) return NodeFilter.FILTER_REJECT; // footnotes
          if (/°/.test(t)) return NodeFilter.FILTER_REJECT; // coordinates
          if (/^\/.*\/$/.test(t)) return NodeFilter.FILTER_REJECT; // IPA
          if (t.length < 3) return NodeFilter.FILTER_REJECT; // UI fragments
        }

        const style = window.getComputedStyle(p);
        if (style.display === "none" || style.visibility === "hidden")
          return NodeFilter.FILTER_REJECT;

        const tag = p.tagName.toLowerCase();
        if (["script", "style", "noscript", "svg", "math", "meta", "link"].includes(tag))
          return NodeFilter.FILTER_REJECT;

        // Softer short-text filter
        if (t.length < 10) return NodeFilter.FILTER_REJECT;

        // Expanded UI phrase filter
        if (/^(Create your free account|Subscribe|Login|Register|Share|Download|Jump to|Navigation|From Wikipedia|Contents|Tools|Languages)/i.test(t))
          return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      }
    });

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

  text = text.replace(/\s*,\s*,/g, ",");
  text = text.replace(/\s{2,}/g, " ");

  return text.trim();
}