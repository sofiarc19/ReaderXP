import { extractAllText } from "./textExtraction.js";

// Fix cases where headline-style fragments run together.
// Adds a period after certain colon-separated blocks.
export function splitMixedFragments(text) {
  return text.replace(/([A-Z][^.!?]+:[^.!?]+)(?=\s+[A-Z])/g, "$1.");
}

// Merge short or incomplete fragments into full sentences.
export function stitchFragments(sentences) {
  const stitched = [];
  let buffer = "";

  for (let s of sentences) {
    const trimmed = s.trim();

    // Detect fragments that shouldn't stand alone
    const isFragment =
      trimmed.length < 40 ||                     // short
      /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$/.test(trimmed) || // proper nouns
      /^[A-Za-z0-9\-]+$/.test(trimmed) ||        // single-word fragments
      !/[.!?]$/.test(trimmed);                   // no ending punctuation

    if (isFragment) {
      // Merge into previous buffer
      buffer += " " + trimmed;
    } else {
      // Full sentence → push and reset buffer
      buffer += " " + trimmed;
      stitched.push(buffer.trim());
      buffer = "";
    }
  }

  // Push any leftover fragment
  if (buffer.trim().length > 0) {
    stitched.push(buffer.trim());
  }

  return stitched;
}

// Score how "real" a sentence looks using length, punctuation,
// alphabetic density, and stopword presence.
export function scoreSentence(sentence) {
  const words = sentence.split(/\s+/);
  const wordCount = words.length;

  // Count alphabetic characters
  const letters = (sentence.match(/[a-zA-Z]/g) || []).length;

  // Count punctuation that indicates real prose
  const punctuation = (sentence.match(/[,:;—–-]/g) || []).length;

  // Expanded stopword list (helps detect natural language)
  const stopWords = [
    "the","and","is","in","of","to","for","that","with","on","as","at","by","from",
    "it","this","was","are","be","an","or","but","not","which","their","his","her"
  ];
  const stopCount = words.filter(w => stopWords.includes(w.toLowerCase())).length;

  const alphabeticRatio = letters / sentence.length;
  const stopRatio = stopCount / wordCount;

  // Normalize metrics to 0–1
  const wordScore = Math.min(1, wordCount / 20);         // softer: 20 words is “full score”
  const alphaScore = Math.min(1, alphabeticRatio / 0.5); // softer: 50% letters is enough
  const punctScore = Math.min(1, punctuation / 2);       // softer: 2 punctuation marks is enough
  const stopScore = Math.min(1, stopRatio / 0.25);       // softer: 25% stopwords is enough

  // Weighted sum — slightly rebalanced
  const confidence =
    0.35 * wordScore +
    0.30 * alphaScore +
    0.20 * punctScore +
    0.15 * stopScore;

  return confidence;
}

// Detect ad-like or promotional sentences to filter out.
export function isAdSentence(s) {
  const text = s.trim();

  // Obvious UI / promo
  if (/^(Subscribe|Sign up|Create your free account|Add|Skip to Content|Log in|Register|Join|Get started)/i.test(text))
    return true;

  // Title-case headline with colon, no reporting verb
  if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)+.*:/.test(text) &&
      !/\b(says|said|tells|reports|writes|posted|shared|announced|revealed)\b/i.test(text))
    return true;

  // Marketing words with no verb
  const marketingWords = /\b(Guide|Deal|Exclusive|Sale|Discount|Offer|Sponsored|Advertorial|Promotion)\b/i;
  const hasVerb = /\b(is|are|was|were|be|have|has|had|says|said|made|make|share|shared|shows|showed|posted|sparked|tells|reports|writes|announced|revealed|launched|created|produced)\b/i.test(text);
  if (marketingWords.test(text) && !hasVerb)
    return true;

  // Shouty all‑caps with no verb
  if (/[A-Z]{3,}/.test(text) && !hasVerb)
    return true;

  return false;
}

// Filter sentences using strict rules until a "real" anchor sentence is found, then relax the threshold.
export function filterSentencesDynamically(scoredSentences) {
  const STRICT_THRESHOLD = 0.50;
  const NORMAL_THRESHOLD = 0.35;

  const domain = location.hostname;
  const isWikiLike = /(wikipedia|wikimedia|wiktionary|britannica|encyclopedia)/i.test(domain);

  let anchorFound = false;
  let consecutiveGood = 0;
  const result = [];
  const rejected = [];

  for (const s of scoredSentences) {
    const text = s.text.trim();

    const hasVerb = /\b(is|are|was|were|be|have|has|had|says|said|made|make|share|shared|shows|showed|collided|crashed|killed|injured|posted|sparked|tells|reports|writes)\b/i.test(text);
    const endsProperly = /[.!?]$/.test(text);

    // Before anchor: strict filtering
    if (!anchorFound) {
      if (!isWikiLike && isAdSentence(text)) {
        // Try to salvage real content inside ad-like text
        const split = text.split(/(?<=\.)\s+/);
        const realPart = split.find(t =>
          /\b(is|are|was|were|be|have|has|had|says|said|posted|shared|reports|writes)\b/i.test(t)
        );
        if (realPart) {
          result.push(realPart.trim());
          rejected.push({ reason: "partial ad-like (recovered real part)", text });
          continue;
        }
        rejected.push({ reason: "ad-like (pre-anchor)", text });
        continue;
      }

      if (s.score >= STRICT_THRESHOLD || (hasVerb && endsProperly)) {
        consecutiveGood++;
        if (consecutiveGood >= 2) {
          anchorFound = true;
          console.log("Anchor found: true after", consecutiveGood, "good sentences");
        }
        result.push(text);
      } else {
        rejected.push({ reason: `low score (${s.score.toFixed(2)}) pre-anchor`, text });
      }
    }

    // After anchor: relaxed filtering
    else {
      if (s.score >= NORMAL_THRESHOLD) {
        result.push(text);
      } else {
        rejected.push({ reason: `low score (${s.score.toFixed(2)}) post-anchor`, text });
      }
    }
  }

  // Debug logging
  console.group("Sentence Filtering Debug");
  console.log("Accepted sentences:", result.length);
  console.log("Rejected sentences:", rejected.length);
  rejected.forEach(r => console.log(`❌ ${r.reason}: ${r.text}`));
  console.groupEnd();

  return result;
}

// Full extraction pipeline for page text
export function extractSentences() {
  const raw = extractAllText();
  const cleaned = splitMixedFragments(raw);
  // 1. Split into raw fragments
  const rawSentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  // 2. Stitch Wikipedia-style fragments
  const stitched = stitchFragments(rawSentences);
  // 3. Score each stitched sentence  
  const scored = stitched.map(s => ({ text: s, score: scoreSentence(s) }));
  // 4. Dynamic filtering (strict → normal)  
  return filterSentencesDynamically(scored);
}

// Manual text extraction (used when user selects text)
export function extractSentencesFromText(text) {
  const cleaned = splitMixedFragments(text);
  const rawSentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  const stitched = stitchFragments(rawSentences);
  return stitched.map(s => s.trim());
}