const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('quickEngine', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getVersionInfo: () => ipcRenderer.invoke('app:get-version-info'),
  openExternal: (url) => ipcRenderer.send('app:open-external', url)
});
