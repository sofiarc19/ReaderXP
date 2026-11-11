// Webpage -> Mozilla Readability -> Clean Paragraphs -> Remove Junk
// -> Split Large Content -> Reader-Ready Paragraph Chunks
// Mozilla: Identify the actual article. Remove navigation. 
// Remove sidebars. Remove ads. Remove headers/footers.
import { Readability } from "@mozilla/readability";
import { $$ } from "./utils";

// Prevent extraction from pulling text from our own extension UI.
export function isInsideExtensionUI(el) {
  return !!el?.closest("#reader-area-bar");
}

// Split oversized paragraphs so they fit better inside the reader.
function splitLargeParagraph(paragraph) {
  const MAX_CHARS = 500;
  const MAX_SENTENCES = 4;

  // Language-aware sentence detection.
  const segmenter = new Intl.Segmenter(
    navigator.language || "en",
    {
      granularity: "sentence",
    }
  );

  const sentences = [...segmenter.segment(paragraph)]
    .map(part => part.segment.trim())
    .filter(Boolean);

  const chunks = [];

  let currentChunk = "";
  let currentSentenceCount = 0;

  for (const sentence of sentences) {
    const wouldExceedChars =
      currentChunk.length + sentence.length > MAX_CHARS;

    const wouldExceedSentenceCount =
      currentSentenceCount >= MAX_SENTENCES;

    if (
      currentChunk &&
      (wouldExceedChars || wouldExceedSentenceCount)
    ) {
      chunks.push(currentChunk.trim());

      currentChunk = sentence;
      currentSentenceCount = 1;
    } else {
      currentChunk +=
        (currentChunk ? " " : "") + sentence;
      currentSentenceCount++;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Basic paragraph cleanup.
function cleanParagraph(text) {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\[\d+\]/g, "")
    .trim();
}

// Filters obvious junk paragraphs.
function isJunkParagraph(text) {
  if (!text) return true;

  if (text.length < 15) return true;

  if (
    /^(subscribe|sign up|register|log in|login|get started|share)$/i.test(
      text
    )
  ) {
    return true;
  }

  if (
    /^[0-9\s.,\-()%:]+$/.test(text)
  ) {
    return true;
  }

  return false;
}

// Wikipedia-specific cleanup.
function cleanupWikipedia(paragraphs) {
  const result = [];

  for (const p of paragraphs) {
    if (
      /^(references|external links|see also|notes)$/i.test(
        p.trim()
      )
    ) {
      break;
    }

    result.push(
      p
        .replace(/\(born.*?\)/gi, "")
        .replace(/\(died.*?\)/gi, "")
        .trim()
    );
  }

  return result;
}

// Gutenberg cleanup.
function cleanupGutenberg(text) {
  let cleaned = text;

  const start = cleaned.match(
    /START OF THE PROJECT GUTENBERG EBOOK/i
  );

  if (start) {
    cleaned = cleaned.slice(
      start.index + start[0].length
    );
  }

  cleaned = cleaned.replace(
    /END OF THE PROJECT GUTENBERG EBOOK[\s\S]+$/i,
    ""
  );

  cleaned = cleaned.replace(
    /Project Gutenberg License[\s\S]+?www\.gutenberg\.org/gi,
    ""
  );

  return cleaned;
}

// Extract article paragraphs using Readability.
 // Returns paragraph chunks instead of raw text nodes, preserving structure.
export function extractParagraphs() {
  try {
    const documentClone = document.cloneNode(true);

    // Remove extension UI from clone
    documentClone.querySelectorAll(
        "#reader-area-bar, #extension-box"
      ).forEach(el => el.remove());

    const article = new Readability(documentClone).parse();

    if (!article?.content) {
      console.warn("[READER] Readability failed, falling back.");
      const fallbackParagraphs = [...$$(
        "article p, main p, p"),].map(el => cleanParagraph(el.textContent))
        .filter(p => !isJunkParagraph(p));

      return fallbackParagraphs;
    }
    console.log(
      "[READER] Readability Title:",
      article.title
    );

    console.log(
      "[READER] Article Length:",
      article.textContent?.length
    );
    const container = document.createElement("div");
    container.innerHTML = article.content;

    let paragraphs = [
      ...container.querySelectorAll(
        "p, blockquote"
      ),
    ]
      .map(el => cleanParagraph(el.textContent))
      .filter(p => !isJunkParagraph(p));

    if (location.hostname.includes("wikipedia.org")) {
      paragraphs = cleanupWikipedia(paragraphs);
    }

    const finalParagraphs = [];

    paragraphs.forEach(paragraph => {
      const split =
        splitLargeParagraph(paragraph);

      finalParagraphs.push(...split);
    });

    console.log(
      `[READER] Extracted ${finalParagraphs.length} paragraph chunks`
    );

    return finalParagraphs;
  }
  catch (error) {
    console.error(
      "[READER] Paragraph extraction failed:",
      error
    );

    return [];
  }
}

// Backwards-compatible API used by sentenceProcessing.js.
export function extractAllText() {
  let paragraphs = extractParagraphs();

  let text = paragraphs.join("\n\n");

  if (
    location.hostname.includes(
      "gutenberg.org"
    )
  ) {
    text = cleanupGutenberg(text);
  }

  return text.trim();
}