## 1. Storage Layer

- [ ] 1.1 Add a shared preferences JSON store under `app.getPath('userData')` for use by settings and other features.
- [ ] 1.2 Define default preferences: searchEngine (Baidu), startupBehavior (new-tab), homePage (`kuaiqing://newtab`), downloadDirectory (`app.getPath('downloads')`).
- [ ] 1.3 Implement atomic read/write with safe defaults.

## 2. Types and IPC Surface

- [ ] 2.1 Add `BrowserPreferences`, `SearchEngineOption`, `StartupBehavior` types to `src/types/electron.d.ts`.
- [ ] 2.2 Extend `QuickEngineApi` with a `settings` namespace (`get`, `set`).
- [ ] 2.3 Implement the namespace in `electron/preload.js` via `ipcRenderer.invoke`.

## 3. Settings Page UI

- [ ] 3.1 Add a settings page component reachable at an internal page (e.g., `kuaiqing://settings`).
- [ ] 3.2 Add a settings entry point in the toolbar that opens the internal page.
- [ ] 3.3 Add sections for search engine, startup behavior, home page, and download directory.
- [ ] 3.4 Wire each control to read current value via `settings:get` and write updates via `settings:set`.

## 4. Search Engine Integration

- [ ] 4.1 Read configured search engine template when submitting search from the address bar.
- [ ] 4.2 Read configured search engine template when submitting search from `kuaiqing://newtab`.

## 5. Startup Behavior Integration

- [ ] 5.1 On startup, branch on configured `startupBehavior`: open new-tab page, restore last session (hook for `browser-session-restore`), or open configured pages.
- [ ] 5.2 Provide an extension point so `browser-session-restore` can register a restore handler.

## 6. Home Page Integration

- [ ] 6.1 Read configured home page when the home button is activated.

## 7. Download Directory Integration

- [ ] 7.1 Expose configured download directory for `browser-downloads` to consume.
- [ ] 7.2 Add a folder picker using `dialog.showOpenDialog`.

## 8. Validation

- [ ] 8.1 Run `npm run lint`.
- [ ] 8.2 Run `npm run build:renderer`.
- [ ] 8.3 Run `openspec validate browser-settings`.
- [ ] 8.4 Manual Electron check: change each setting, restart, verify persistence and that other features consume updated values.
