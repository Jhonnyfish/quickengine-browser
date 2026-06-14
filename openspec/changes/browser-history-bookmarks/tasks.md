## 1. Storage Layer

- [ ] 1.1 Add a JSON persistence helper under `app.getPath('userData')` for history and bookmarks (no SQLite dependency).
- [ ] 1.2 Implement schema versioning with a top-level `version` field for future migrations.

## 2. Types and IPC Surface

- [ ] 2.1 Add `HistoryEntry` (url, title, favicon?, visitCount, lastVisitedAt) and `Bookmark` (url, title, favicon?, folder?, createdAt) types to `src/types/electron.d.ts`.
- [ ] 2.2 Extend `QuickEngineApi` with `history` (record, list, search, remove, clear) and `bookmarks` (list, add, remove, update) namespaces.
- [ ] 2.3 Implement the namespaces in `electron/preload.js` via `ipcRenderer.invoke`.

## 3. History Recording

- [ ] 3.1 Add navigation-event listener in the renderer (webview `did-navigate`/`did-finish-load`) for successful top-level HTTP/HTTPS navigations.
- [ ] 3.2 Implement `history:record` IPC in `electron/main.js` that stores or updates an entry and bumps visit count and last-visited time.
- [ ] 3.3 Implement `history:list`, `history:search` (match title or URL), `history:remove`, `history:clear`.

## 4. Bookmarks

- [ ] 4.1 Add a bookmark-this-page affordance (toolbar star) visible on normal web tabs.
- [ ] 4.2 Implement `bookmarks:add`, `bookmarks:remove`, `bookmarks:update`, `bookmarks:list` IPC handlers in `electron/main.js`.
- [ ] 4.3 Add a bookmarks manager view listing bookmarks with open/remove actions.

## 5. History View

- [ ] 5.1 Add a history page listing recent entries by recency.
- [ ] 5.2 Add a search input filtering by title or URL.
- [ ] 5.3 Add per-entry remove and clear-all actions.

## 6. New-tab and Address-bar Integration

- [ ] 6.1 Extend `NewTabPage` to surface pinned bookmarks and recent history as local shortcuts.
- [ ] 6.2 Add an address-bar suggestion dropdown showing matching history/bookmarks as the user types.

## 7. Validation

- [ ] 7.1 Run `npm run lint`.
- [ ] 7.2 Run `npm run build:renderer`.
- [ ] 7.3 Run `openspec validate browser-history-bookmarks`.
- [ ] 7.4 Manual Electron check: visit pages, bookmark pages, search history, observe suggestions and new-tab shortcuts.
