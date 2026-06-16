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
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (patch) => ipcRenderer.invoke('settings:set', patch),
    listSearchEngines: () => ipcRenderer.invoke('settings:list-search-engines'),
    listStartupBehaviors: () => ipcRenderer.invoke('settings:list-startup-behaviors'),
    pickDownloadDirectory: () => ipcRenderer.invoke('settings:pick-download-directory'),
    hasRestoreHandler: () => ipcRenderer.invoke('settings:has-restore-handler'),
    invokeRestore: () => ipcRenderer.invoke('settings:invoke-restore')
  },
  session: {
    save: (snapshot) => ipcRenderer.invoke('session:save', snapshot),
    load: () => ipcRenderer.invoke('session:load'),
    clear: () => ipcRenderer.invoke('session:clear'),
    pushRecentlyClosed: (entry) => ipcRenderer.invoke('session:push-recently-closed', entry),
    listRecentlyClosed: () => ipcRenderer.invoke('session:list-recently-closed'),
    popRecentlyClosed: () => ipcRenderer.invoke('session:pop-recently-closed')
  }
});
