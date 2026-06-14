const { app, BrowserWindow, Menu, ipcMain, shell, session, webContents } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const APP_NAME = '快擎浏览器';

function isExternalUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    title: APP_NAME,
    backgroundColor: '#f5f7fb',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) {
      shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  const rendererUrl = process.env.QUICK_ENGINE_RENDERER_URL;

  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer-dist', 'index.html'));
  }

  return mainWindow;
}

app.setName(APP_NAME);

// ============ Downloads ============

const WEBVIEW_PARTITION = 'persist:quick-engine';
const DOWNLOADS_CAP = 200;

const activeDownloads = new Map();
let recentDownloads = [];
let downloadTrackingReady = false;

function downloadsFilePath() {
  return path.join(app.getPath('userData'), 'downloads.json');
}

function getDownloadDirectory() {
  // TODO(browser-settings): consume configured download directory once the
  // settings feature is implemented. Fall back to the OS default for now.
  return app.getPath('downloads');
}

function loadRecentDownloads() {
  try {
    const raw = fs.readFileSync(downloadsFilePath(), 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      recentDownloads = data
        .filter((item) => item && typeof item.id === 'string')
        .slice(0, DOWNLOADS_CAP);
    }
  } catch {
    recentDownloads = [];
  }
}

function saveRecentDownloads() {
  try {
    const payload = JSON.stringify(recentDownloads.slice(0, DOWNLOADS_CAP), null, 2);
    fs.writeFileSync(downloadsFilePath(), payload, 'utf8');
  } catch (err) {
    console.error('Failed to persist downloads:', err);
  }
}

function upsertDownload(record) {
  const idx = recentDownloads.findIndex((item) => item.id === record.id);
  if (idx >= 0) {
    recentDownloads[idx] = { ...recentDownloads[idx], ...record };
  } else {
    recentDownloads.unshift({ ...record });
  }
  recentDownloads = recentDownloads.slice(0, DOWNLOADS_CAP);
}

function removeRecentDownload(id) {
  recentDownloads = recentDownloads.filter((item) => item.id !== id);
}

function findDownloadRecord(id) {
  return recentDownloads.find((item) => item.id === id);
}

function broadcastDownloads() {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('downloads:event', recentDownloads);
  }
}

function setupDownloadTracking() {
  if (downloadTrackingReady) return;
  downloadTrackingReady = true;

  const webviewSession = session.fromPartition(WEBVIEW_PARTITION);

  webviewSession.on('will-download', (_event, item, originating) => {
    const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const filename = item.getFilename() || 'download';
    const targetPath = path.join(getDownloadDirectory(), filename);
    item.setSavePath(targetPath);

    const urlChain = (item.getURLChain && item.getURLChain()) || [];
    const sourceUrl = urlChain.length > 0 ? urlChain[urlChain.length - 1] : '';

    const record = {
      id,
      filename,
      sourceUrl,
      targetPath,
      receivedBytes: 0,
      totalBytes: item.getTotalBytes() || null,
      state: 'progressing',
      startTime: Date.now(),
      sourceWebContentsId: originating && typeof originating.id === 'number' ? originating.id : null
    };

    activeDownloads.set(id, { item, record });
    upsertDownload(record);
    saveRecentDownloads();
    broadcastDownloads();

    item.on('updated', (_e, state) => {
      const entry = activeDownloads.get(id);
      if (!entry) return;
      entry.record.receivedBytes = item.getReceivedBytes();
      const total = item.getTotalBytes();
      if (total) entry.record.totalBytes = total;
      if (state === 'progressing') entry.record.state = 'progressing';
      upsertDownload(entry.record);
      broadcastDownloads();
    });

    item.once('done', (_e, state) => {
      const entry = activeDownloads.get(id);
      if (!entry) return;
      entry.record.receivedBytes = item.getReceivedBytes();
      entry.record.state =
        state === 'completed' ? 'completed'
        : state === 'cancelled' ? 'canceled'
        : 'interrupted';
      activeDownloads.delete(id);
      upsertDownload(entry.record);
      saveRecentDownloads();
      broadcastDownloads();
    });
  });
}

// ============ /Downloads ============

// ============ History & Bookmarks ============

const HISTORY_VERSION = 1;
const HISTORY_CAP = 1000;
const BOOKMARKS_VERSION = 1;

let historyEntries = [];
let bookmarkEntries = [];

function historyFilePath() {
  return path.join(app.getPath('userData'), 'history.json');
}

function bookmarksFilePath() {
  return path.join(app.getPath('userData'), 'bookmarks.json');
}

function loadHistory() {
  try {
    const raw = fs.readFileSync(historyFilePath(), 'utf8');
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.entries)) {
      historyEntries = data.entries
        .filter((e) => e && typeof e.url === 'string')
        .slice(0, HISTORY_CAP);
    }
  } catch {
    historyEntries = [];
  }
}

function saveHistory() {
  try {
    const payload = JSON.stringify({
      version: HISTORY_VERSION,
      entries: historyEntries.slice(0, HISTORY_CAP)
    }, null, 2);
    fs.writeFileSync(historyFilePath(), payload, 'utf8');
  } catch (err) {
    console.error('Failed to persist history:', err);
  }
}

function recordHistory(entry) {
  if (!entry || typeof entry.url !== 'string') return;
  const url = entry.url;
  const title = typeof entry.title === 'string' && entry.title ? entry.title : url;
  const favicon = typeof entry.favicon === 'string' && entry.favicon ? entry.favicon : undefined;

  const existing = historyEntries.find((e) => e.url === url);
  if (existing) {
    existing.title = title;
    if (favicon) existing.favicon = favicon;
    existing.visitCount = (existing.visitCount || 0) + 1;
    existing.lastVisitedAt = Date.now();
  } else {
    historyEntries.unshift({
      url,
      title,
      favicon,
      visitCount: 1,
      lastVisitedAt: Date.now()
    });
  }
  historyEntries = historyEntries.slice(0, HISTORY_CAP);
  saveHistory();
}

function searchHistory(query) {
  const q = (typeof query === 'string' ? query : '').trim().toLowerCase();
  if (!q) return historyEntries.slice();
  return historyEntries.filter((e) =>
    e.url.toLowerCase().includes(q) ||
    (e.title || '').toLowerCase().includes(q)
  );
}

function removeHistory(url) {
  historyEntries = historyEntries.filter((e) => e.url !== url);
  saveHistory();
}

function clearHistory() {
  historyEntries = [];
  saveHistory();
}

function loadBookmarks() {
  try {
    const raw = fs.readFileSync(bookmarksFilePath(), 'utf8');
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.entries)) {
      bookmarkEntries = data.entries
        .filter((b) => b && typeof b.id === 'string' && typeof b.url === 'string');
    }
  } catch {
    bookmarkEntries = [];
  }
}

function saveBookmarks() {
  try {
    const payload = JSON.stringify({
      version: BOOKMARKS_VERSION,
      entries: bookmarkEntries
    }, null, 2);
    fs.writeFileSync(bookmarksFilePath(), payload, 'utf8');
  } catch (err) {
    console.error('Failed to persist bookmarks:', err);
  }
}

function addBookmark(input) {
  if (!input || typeof input.url !== 'string') return null;
  const bookmark = {
    id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: input.url,
    title: typeof input.title === 'string' && input.title ? input.title : input.url,
    favicon: typeof input.favicon === 'string' && input.favicon ? input.favicon : undefined,
    folder: typeof input.folder === 'string' && input.folder ? input.folder : undefined,
    createdAt: Date.now()
  };
  bookmarkEntries.unshift(bookmark);
  saveBookmarks();
  return bookmark;
}

function removeBookmark(id) {
  bookmarkEntries = bookmarkEntries.filter((b) => b.id !== id);
  saveBookmarks();
}

function updateBookmark(id, patch) {
  const bookmark = bookmarkEntries.find((b) => b.id === id);
  if (!bookmark) return;
  if (patch && typeof patch.title === 'string') bookmark.title = patch.title;
  if (patch && typeof patch.folder === 'string') bookmark.folder = patch.folder || undefined;
  saveBookmarks();
}

// ============ /History & Bookmarks ============

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  loadRecentDownloads();
  loadHistory();
  loadBookmarks();
  setupDownloadTracking();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('app:get-version', () => app.getVersion());

ipcMain.handle('app:get-version-info', () => ({
  appName: APP_NAME,
  appVersion: app.getVersion(),
  electron: process.versions.electron,
  chromium: process.versions.chrome,
  node: process.versions.node,
  v8: process.versions.v8,
  uv: process.versions.uv,
  zlib: process.versions.zlib,
  openssl: process.versions.openssl,
  platform: process.platform,
  arch: process.arch,
  userAgent: session.defaultSession.getUserAgent(),
  executablePath: process.execPath,
  appPath: app.getAppPath(),
  userDataPath: app.getPath('userData'),
  commandLine: process.argv.join(' ')
}));

ipcMain.on('app:open-external', (_event, url) => {
  if (isExternalUrl(url)) {
    shell.openExternal(url);
  }
});

// ============ Downloads IPC ============

ipcMain.handle('downloads:list', () => recentDownloads);

ipcMain.handle('downloads:open-file', async (_event, id) => {
  const record = findDownloadRecord(id);
  if (record && record.targetPath) {
    await shell.openPath(record.targetPath);
  }
});

ipcMain.handle('downloads:open-folder', (_event, id) => {
  const record = findDownloadRecord(id);
  if (record && record.targetPath) {
    shell.showItemInFolder(record.targetPath);
  }
});

ipcMain.handle('downloads:cancel', (_event, id) => {
  const entry = activeDownloads.get(id);
  if (entry) {
    try { entry.item.cancel(); } catch { /* already finished or canceled */ }
  }
});

ipcMain.handle('downloads:retry', (_event, id) => {
  const record = findDownloadRecord(id);
  if (!record || !record.sourceUrl) return;

  const partitionSession = session.fromPartition(WEBVIEW_PARTITION);
  let target = null;
  if (record.sourceWebContentsId != null) {
    target = webContents.fromId(record.sourceWebContentsId);
  }
  if (!target) {
    for (const wc of webContents.getAllWebContents()) {
      if (wc.session === partitionSession) {
        target = wc;
        break;
      }
    }
  }
  if (!target) return;

  // Bypass HTTP cache so retry re-fetches instead of completing from cache.
  target.downloadURL(record.sourceUrl, {
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  });
});

ipcMain.handle('downloads:remove', (_event, id) => {
  const entry = activeDownloads.get(id);
  if (entry) {
    try { entry.item.cancel(); } catch { /* already finished or canceled */ }
    activeDownloads.delete(id);
  }
  removeRecentDownload(id);
  saveRecentDownloads();
  broadcastDownloads();
});

// ============ History IPC ============

ipcMain.handle('history:record', (_event, entry) => {
  recordHistory(entry);
});

ipcMain.handle('history:list', () => historyEntries);

ipcMain.handle('history:search', (_event, query) => searchHistory(query));

ipcMain.handle('history:remove', (_event, url) => {
  if (typeof url === 'string') removeHistory(url);
});

ipcMain.handle('history:clear', () => {
  clearHistory();
});

// ============ Bookmarks IPC ============

ipcMain.handle('bookmarks:list', () => bookmarkEntries);

ipcMain.handle('bookmarks:add', (_event, input) => addBookmark(input));

ipcMain.handle('bookmarks:remove', (_event, id) => {
  if (typeof id === 'string') removeBookmark(id);
});

ipcMain.handle('bookmarks:update', (_event, id, patch) => {
  if (typeof id === 'string') updateBookmark(id, patch || {});
});
