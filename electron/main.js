const { app, BrowserWindow, Menu, ipcMain, shell, session } = require('electron');
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

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
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
