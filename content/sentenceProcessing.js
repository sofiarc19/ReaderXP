import { extractAllText } from "./textExtraction.js";

/**
 * Splits text into sentences using the browser's
 * native sentence segmentation.
 */
function segmentSentences(text) {
  if (!text?.trim()) return [];

  const segmenter = new Intl.Segmenter(
    navigator.language || "en",
    {
      granularity: "sentence",
    }
  );

  return [...segmenter.segment(text)]
    .map(part => part.segment.trim())
    .filter(Boolean);
}

/**
 * Basic cleanup for extracted sentences.
 * Much lighter than the old filter system.
 */
function cleanSentence(sentence) {
  return sentence
    .replace(/\s+/g, " ")
    .replace(/\u00A0/g, " ")
    .trim();
}

/**
 * Detect obvious non-content.
 * Kept intentionally conservative.
 */
function isJunkSentence(sentence) {
  const text = sentence.trim();

  if (text.length < 3) return true;

  if (
    /^(subscribe|sign up|log in|login|register|get started|skip to content)$/i.test(
      text
    )
  ) {
    return true;
  }

  if (/^[0-9\s.,\-:()%]+$/.test(text)) {
    return true;
  }

  return false;
}

// Main extraction pipeline.
 
export function extractSentences() {
  const text = extractAllText();

  if (!text) {
    console.warn("[READER] No text extracted.");
    return [];
  }

  const sentences = segmentSentences(text)
    .map(cleanSentence)
    .filter(sentence => !isJunkSentence(sentence));

  console.log(
    `[READER] Extracted ${sentences.length} sentences`
  );

  return sentences;
}

//Used for manually selected user text.
export function extractSentencesFromText(text) {
  if (!text?.trim()) return [];

  return segmentSentences(text)
    .map(cleanSentence)
    .filter(sentence => !isJunkSentence(sentence));
}