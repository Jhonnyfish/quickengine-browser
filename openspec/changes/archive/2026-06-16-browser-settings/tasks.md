## 1. Storage Layer

- [x] 1.1 Add a shared preferences JSON store under `app.getPath('userData')` for use by settings and other features.
- [x] 1.2 Define default preferences: searchEngine (Baidu), startupBehavior (new-tab), homePage (`kuaiqing://newtab`), downloadDirectory (`app.getPath('downloads')`).
- [x] 1.3 Implement atomic read/write with safe defaults.

## 2. Types and IPC Surface

- [x] 2.1 Add `BrowserPreferences`, `SearchEngineOption`, `StartupBehavior` types to `src/types/electron.d.ts`.
- [x] 2.2 Extend `QuickEngineApi` with a `settings` namespace (`get`, `set`).
- [x] 2.3 Implement the namespace in `electron/preload.js` via `ipcRenderer.invoke`.

## 3. Settings Page UI

- [x] 3.1 Add a settings page component reachable at an internal page (e.g., `kuaiqing://settings`).
- [x] 3.2 Add a settings entry point in the toolbar that opens the internal page.
- [x] 3.3 Add sections for search engine, startup behavior, home page, and download directory.
- [x] 3.4 Wire each control to read current value via `settings:get` and write updates via `settings:set`.

## 4. Search Engine Integration

- [x] 4.1 Read configured search engine template when submitting search from the address bar.
- [x] 4.2 Read configured search engine template when submitting search from `kuaiqing://newtab`.

## 5. Startup Behavior Integration

- [x] 5.1 On startup, branch on configured `startupBehavior`: open new-tab page, restore last session (hook for `browser-session-restore`), or open configured pages.
- [x] 5.2 Provide an extension point so `browser-session-restore` can register a restore handler.

## 6. Home Page Integration

- [x] 6.1 Read configured home page when the home button is activated.

## 7. Download Directory Integration

- [x] 7.1 Expose configured download directory for `browser-downloads` to consume.
- [x] 7.2 Add a folder picker using `dialog.showOpenDialog`.

## 8. Validation

- [x] 8.1 Run `npm run lint`.
- [x] 8.2 Run `npm run build:renderer`.
- [x] 8.3 Run `openspec validate browser-settings`.
- [x] 8.4 Manual Electron check: change each setting, restart, verify persistence and that other features consume updated values.
