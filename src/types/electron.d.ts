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

export type QuickEngineApi = {
  getVersion: () => Promise<string>
  getVersionInfo: () => Promise<VersionInfo>
  openExternal: (url: string) => void
}

declare global {
  interface Window {
    quickEngine: QuickEngineApi
  }
}
