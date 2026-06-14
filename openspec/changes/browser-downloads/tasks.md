## 1. Types and IPC Surface

- [ ] 1.1 Add `DownloadItem` type (id, filename, sourceUrl, targetPath, receivedBytes, totalBytes, state, startTime) to `src/types/electron.d.ts`.
- [ ] 1.2 Extend `QuickEngineApi` with a `downloads` namespace (subscribe, openFile, openFolder, cancel, retry, remove, list) in `src/types/electron.d.ts`.
- [ ] 1.3 Implement the `downloads` namespace in `electron/preload.js` using `ipcRenderer.invoke` for actions and `ipcRenderer.on` for events.

## 2. Electron Download Tracking

- [ ] 2.1 Listen to `session.defaultSession.on('will-download', ...)` in `electron/main.js` to capture new downloads.
- [ ] 2.2 Build a download record per `DownloadItem` and forward `updated`/`done` events to the renderer via `webContents.send('downloads:event', ...)`.
- [ ] 2.3 Implement IPC handlers: `downloads:open-file` (`shell.openPath`), `downloads:open-folder` (`shell.showItemInFolder`), `downloads:cancel` (`item.cancel()`), `downloads:retry`, `downloads:remove`, `downloads:list`.
- [ ] 2.4 Resolve target path: use configured download directory from settings, else `app.getPath('downloads')`.

## 3. Persistence

- [ ] 3.1 Add a JSON persistence helper under `app.getPath('userData')` for recent downloads.
- [ ] 3.2 Load persisted downloads on `app.whenReady()` and expose via `downloads:list`.
- [ ] 3.3 Prune entries beyond a cap (e.g., last 200) on save.

## 4. Renderer UI

- [ ] 4.1 Add a `DownloadsManager` component listing recent downloads with state, progress, and actions.
- [ ] 4.2 Add a toolbar download entry point that opens the manager (panel or internal page).
- [ ] 4.3 Add a download progress affordance for active downloads (shelf/toast).
- [ ] 4.4 Wire manager actions to the IPC handlers and subscribe to `downloads:event`.

## 5. Integration

- [ ] 5.1 Consume configured download directory from `browser-settings` (fall back to OS default until settings is wired).
- [ ] 5.2 Confirm downloads triggered from `kuaiqing://newtab` and normal web tabs flow through the same path.

## 6. Validation

- [ ] 6.1 Run `npm run lint`.
- [ ] 6.2 Run `npm run build:renderer`.
- [ ] 6.3 Run `openspec validate browser-downloads`.
- [ ] 6.4 Manual Electron check: start a download, observe progress, open file, open folder, cancel, retry, remove.
