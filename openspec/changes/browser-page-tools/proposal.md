## Why

QuickEngine Browser can load web pages but lacks the basic page-level tools users expect from any desktop browser: find-in-page, zoom, print, developer tools, and consistent reload/stop behavior. Without these, the browsing experience feels incomplete for everyday tasks like searching within a long article, adjusting text size, printing a receipt, or debugging a page. This change adds the standard page utility tools to the active web tab.

## What Changes

- Add find-in-page controls (open, query input, match navigation, match count).
- Add page zoom controls (zoom in, zoom out, reset zoom, current zoom display).
- Add a print action that invokes the Electron print flow for the active webview.
- Add a developer tools action that opens devtools for the active webview.
- Ensure reload and stop toolbar behavior stays consistent with active-tab loading state.

## Capabilities

### New Capabilities

- `page-tools`: Provides general page utilities including find in page, zoom, print, developer tools, and consistent reload/stop behavior.

### Modified Capabilities

- None. No existing main OpenSpec capability specs are present in this project yet.

## Impact

- Affected renderer code: toolbar actions for find/zoom/print/devtools, find-in-page overlay, zoom indicator, and reload/stop consistency in the existing toolbar.
- Affected Electron code: IPC handlers for print, devtools open, find-in-page, and zoom set on the active webview.
- Affected types: `src/types/electron.d.ts` for page-tools IPC typings.
- Affected storage: per-tab zoom level should persist within the session (and optionally across restarts via `browser-session-restore`).
- Dependencies: Electron webview APIs (`<webview>.print()`, `.openDevTools()`, `.findInPage()`, `.setZoomFactor()`). No new runtime dependency expected.
- Validation: `npm run lint`, `npm run build:renderer`, focused manual checks of each tool on a normal web page, and `openspec validate browser-page-tools` should pass.

## Non-goals

- Advanced devtools integration, devtools extensions, or custom themes for devtools are out of scope.
- PDF annotation, advanced print preview customization, and headless printing are out of scope.
- Page translation, reader mode, and screenshot tools are out of scope (tracked under future advanced capabilities).
