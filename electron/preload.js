const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('quickEngine', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getVersionInfo: () => ipcRenderer.invoke('app:get-version-info'),
  openExternal: (url) => ipcRenderer.send('app:open-external', url),
  downloads: {
    list: () => ipcRenderer.invoke('downloads:list'),
    subscribe: (handler) => {
      const listener = (_event, items) => handler(items);
      ipcRenderer.on('downloads:event', listener);
      return () => {
        ipcRenderer.off('downloads:event', listener);
      };
    },
    openFile: (id) => ipcRenderer.invoke('downloads:open-file', id),
    openFolder: (id) => ipcRenderer.invoke('downloads:open-folder', id),
    cancel: (id) => ipcRenderer.invoke('downloads:cancel', id),
    retry: (id) => ipcRenderer.invoke('downloads:retry', id),
    remove: (id) => ipcRenderer.invoke('downloads:remove', id)
  },
  history: {
    record: (entry) => ipcRenderer.invoke('history:record', entry),
    list: () => ipcRenderer.invoke('history:list'),
    search: (query) => ipcRenderer.invoke('history:search', query),
    remove: (url) => ipcRenderer.invoke('history:remove', url),
    clear: () => ipcRenderer.invoke('history:clear')
  },
  bookmarks: {
    list: () => ipcRenderer.invoke('bookmarks:list'),
    add: (input) => ipcRenderer.invoke('bookmarks:add', input),
    remove: (id) => ipcRenderer.invoke('bookmarks:remove', id),
    update: (id, patch) => ipcRenderer.invoke('bookmarks:update', id, patch)
  }
});
