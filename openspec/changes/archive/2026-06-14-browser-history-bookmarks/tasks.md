## 1. Storage Layer

- [x] 1.1 Add a JSON persistence helper under `app.getPath('userData')` for history and bookmarks (no SQLite dependency).
- [x] 1.2 Implement schema versioning with a top-level `version` field for future migrations.

## 2. Types and IPC Surface

- [x] 2.1 Add `HistoryEntry` (url, title, favicon?, visitCount, lastVisitedAt) and `Bookmark` (url, title, favicon?, folder?, createdAt) types to `src/types/electron.d.ts`.
- [x] 2.2 Extend `QuickEngineApi` with `history` (record, list, search, remove, clear) and `bookmarks` (list, add, remove, update) namespaces.
- [x] 2.3 Implement the namespaces in `electron/preload.js` via `ipcRenderer.invoke`.

## 3. History Recording

- [x] 3.1 Add navigation-event listener in the renderer (webview `did-navigate`/`did-finish-load`) for successful top-level HTTP/HTTPS navigations.
- [x] 3.2 Implement `history:record` IPC in `electron/main.js` that stores or updates an entry and bumps visit count and last-visited time.
- [x] 3.3 Implement `history:list`, `history:search` (match title or URL), `history:remove`, `history:clear`.

## 4. Bookmarks

- [x] 4.1 Add a bookmark-this-page affordance (toolbar star) visible on normal web tabs.
- [x] 4.2 Implement `bookmarks:add`, `bookmarks:remove`, `bookmarks:update`, `bookmarks:list` IPC handlers in `electron/main.js`.
- [x] 4.3 Add a bookmarks manager view listing bookmarks with open/remove actions.

## 5. History View

- [x] 5.1 Add a history page listing recent entries by recency.
- [x] 5.2 Add a search input filtering by title or URL.
- [x] 5.3 Add per-entry remove and clear-all actions.

## 6. New-tab and Address-bar Integration

- [x] 6.1 Extend `NewTabPage` to surface pinned bookmarks and recent history as local shortcuts.
- [x] 6.2 Add an address-bar suggestion dropdown showing matching history/bookmarks as the user types.

## 7. Validation

- [x] 7.1 Run `npm run lint`.
- [x] 7.2 Run `npm run build:renderer`.
- [x] 7.3 Run `openspec validate browser-history-bookmarks`.
- [ ] 7.4 Manual Electron check: visit pages, bookmark pages, search history, observe suggestions and new-tab shortcuts.
