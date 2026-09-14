# Focus Reader

A Chrome/Firefox reading-focus browser extension. It blurs the page, pulls out the main article text, and shows it one chunk at a time in a focused reader bar.

## How it works

1. A **content script** runs on every page (`dist/content.js`).
2. Click the extension icon and press **▶**. That:
   - Blurs the rest of the page
   - Extracts article text (or uses selected text if available)
   - Splits it into sentences and pages them into readable chunks
   - Injects a reader bar with Previous / Next controls
3. **Customize** in the popup: font, size, color theme, and optional bionic reading (bolded word beginnings).
4. Settings are saved with `browser.storage.sync` and applied to the reader.

### Project layout

| Path | Role |
|------|------|
| `manifest.json` | Extension config (MV3) |
| `background.js` | Service worker (holds selected text between popup opens) |
| `popup/` | Toolbar popup UI and settings |
| `content/` | Source modules (extraction, pagination, blur, reader UI) |
| `dist/content.js` | Bundled content script loaded by the browser |
| `styles.css` | Shared styles for popup + reader |

## Setup

```bash
npm install
npx esbuild content/content.js --bundle --outfile=dist/content.js
```

Rebuild after changing anything under `content/`. A built `dist/content.js` is already included, so you can load the extension without building first.

## Load the extension

### Chrome / Edge

1. Open `chrome://extensions` (or `edge://extensions`)
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select this project folder (the one with `manifest.json`)

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `manifest.json` in this folder

## How to test

1. Open a text-heavy page (Wikipedia or Project Gutenberg work well).
2. Click the extension icon → **▶**.
3. Confirm the page blurs and a reader bar appears with paginated sentences.
4. Use **Previous** / **Next** and check the progress counter.
5. In **Customize**, change font, size, theme, and bionic reading — the reader should update.
6. Click **▶** again to turn the reader off (blur + bar removed).
7. Optional: open DevTools → Console and look for `[CONTENT]` / sentence-filtering logs.

**Note:** Selected-text mode is partially wired (`get-selection` / `store-selection` in the background script), but nothing currently stores a selection on highlight. Until that is finished, Play always falls back to auto-extracting the page.
