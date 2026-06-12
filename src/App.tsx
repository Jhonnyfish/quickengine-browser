import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeInfoIcon,
  BotIcon,
  CalendarDaysIcon,
  CloudIcon,
  DownloadIcon,
  FileTextIcon,
  GlobeIcon,
  HomeIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  MailIcon,
  MonitorIcon,
  NewspaperIcon,
  PackageIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldAlertIcon,
  SparklesIcon,
  SquareIcon,
  StarIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useId, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const NEW_TAB_URL = "kuaiqing://newtab"
const HOME_URL = NEW_TAB_URL
const SEARCH_URL = "https://www.baidu.com/s?wd="
const INTERNAL_VERSION_URL = "chrome://version"

type InternalPageKey = "" | "newtab" | "version"

type BrowserTab = {
  id: string
  title: string
  url: string
  internalPage: InternalPageKey
  loading: boolean
  canGoBack: boolean
  canGoForward: boolean
  favicon: string
}

type BrowserWebView = HTMLElement & {
  loadURL: (url: string) => Promise<void> | void
  getURL: () => string
  canGoBack: () => boolean
  canGoForward: () => boolean
  goBack: () => void
  goForward: () => void
  reload: () => void
  stop: () => void
}

type WebviewEvent = Event & {
  url?: string
  title?: string
  favicons?: string[]
  errorCode?: number
  errorDescription?: string
  validatedURL?: string
}

type SecurityState = {
  label: string
  variant: "secure" | "normal" | "internal" | "local" | "search"
  icon: LucideIcon
}

type QuickLink = {
  label: string
  url: string
  icon: LucideIcon
  accent: string
}

type Recommendation = {
  tag: string
  title: string
  source: string
  time: string
}

const quickLinks: QuickLink[] = [
  {
    label: "快擎邮箱",
    url: "https://mail.qq.com/",
    icon: MailIcon,
    accent: "#3b82f6",
  },
  {
    label: "云端文档",
    url: "https://docs.qq.com/",
    icon: FileTextIcon,
    accent: "#10b981",
  },
  {
    label: "日程表",
    url: "https://calendar.qq.com/",
    icon: CalendarDaysIcon,
    accent: "#f59e0b",
  },
  {
    label: "团队空间",
    url: "https://work.weixin.qq.com/",
    icon: UsersIcon,
    accent: "#8b5cf6",
  },
  {
    label: "应用商店",
    url: "https://www.microsoft.com/store/apps",
    icon: PackageIcon,
    accent: "#ec4899",
  },
  {
    label: "AI 助手",
    url: "https://chat.baidu.com/",
    icon: BotIcon,
    accent: "#22c55e",
  },
]

const recommendations: Recommendation[] = [
  {
    tag: "科技",
    title: "快擎 3.2 发布：全新 AI 智能分屏，效率提升 40%",
    source: "快擎官方博客",
    time: "2 小时前",
  },
  {
    tag: "产品",
    title: "快擎云文档全面支持多人实时协作与离线编辑",
    source: "快擎产品动态",
    time: "5 小时前",
  },
  {
    tag: "安全",
    title: "快擎隐私护盾：端到端加密浏览记录正式上线",
    source: "安全中心",
    time: "昨天",
  },
]

function getInternalPageKey(value: string): InternalPageKey {
  const text = value.trim().toLowerCase()

  if (["kuaiqing://newtab", "kuaiqing://newtab/", "quickengine://newtab"].includes(text)) {
    return "newtab"
  }

  if (
    ["chrome://version", "chrome://version/", "about:version", "quickengine://version"].includes(
      text,
    )
  ) {
    return "version"
  }

  return ""
}

function isInternalUrl(value: string) {
  return Boolean(getInternalPageKey(value))
}

function normalizeInput(value: string) {
  const text = value.trim()

  if (!text) {
    return HOME_URL
  }

  const internalPage = getInternalPageKey(text)

  if (internalPage === "newtab") {
    return NEW_TAB_URL
  }

  if (internalPage === "version") {
    return INTERNAL_VERSION_URL
  }

  if (/^(localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:\/.*)?$/i.test(text)) {
    return `http://${text}`
  }

  try {
    const url = new URL(text)
    const hasExplicitScheme = /^[a-z][a-z\d+.-]*:/i.test(text)

    if (hasExplicitScheme && ["http:", "https:", "file:", "about:"].includes(url.protocol)) {
      return url.href
    }
  } catch {
    // Continue with browser-style URL inference below.
  }

  if (!/\s/.test(text) && text.includes(".")) {
    try {
      return new URL(`https://${text}`).href
    } catch {
      // Fall back to search for malformed domain-like input.
    }
  }

  return `${SEARCH_URL}${encodeURIComponent(text)}`
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function renderVersionRows(rows: Array<[string, string]>) {
  return rows
    .map(
      ([label, value]) => `
        <tr>
          <th>${escapeHtml(label)}</th>
          <td>${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("")
}

async function createVersionPageHtml() {
  const info = await window.quickEngine.getVersionInfo()
  const rows: Array<[string, string]> = [
    ["快擎浏览器", info.appVersion],
    ["Electron", info.electron],
    ["Chromium", info.chromium],
    ["Node.js", info.node],
    ["V8", info.v8],
    ["libuv", info.uv],
    ["zlib", info.zlib],
    ["OpenSSL", info.openssl],
    ["操作系统", `${info.platform} ${info.arch}`],
    ["用户代理", info.userAgent],
    ["命令行", info.commandLine],
    ["可执行文件路径", info.executablePath],
    ["用户数据目录", info.userDataPath],
    ["应用目录", info.appPath],
  ]

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>版本信息</title>
    <style>
      :root {
        color-scheme: light;
        --text: #18212f;
        --muted: #64748b;
        --border: #d8e0ea;
        --surface: #ffffff;
        --background: #f5f7fb;
        --accent: #2563eb;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: var(--text);
        background: var(--background);
        font-family: "Microsoft YaHei", "Segoe UI", system-ui, sans-serif;
      }

      main {
        width: min(980px, calc(100vw - 48px));
        margin: 42px auto;
      }

      h1 {
        margin: 0 0 8px;
        color: var(--accent);
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 0;
      }

      .subtitle {
        margin: 0 0 22px;
        color: var(--muted);
        font-size: 14px;
      }

      table {
        width: 100%;
        overflow: hidden;
        background: var(--surface);
        border: 1px solid var(--border);
        border-collapse: collapse;
        border-radius: 8px;
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
      }

      th,
      td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--border);
        font-size: 13px;
        line-height: 1.5;
        vertical-align: top;
      }

      tr:last-child th,
      tr:last-child td {
        border-bottom: 0;
      }

      th {
        width: 170px;
        color: #334155;
        background: #f8fafc;
        font-weight: 600;
        text-align: left;
        white-space: nowrap;
      }

      td {
        overflow-wrap: anywhere;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(info.appName)} 版本信息</h1>
      <p class="subtitle">地址：${INTERNAL_VERSION_URL}</p>
      <table>
        <tbody>${renderVersionRows(rows)}</tbody>
      </table>
    </main>
  </body>
</html>`
}

function getSecurityState(value: string): SecurityState {
  try {
    const url = new URL(value)

    if (url.protocol === "https:") {
      return { label: "安全", variant: "secure", icon: LockKeyholeIcon }
    }

    if (url.protocol === "http:") {
      return { label: "普通", variant: "normal", icon: ShieldAlertIcon }
    }

    if (["chrome:", "quickengine:", "about:", "kuaiqing:"].includes(url.protocol)) {
      return { label: "内部", variant: "internal", icon: BadgeInfoIcon }
    }

    return { label: "本地", variant: "local", icon: GlobeIcon }
  } catch {
    return { label: "搜索", variant: "search", icon: SearchIcon }
  }
}

function getDisplayTitle(tab: BrowserTab) {
  return tab.title || tab.url || "新标签页"
}

function KuaiqingLogo({
  className,
  size = 20,
}: {
  className?: string
  size?: number
}) {
  const gradientId = useId().replaceAll(":", "")

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 32 32"
      width={size}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="32" y1="0" y2="32">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect fill={`url(#${gradientId})`} height="32" rx="8" width="32" />
      <path
        d="M9 22L16 10L23 22"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
      <path d="M12 18H20" stroke="#fff" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  )
}

function ToolButton({
  className,
  label,
  disabled,
  onClick,
  children,
}: {
  className?: string
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          className={cn("browser-tool-button", className)}
          disabled={disabled}
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function NewTabPage({
  onNavigate,
  onSubmitInput,
}: {
  onNavigate: (url: string) => void
  onSubmitInput: (value: string) => void
}) {
  const [draft, setDraft] = useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmitInput(draft)
  }

  return (
    <section className="newtab-page" aria-label="快擎新标签页">
      <div className="newtab-content">
        <div className="newtab-brand">
          <KuaiqingLogo size={38} />
          <div>
            <h1>快擎</h1>
            <p>极速浏览，擎动未来</p>
          </div>
        </div>

        <form className="newtab-search" onSubmit={handleSubmit}>
          <SearchIcon aria-hidden="true" className="newtab-search-icon" />
          <input
            aria-label="搜索或输入网址"
            autoComplete="off"
            placeholder="搜索或输入网址"
            spellCheck={false}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <span className="keyboard-hint">Ctrl L</span>
        </form>

        <div className="quick-links" aria-label="快捷入口">
          {quickLinks.map((link) => {
            const Icon = link.icon

            return (
              <button
                key={link.label}
                className="quick-link"
                style={{ "--quick-link-accent": link.accent } as React.CSSProperties}
                type="button"
                onClick={() => onNavigate(link.url)}
              >
                <span className="quick-link-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span>{link.label}</span>
              </button>
            )
          })}
        </div>

        <div className="newtab-divider" />

        <section className="recommendations" aria-label="为你推荐">
          <div className="recommendations-header">
            <h2>为你推荐</h2>
            <button type="button">自定义</button>
          </div>

          <div className="recommendation-grid">
            {recommendations.map((item) => (
              <article key={item.title} className="recommendation-card">
                <span>{item.tag}</span>
                <h3>{item.title}</h3>
                <p>
                  {item.source} · {item.time}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export function App() {
  const browserStackRef = useRef<HTMLDivElement | null>(null)
  const webviewsRef = useRef(new Map<string, BrowserWebView>())
  const tabsRef = useRef<BrowserTab[]>([])
  const activeTabIdRef = useRef<string | null>(null)
  const nextTabIdRef = useRef(1)
  const initializedRef = useRef(false)
  const statusTimerRef = useRef<number | undefined>(undefined)

  const [tabs, setTabs] = useState<BrowserTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [addressDraft, setAddressDraft] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [statusVisible, setStatusVisible] = useState(false)

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? null,
    [activeTabId, tabs],
  )
  const security = getSecurityState(activeTab?.url ?? "")
  const SecurityIcon = security.icon

  function setTabsSynced(updater: (current: BrowserTab[]) => BrowserTab[]) {
    setTabs((current) => {
      const next = updater(current)
      tabsRef.current = next
      return next
    })
  }

  function updateTab(tabId: string, patch: Partial<BrowserTab>) {
    setTabsSynced((current) =>
      current.map((tab) => (tab.id === tabId ? { ...tab, ...patch } : tab)),
    )
  }

  function setActiveTab(tabId: string | null) {
    activeTabIdRef.current = tabId
    setActiveTabId(tabId)

    for (const [id, webview] of webviewsRef.current) {
      const tab = tabsRef.current.find((item) => item.id === id)
      const shouldShowWebview = id === tabId && tab?.internalPage !== "newtab"
      webview.classList.toggle("is-active", shouldShowWebview)
    }
  }

  function showStatus(message: string, duration = 2400) {
    window.clearTimeout(statusTimerRef.current)
    setStatusMessage(message)
    setStatusVisible(true)
    statusTimerRef.current = window.setTimeout(() => {
      setStatusVisible(false)
    }, duration)
  }

  function updateNavigationState(tabId: string) {
    const webview = webviewsRef.current.get(tabId)
    const tab = tabsRef.current.find((item) => item.id === tabId)

    if (!webview || !tab) {
      return
    }

    const patch: Partial<BrowserTab> = {
      canGoBack: false,
      canGoForward: false,
    }

    try {
      patch.canGoBack = webview.canGoBack()
      patch.canGoForward = webview.canGoForward()

      if (!tab.internalPage) {
        const currentUrl = webview.getURL()
        if (currentUrl) {
          patch.url = currentUrl
        }
      }
    } catch {
      patch.canGoBack = false
      patch.canGoForward = false
    }

    updateTab(tabId, patch)
  }

  async function loadInternalPage(tabId: string, url: string) {
    const pageKey = getInternalPageKey(url)

    if (!pageKey) {
      return false
    }

    if (pageKey === "newtab") {
      webviewsRef.current.get(tabId)?.stop?.()
      updateTab(tabId, {
        internalPage: "newtab",
        url: NEW_TAB_URL,
        title: "新标签页",
        loading: false,
        canGoBack: false,
        canGoForward: false,
        favicon: "",
      })

      if (activeTabIdRef.current === tabId) {
        setActiveTab(tabId)
      }

      return true
    }

    const webview = webviewsRef.current.get(tabId)
    if (!webview) {
      return true
    }

    updateTab(tabId, {
      internalPage: "version",
      url: INTERNAL_VERSION_URL,
      title: "版本信息",
      loading: true,
      favicon: "",
    })

    if (activeTabIdRef.current === tabId) {
      setActiveTab(tabId)
    }

    const html = await createVersionPageHtml()
    await Promise.resolve(webview.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`))
    updateTab(tabId, { loading: false })
    updateNavigationState(tabId)
    return true
  }

  async function loadTabUrl(tabId: string, url: string) {
    const webview = webviewsRef.current.get(tabId)

    if (!webview) {
      return
    }

    if (await loadInternalPage(tabId, url)) {
      return
    }

    updateTab(tabId, {
      internalPage: "",
      url,
      loading: true,
    })

    if (activeTabIdRef.current === tabId) {
      setActiveTab(tabId)
    }

    await Promise.resolve(webview.loadURL(url))
  }

  function attachWebviewEvents(tabId: string, webview: BrowserWebView) {
    webview.addEventListener("will-navigate", (event) => {
      const webviewEvent = event as WebviewEvent

      if (webviewEvent.url && isInternalUrl(webviewEvent.url)) {
        webviewEvent.preventDefault()
        void loadTabUrl(tabId, webviewEvent.url)
      }
    })

    webview.addEventListener("did-start-loading", () => {
      updateTab(tabId, { loading: true })
      updateNavigationState(tabId)
    })

    webview.addEventListener("did-stop-loading", () => {
      updateTab(tabId, { loading: false })
      updateNavigationState(tabId)
    })

    webview.addEventListener("did-navigate", (event) => {
      const webviewEvent = event as WebviewEvent
      const tab = tabsRef.current.find((item) => item.id === tabId)

      if (!tab?.internalPage && webviewEvent.url) {
        updateTab(tabId, { url: webviewEvent.url })
      }

      updateNavigationState(tabId)
    })

    webview.addEventListener("did-navigate-in-page", (event) => {
      const webviewEvent = event as WebviewEvent
      const tab = tabsRef.current.find((item) => item.id === tabId)

      if (!tab?.internalPage && webviewEvent.url) {
        updateTab(tabId, { url: webviewEvent.url })
      }

      updateNavigationState(tabId)
    })

    webview.addEventListener("page-title-updated", (event) => {
      const webviewEvent = event as WebviewEvent
      const tab = tabsRef.current.find((item) => item.id === tabId)

      if (!tab?.internalPage) {
        updateTab(tabId, { title: webviewEvent.title || "新标签页" })
      }
    })

    webview.addEventListener("page-favicon-updated", (event) => {
      const webviewEvent = event as WebviewEvent
      const tab = tabsRef.current.find((item) => item.id === tabId)

      if (!tab?.internalPage) {
        updateTab(tabId, { favicon: webviewEvent.favicons?.[0] ?? "" })
      }
    })

    webview.addEventListener("did-fail-load", (event) => {
      const webviewEvent = event as WebviewEvent

      if (webviewEvent.errorCode === -3) {
        return
      }

      const tab = tabsRef.current.find((item) => item.id === tabId)
      updateTab(tabId, {
        loading: false,
        title: "页面加载失败",
        url: tab?.internalPage ? tab.url : webviewEvent.validatedURL || tab?.url || "",
      })
      showStatus(`加载失败：${webviewEvent.errorDescription ?? "未知错误"}`)
      updateNavigationState(tabId)
    })

    webview.addEventListener("new-window", (event) => {
      const webviewEvent = event as WebviewEvent
      event.preventDefault()

      if (webviewEvent.url) {
        createTab(webviewEvent.url)
      }
    })

    webview.addEventListener("update-target-url", (event) => {
      const webviewEvent = event as WebviewEvent

      if (webviewEvent.url) {
        showStatus(webviewEvent.url, 1200)
      }
    })
  }

  function createTab(initialUrl = HOME_URL, options: { activate?: boolean } = {}) {
    const browserStack = browserStackRef.current

    if (!browserStack) {
      return
    }

    const tabId = `tab-${nextTabIdRef.current++}`
    const internalPage = getInternalPageKey(initialUrl)
    const tab: BrowserTab = {
      id: tabId,
      title: internalPage === "version" ? "版本信息" : "新标签页",
      url: internalPage === "newtab" ? NEW_TAB_URL : initialUrl,
      internalPage,
      loading: false,
      canGoBack: false,
      canGoForward: false,
      favicon: "",
    }

    const webview = document.createElement("webview") as BrowserWebView
    webview.className = "browser-view"
    webview.dataset.tabId = tabId
    webview.setAttribute("src", "about:blank")
    webview.setAttribute("partition", "persist:quick-engine")
    webview.setAttribute("webpreferences", "contextIsolation=yes,nodeIntegration=no,javascript=yes")

    webviewsRef.current.set(tabId, webview)
    attachWebviewEvents(tabId, webview)
    browserStack.append(webview)

    setTabsSynced((current) => [...current, tab])

    if (options.activate !== false) {
      setActiveTab(tabId)
    }

    void loadTabUrl(tabId, initialUrl)
  }

  function closeTab(tabId: string) {
    const current = tabsRef.current
    const closingIndex = current.findIndex((tab) => tab.id === tabId)

    if (closingIndex === -1) {
      return
    }

    webviewsRef.current.get(tabId)?.remove()
    webviewsRef.current.delete(tabId)

    const remaining = current.filter((tab) => tab.id !== tabId)
    setTabsSynced(() => remaining)

    if (remaining.length === 0) {
      setActiveTab(null)
      createTab(HOME_URL)
      return
    }

    if (activeTabIdRef.current === tabId) {
      const nextTab = remaining[Math.max(0, closingIndex - 1)]
      setActiveTab(nextTab.id)
    }
  }

  function navigateActiveTab(url: string) {
    const tabId = activeTabIdRef.current

    if (!tabId) {
      createTab(url)
      return
    }

    void loadTabUrl(tabId, url)
  }

  function submitAddressInput(value: string) {
    navigateActiveTab(normalizeInput(value))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitAddressInput(addressDraft)
  }

  useEffect(() => {
    tabsRef.current = tabs
  }, [tabs])

  useEffect(() => {
    activeTabIdRef.current = activeTabId
  }, [activeTabId])

  useEffect(() => {
    setAddressDraft(activeTab?.url ?? "")
  }, [activeTab?.url, activeTabId])

  useEffect(() => {
    if (initializedRef.current) {
      return
    }

    initializedRef.current = true
    createTab(HOME_URL)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const modifierPressed = event.ctrlKey || event.metaKey

      if (modifierPressed && event.key.toLowerCase() === "l") {
        event.preventDefault()
        const input = document.querySelector<HTMLInputElement>("#addressInput")
        input?.focus()
        input?.select()
      }

      if (modifierPressed && event.key.toLowerCase() === "t") {
        event.preventDefault()
        createTab(HOME_URL)
      }

      if (modifierPressed && event.key.toLowerCase() === "w") {
        event.preventDefault()
        const tabId = activeTabIdRef.current
        if (tabId) {
          closeTab(tabId)
        }
      }

      if (event.key === "F5") {
        event.preventDefault()
        const tabId = activeTabIdRef.current
        if (tabId) {
          const tab = tabsRef.current.find((item) => item.id === tabId)
          if (tab?.internalPage === "newtab") {
            void loadTabUrl(tabId, NEW_TAB_URL)
          } else {
            webviewsRef.current.get(tabId)?.reload?.()
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <TooltipProvider>
      <div className="quick-browser-shell">
        <header className="browser-chrome">
          <div className="browser-tab-row">
            <div className="browser-brand">
              <KuaiqingLogo size={22} />
              <span>快擎</span>
            </div>

            <div className="browser-tabs" role="tablist">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className="browser-tab"
                  data-active={tab.id === activeTabId}
                  role="presentation"
                >
                  <button
                    aria-selected={tab.id === activeTabId}
                    className="browser-tab-main"
                    role="tab"
                    title={getDisplayTitle(tab)}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.favicon ? (
                      <img alt="" className="tab-favicon" src={tab.favicon} />
                    ) : tab.loading ? (
                      <LoaderCircleIcon aria-hidden="true" className="tab-icon animate-spin" />
                    ) : tab.internalPage === "newtab" ? (
                      <KuaiqingLogo className="tab-brand-mark" size={15} />
                    ) : tab.internalPage === "version" ? (
                      <BadgeInfoIcon aria-hidden="true" className="tab-icon" />
                    ) : (
                      <ZapIcon aria-hidden="true" className="tab-icon" />
                    )}
                    <span>{getDisplayTitle(tab)}</span>
                  </button>
                  <Button
                    aria-label="关闭标签页"
                    className="browser-tab-close"
                    size="icon-xs"
                    title="关闭标签页"
                    type="button"
                    variant="ghost"
                    onClick={() => closeTab(tab.id)}
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>

            <ToolButton
              className="browser-new-tab-button"
              label="新建标签页"
              onClick={() => createTab(HOME_URL)}
            >
              <PlusIcon aria-hidden="true" />
            </ToolButton>
          </div>

          <form className="browser-toolbar" onSubmit={handleSubmit}>
            <div className="toolbar-nav">
              <ToolButton
                disabled={!activeTab?.canGoBack}
                label="后退"
                onClick={() => {
                  if (activeTab?.canGoBack) {
                    webviewsRef.current.get(activeTab.id)?.goBack()
                  }
                }}
              >
                <ArrowLeftIcon aria-hidden="true" />
              </ToolButton>
              <ToolButton
                disabled={!activeTab?.canGoForward}
                label="前进"
                onClick={() => {
                  if (activeTab?.canGoForward) {
                    webviewsRef.current.get(activeTab.id)?.goForward()
                  }
                }}
              >
                <ArrowRightIcon aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label={activeTab?.loading ? "停止加载" : "刷新"}
                onClick={() => {
                  if (!activeTab) {
                    return
                  }

                  const webview = webviewsRef.current.get(activeTab.id)
                  if (activeTab.loading) {
                    webview?.stop?.()
                  } else if (activeTab.internalPage === "newtab") {
                    navigateActiveTab(NEW_TAB_URL)
                  } else {
                    webview?.reload?.()
                  }
                }}
              >
                {activeTab?.loading ? (
                  <SquareIcon aria-hidden="true" />
                ) : (
                  <RefreshCwIcon aria-hidden="true" />
                )}
              </ToolButton>
              <ToolButton label="主页" onClick={() => navigateActiveTab(HOME_URL)}>
                <HomeIcon aria-hidden="true" />
              </ToolButton>
            </div>

            <div className="browser-address" data-security={security.variant}>
              <SecurityIcon aria-hidden="true" />
              <span className="security-label">{security.label}</span>
              <input
                autoComplete="off"
                id="addressInput"
                placeholder="输入网址或搜索"
                spellCheck={false}
                value={addressDraft}
                onChange={(event) => setAddressDraft(event.target.value)}
              />
              <span className="keyboard-hint address-hint">Ctrl L</span>
              <Button
                aria-label="前往"
                className="browser-address-submit"
                size="icon-sm"
                type="submit"
                variant="ghost"
              >
                <SearchIcon aria-hidden="true" />
              </Button>
            </div>

            <div className="toolbar-actions">
              <ToolButton label="收藏" onClick={() => showStatus("收藏功能将在后续版本提供")}>
                <StarIcon aria-hidden="true" />
              </ToolButton>
              <ToolButton label="下载" onClick={() => showStatus("下载管理将在后续版本提供")}>
                <DownloadIcon aria-hidden="true" />
              </ToolButton>
              <ToolButton label="阅读视图" onClick={() => showStatus("阅读视图将在后续版本提供")}>
                <MonitorIcon aria-hidden="true" />
              </ToolButton>
              <div className="browser-avatar" aria-label="快擎账号">
                擎
              </div>
            </div>
          </form>
        </header>

        <main className="browser-content">
          <div ref={browserStackRef} className="browser-stack" aria-label="网页内容" />
          {activeTab?.internalPage === "newtab" ? (
            <NewTabPage onNavigate={navigateActiveTab} onSubmitInput={submitAddressInput} />
          ) : null}
          <div className={cn("status-text", statusVisible && "is-visible")} aria-live="polite">
            {statusMessage}
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
