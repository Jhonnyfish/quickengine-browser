## 1. Types and IPC Surface

- [x] 1.1 Add `DownloadItem` type (id, filename, sourceUrl, targetPath, receivedBytes, totalBytes, state, startTime) to `src/types/electron.d.ts`.
- [x] 1.2 Extend `QuickEngineApi` with a `downloads` namespace (subscribe, openFile, openFolder, cancel, retry, remove, list) in `src/types/electron.d.ts`.
- [x] 1.3 Implement the `downloads` namespace in `electron/preload.js` using `ipcRenderer.invoke` for actions and `ipcRenderer.on` for events.

## 2. Electron Download Tracking

- [x] 2.1 Hook `will-download` on the webview partition session (`session.fromPartition('persist:quick-engine')`) in `electron/main.js` — adjusted from `session.defaultSession` because webviews use a persistent partition, not the default session.
- [x] 2.2 Build a download record per `DownloadItem` and forward `updated`/`done` events to the renderer via `webContents.send('downloads:event', ...)`.
- [x] 2.3 Implement IPC handlers: `downloads:open-file` (`shell.openPath`), `downloads:open-folder` (`shell.showItemInFolder`), `downloads:cancel` (`item.cancel()`), `downloads:retry`, `downloads:remove`, `downloads:list`.
- [x] 2.4 Resolve target path: use configured download directory from settings, else `app.getPath('downloads')`.

## 3. Persistence

- [x] 3.1 Add a JSON persistence helper under `app.getPath('userData')` for recent downloads.
- [x] 3.2 Load persisted downloads on `app.whenReady()` and expose via `downloads:list`.
- [x] 3.3 Prune entries beyond a cap (e.g., last 200) on save.

## 4. Renderer UI

- [x] 4.1 Add a `DownloadsPanel` component listing recent downloads with state, progress, and actions.
- [x] 4.2 Add a toolbar download entry point that opens the manager panel.
- [x] 4.3 Add a download progress affordance for active downloads (per-row progress bar + status toast on state transitions).
- [x] 4.4 Wire manager actions to the IPC handlers and subscribe to `downloads:event`.

## 5. Integration

- [x] 5.1 Consume configured download directory from `browser-settings` (fall back to OS default until settings is wired; `getDownloadDirectory()` is the integration hook).
- [x] 5.2 Confirm downloads triggered from `kuaiqing://newtab` and normal web tabs flow through the same path (both use the same `persist:quick-engine` partition session, so the single `will-download` hook covers all webviews).

## 6. Validation

- [x] 6.1 Run `npm run lint`.
- [x] 6.2 Run `npm run build:renderer`.
- [x] 6.3 Run `openspec validate browser-downloads`.
- [x] 6.4 Manual Electron check: start a download, observe progress, open file, open folder, cancel, retry, remove.
