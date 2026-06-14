export type VersionInfo = {
  appName: string
  appVersion: string
  electron: string
  chromium: string
  node: string
  v8: string
  uv: string
  zlib: string
  openssl: string
  platform: string
  arch: string
  userAgent: string
  executablePath: string
  appPath: string
  userDataPath: string
  commandLine: string
}

export type DownloadState = 'progressing' | 'completed' | 'interrupted' | 'canceled'

export type DownloadItem = {
  id: string
  filename: string
  sourceUrl: string
  targetPath: string
  receivedBytes: number
  totalBytes: number | null
  state: DownloadState
  startTime: number
}

export type DownloadsApi = {
  list: () => Promise<DownloadItem[]>
  subscribe: (handler: (items: DownloadItem[]) => void) => () => void
  openFile: (id: string) => Promise<void>
  openFolder: (id: string) => Promise<void>
  cancel: (id: string) => Promise<void>
  retry: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export type HistoryEntry = {
  url: string
  title: string
  favicon?: string
  visitCount: number
  lastVisitedAt: number
}

export type HistoryApi = {
  record: (entry: { url: string; title: string; favicon?: string }) => Promise<void>
  list: () => Promise<HistoryEntry[]>
  search: (query: string) => Promise<HistoryEntry[]>
  remove: (url: string) => Promise<void>
  clear: () => Promise<void>
}

export type Bookmark = {
  id: string
  url: string
  title: string
  favicon?: string
  folder?: string
  createdAt: number
}

export type BookmarkInput = {
  url: string
  title: string
  favicon?: string
  folder?: string
}

export type BookmarksApi = {
  list: () => Promise<Bookmark[]>
  add: (input: BookmarkInput) => Promise<Bookmark>
  remove: (id: string) => Promise<void>
  update: (id: string, patch: { title?: string; folder?: string }) => Promise<void>
}

export type QuickEngineApi = {
  getVersion: () => Promise<string>
  getVersionInfo: () => Promise<VersionInfo>
  openExternal: (url: string) => void
  downloads: DownloadsApi
  history: HistoryApi
  bookmarks: BookmarksApi
}

declare global {
  interface Window {
    quickEngine: QuickEngineApi
  }
}
