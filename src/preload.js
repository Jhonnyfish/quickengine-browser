const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('quickEngine', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  openExternal: (url) => ipcRenderer.send('app:open-external', url)
});
