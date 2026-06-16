## 1. Storage Layer

- [x] 1.1 Add a `session.json` store under `app.getPath('userData')` with `{version, tabs, activeTabId, savedAt}` schema and safe defaults.
- [x] 1.2 Add a `recently-closed.json` store under `app.getPath('userData')` with `{version, entries}` schema, capped to a reasonable size (e.g., 20).
- [x] 1.3 Implement atomic read/write for both files (tmp + rename, consistent with other features).

## 2. Types and IPC Surface

- [x] 2.1 Add `SavedSessionTab`, `SavedSession`, `RecentlyClosedTab` types to `src/types/electron.d.ts`.
- [x] 2.2 Add `SessionApi` namespace: `saveSession`, `loadSession`, `clearSession`, `pushRecentlyClosed`, `listRecentlyClosed`, `popRecentlyClosed`.
- [x] 2.3 Extend `QuickEngineApi` with the `session` namespace and implement it in `electron/preload.js` via `ipcRenderer.invoke`.

## 3. Save Session on Quit

- [x] 3.1 Add `session:save` IPC handler that accepts the current tab list (URL + internal page identifier), active tab identity, and persists to `session.json`.
- [x] 3.2 On renderer `before-quit` (or main `before-quit`), trigger a final session snapshot from the renderer.
- [x] 3.3 Persist snapshot only when at least one normal or internal tab exists; otherwise clear the saved session.

## 4. Restore at Startup

- [x] 4.1 Implement the restore handler that reads `session.json` and returns a serializable tab descriptor list.
- [x] 4.2 Register the handler via `registerStartupRestoreHandler` so `browser-settings` startup branch can invoke it.
- [x] 4.3 In the renderer, when restore is requested, recreate saved tabs (including internal pages) and activate the previously active tab when possible.
- [x] 4.4 Skip invalid/unrestorable entries and still open a usable window (fallback to home/new-tab if every entry fails).

## 5. Recently Closed Tabs

- [x] 5.1 Add `session:push-recently-closed`, `session:list-recently-closed`, `session:pop-recently-closed` IPC handlers writing to `recently-closed.json`.
- [x] 5.2 On tab close in the renderer, push the closed tab's URL + internal page identifier.
- [x] 5.3 Provide a "reopen closed tab" affordance (keyboard shortcut Ctrl+Shift+T and/or a toolbar/menu entry) that pops the latest entry and recreates the tab.
- [x] 5.4 Show a status toast on reopen and a status toast when there is nothing to reopen.

## 6. Validation

- [x] 6.1 Run `npm run lint`.
- [x] 6.2 Run `npm run build:renderer`.
- [x] 6.3 Run `openspec validate browser-session-restore`.
- [ ] 6.4 Manual Electron check: open tabs across web + internal pages, quit, set startup behavior to restore-last-session, relaunch — verify tabs and active tab restore. Close a tab, Ctrl+Shift+T — verify it reopens.
