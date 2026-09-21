// Global shared state for the reader system
export const state = {
  allSentences: [],
  pageIndexMap: [],
  currentPage: 0,
  
  // The actual slice of sentences being displayed
  currentChunk: null,
  // Index of the first sentence in the current chunk
  activeElement: null,

  readerSettings: {
    font: "sans-serif",
    fontSize: "16px",
    bionic: false,
    theme: "theme-dark"
  }
};