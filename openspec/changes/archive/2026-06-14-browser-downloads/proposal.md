## Why

QuickEngine Browser can navigate web pages, manage tabs, and offer a branded new-tab experience, but downloads initiated from web pages currently have no visible tracking, progress feedback, or persisted history. This makes the browser impractical for one of the most common daily browsing tasks — saving files from the web. This change introduces first-class download management so users can monitor, control, and revisit downloads.

## What Changes

- Track downloads initiated by web pages, exposing item state (filename, source URL, target path, received/total bytes, state, start time) to the renderer.
- Provide progress updates for active downloads.
- Add a download affordance (shelf / manager entry) for recent downloads and a full manager view for persisted recent downloads.
- Support core download actions: open completed file, open containing folder, cancel active download, retry failed download, remove entry.
- Honor a configurable download directory, falling back to the OS default downloads directory.
- Persist recent download metadata across application restarts.

## Capabilities

### New Capabilities

- `download-management`: Tracks browser downloads, exposes download progress and completion actions, and persists recent download metadata.

### Modified Capabilities

- None. No existing main OpenSpec capability specs are present in this project yet.

## Impact

- Affected Electron code: `electron/main.js` and `electron/preload.js` for `will-download` event handling, IPC channels for download state and actions, and persisted download metadata storage.
- Affected renderer code: new download manager page or panel, toolbar entry point, download item UI with progress, and state plumbing in `src/App.tsx` or new components.
- Affected types: `src/types/electron.d.ts` for download IPC typings.
- Affected storage: local application data file (JSON or SQLite) for persisted download metadata.
- Dependencies: Electron's `DownloadItem` API and Node filesystem APIs. No new runtime dependency is strictly required; a small local persistence helper may be added.
- Validation: `npm run lint`, `npm run build:renderer`, focused manual Electron download checks, and `openspec validate browser-downloads` should pass.

## Non-goals

- Download pause/resume (beyond cancel/retry) is out of scope for this change.
- Download safety scanning, virus checks, and malicious-file blocking are out of scope.
- Cloud download or sync features are out of scope.
