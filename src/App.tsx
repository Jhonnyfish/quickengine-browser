import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeInfoIcon,
  BookmarkIcon,
  BotIcon,
  CalendarDaysIcon,
  CloudIcon,
  DownloadIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  HistoryIcon,
  HomeIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  MailIcon,
  NewspaperIcon,
  PackageIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SettingsIcon,
  ShieldAlertIcon,
  SparklesIcon,
  SquareIcon,
  StarIcon,
  TrashIcon,
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
import type {
  Bookmark,
  BrowserPreferences,
  DownloadItem,
  HistoryEntry,
  SavedSession,
  SearchEngineOption,
  StartupBehaviorOption,
} from "./types/electron"

const NEW_TAB_URL = "kuaiqing://newtab"
const DEFAULT_HOME_URL = NEW_TAB_URL
const DEFAULT_SEARCH_URL = "https://www.baidu.com/s?wd="
const INTERNAL_VERSION_URL = "chrome://version"
const INTERNAL_SETTINGS_URL = "kuaiqing://settings"

type InternalPageKey = "" | "newtab" | "version" | "settings"

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

  if (["kuaiqing://settings", "kuaiqing://settings/", "quickengine://settings"].includes(text)) {
    return "settings"
  }

  return ""
}

function isInternalUrl(value: string) {
  return Boolean(getInternalPageKey(value))
}

function normalizeInput(value: string, options: { searchUrl?: string; homeUrl?: string } = {}) {
  const text = value.trim()
  const searchUrl = options.searchUrl ?? DEFAULT_SEARCH_URL
  const homeUrl = options.homeUrl ?? DEFAULT_HOME_URL

  if (!text) {
    return homeUrl
  }

  const internalPage = getInternalPageKey(text)

  if (internalPage === "newtab") {
    return NEW_TAB_URL
  }

  if (internalPage === "version") {
    return INTERNAL_VERSION_URL
  }

  if (internalPage === "settings") {
    return INTERNAL_SETTINGS_URL
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

  return `${searchUrl}${encodeURIComponent(text)}`
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
  bookmarks,
  history,
}: {
  onNavigate: (url: string) => void
  onSubmitInput: (value: string) => void
  bookmarks: Bookmark[]
  history: HistoryEntry[]
}) {
  const [draft, setDraft] = useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmitInput(draft)
  }

  const pinnedShortcuts = bookmarks.slice(0, 8)
  const recentShortcuts = history
    .filter((entry) => !bookmarks.some((bookmark) => bookmark.url === entry.url))
    .slice(0, pinnedShortcuts.length === 0 ? 8 : Math.max(0, 8 - pinnedShortcuts.length))

  const hasShortcuts = pinnedShortcuts.length > 0 || recentShortcuts.length > 0

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

        {hasShortcuts ? (
          <section className="newtab-shortcuts" aria-label="我的快捷入口">
            <div className="newtab-shortcuts-header">
              <h2>我的快捷入口</h2>
            </div>
            <div className="newtab-shortcut-grid">
              {pinnedShortcuts.map((bookmark) => (
                <button
                  key={bookmark.id}
                  className="newtab-shortcut"
                  title={bookmark.url}
                  type="button"
                  onClick={() => onNavigate(bookmark.url)}
                >
                  <span className="newtab-shortcut-icon">
                    <EntryFavicon src={bookmark.favicon} />
                  </span>
                  <span className="newtab-shortcut-label">{bookmark.title}</span>
                </button>
              ))}
              {recentShortcuts.map((entry) => (
                <button
                  key={entry.url}
                  className="newtab-shortcut"
                  title={entry.url}
                  type="button"
                  onClick={() => onNavigate(entry.url)}
                >
                  <span className="newtab-shortcut-icon">
                    <EntryFavicon src={entry.favicon} />
                  </span>
                  <span className="newtab-shortcut-label">{entry.title}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

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

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const DOWNLOAD_STATE_LABEL: Record<string, string> = {
  progressing: "下载中",
  completed: "已完成",
  interrupted: "已中断",
  canceled: "已取消",
}

function getDownloadPercent(item: DownloadItem) {
  if (!item.totalBytes) return null
  return Math.min(100, Math.max(0, Math.round((item.receivedBytes / item.totalBytes) * 100)))
}

type DownloadAction = "openFile" | "openFolder" | "cancel" | "retry" | "remove"

function DownloadRow({
  item,
  onAction,
}: {
  item: DownloadItem
  onAction: (action: DownloadAction, id: string) => void
}) {
  const percent = getDownloadPercent(item)
  const isActive = item.state === "progressing"

  return (
    <li className="download-row" data-state={item.state}>
      <div className="download-row-main">
        <div className="download-row-name" title={item.filename}>
          {item.filename}
        </div>
        <div className="download-row-meta">
          {isActive
            ? percent !== null
              ? `${percent}% · ${formatBytes(item.receivedBytes)} / ${formatBytes(item.totalBytes ?? 0)}`
              : `${formatBytes(item.receivedBytes)} 已下载`
            : DOWNLOAD_STATE_LABEL[item.state] ?? item.state}
        </div>
        {isActive && (
          <div className="download-row-progress" aria-hidden="true">
            <div
              className="download-row-progress-bar"
              style={percent !== null ? { width: `${percent}%` } : { width: "100%", opacity: 0.35 }}
            />
          </div>
        )}
      </div>
      <div className="download-row-actions">
        {item.state === "completed" && (
          <>
            <Button
              aria-label="打开文件"
              size="icon-xs"
              title="打开文件"
              variant="ghost"
              onClick={() => onAction("openFile", item.id)}
            >
              <FileTextIcon aria-hidden="true" />
            </Button>
            <Button
              aria-label="打开所在文件夹"
              size="icon-xs"
              title="打开所在文件夹"
              variant="ghost"
              onClick={() => onAction("openFolder", item.id)}
            >
              <FolderIcon aria-hidden="true" />
            </Button>
          </>
        )}
        {isActive && (
          <Button
            aria-label="取消下载"
            size="icon-xs"
            title="取消"
            variant="ghost"
            onClick={() => onAction("cancel", item.id)}
          >
            <XIcon aria-hidden="true" />
          </Button>
        )}
        {(item.state === "interrupted" || item.state === "canceled") && (
          <Button
            aria-label="重试下载"
            size="icon-xs"
            title="重试"
            variant="ghost"
            onClick={() => onAction("retry", item.id)}
          >
            <RefreshCwIcon aria-hidden="true" />
          </Button>
        )}
        <Button
          aria-label="从列表移除"
          size="icon-xs"
          title="移除"
          variant="ghost"
          onClick={() => onAction("remove", item.id)}
        >
          <TrashIcon aria-hidden="true" />
        </Button>
      </div>
    </li>
  )
}

function DownloadsPanel({
  items,
  open,
  onClose,
  onAction,
}: {
  items: DownloadItem[]
  open: boolean
  onClose: () => void
  onAction: (action: DownloadAction, id: string) => void
}) {
  if (!open) return null

  const activeCount = items.filter((item) => item.state === "progressing").length

  return (
    <section className="downloads-panel" role="dialog" aria-label="下载管理">
      <header className="downloads-panel-header">
        <div className="downloads-panel-title">
          <DownloadIcon aria-hidden="true" />
          <h2>下载</h2>
          {activeCount > 0 && (
            <span className="downloads-panel-count">{activeCount} 个进行中</span>
          )}
        </div>
        <Button aria-label="关闭下载面板" size="icon-xs" variant="ghost" onClick={onClose}>
          <XIcon aria-hidden="true" />
        </Button>
      </header>
      <ul className="downloads-list">
        {items.length === 0 ? (
          <li className="downloads-empty">暂无下载</li>
        ) : (
          items.map((item) => (
            <DownloadRow key={item.id} item={item} onAction={onAction} />
          ))
        )}
      </ul>
    </section>
  )
}

function isRecordableUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function formatRelativeTime(timestamp: number) {
  const delta = Date.now() - timestamp
  if (delta < 60_000) return "刚刚"
  if (delta < 3600_000) return `${Math.floor(delta / 60_000)} 分钟前`
  if (delta < 86_400_000) return `${Math.floor(delta / 3600_000)} 小时前`
  if (delta < 7 * 86_400_000) return `${Math.floor(delta / 86_400_000)} 天前`
  try {
    return new Date(timestamp).toLocaleDateString("zh-CN")
  } catch {
    return ""
  }
}

type EntryListItem =
  | { kind: "history"; entry: HistoryEntry }
  | { kind: "bookmark"; entry: Bookmark }

function EntryFavicon({ src, alt = "" }: { src?: string; alt?: string }) {
  if (src) {
    return <img alt={alt} className="entry-favicon-img" src={src} />
  }
  return <GlobeIcon aria-hidden="true" />
}

function EntryRow({
  item,
  onOpen,
  onRemove,
  extra,
}: {
  item: EntryListItem
  onOpen: (url: string) => void
  onRemove: () => void
  extra?: React.ReactNode
}) {
  const { entry } = item
  return (
    <li className="entry-row" data-kind={item.kind}>
      <button
        type="button"
        className="entry-row-main"
        title={entry.url}
        onClick={() => onOpen(entry.url)}
      >
        <span className="entry-favicon">
          <EntryFavicon src={entry.favicon} />
        </span>
        <span className="entry-row-text">
          <span className="entry-row-title">{entry.title}</span>
          <span className="entry-row-url">{entry.url}</span>
        </span>
        {extra}
      </button>
      <Button
        aria-label="移除"
        size="icon-xs"
        title="移除"
        variant="ghost"
        onClick={onRemove}
      >
        <XIcon aria-hidden="true" />
      </Button>
    </li>
  )
}

function DataPanelShell({
  icon,
  title,
  open,
  onClose,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  headerActions,
  children,
}: {
  icon: React.ReactNode
  title: string
  open: boolean
  onClose: () => void
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  headerActions?: React.ReactNode
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <section className="data-panel" role="dialog" aria-label={title}>
      <header className="data-panel-header">
        <div className="data-panel-title">
          {icon}
          <h2>{title}</h2>
        </div>
        <div className="data-panel-actions">
          {headerActions}
          <Button aria-label="关闭" size="icon-xs" variant="ghost" onClick={onClose}>
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      </header>
      <div className="data-panel-search">
        <SearchIcon aria-hidden="true" />
        <input
          aria-label={searchPlaceholder}
          autoComplete="off"
          placeholder={searchPlaceholder}
          spellCheck={false}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <ul className="data-panel-list">{children}</ul>
    </section>
  )
}

function HistoryPanel({
  entries,
  open,
  onClose,
  onOpen,
  onRemove,
  onClear,
}: {
  entries: HistoryEntry[]
  open: boolean
  onClose: () => void
  onOpen: (url: string) => void
  onRemove: (url: string) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState("")
  const filtered = query.trim()
    ? entries.filter(
        (e) =>
          e.url.toLowerCase().includes(query.toLowerCase()) ||
          (e.title || "").toLowerCase().includes(query.toLowerCase()),
      )
    : entries

  return (
    <DataPanelShell
      icon={<HistoryIcon aria-hidden="true" />}
      title="历史记录"
      open={open}
      onClose={onClose}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="搜索历史"
      headerActions={
        <Button
          aria-label="清空全部"
          size="icon-xs"
          title="清空全部"
          variant="ghost"
          disabled={entries.length === 0}
          onClick={onClear}
        >
          <TrashIcon aria-hidden="true" />
        </Button>
      }
    >
      {filtered.length === 0 ? (
        <li className="data-panel-empty">
          {entries.length === 0 ? "暂无历史" : "未找到匹配项"}
        </li>
      ) : (
        filtered.map((entry) => (
          <EntryRow
            key={entry.url}
            item={{ kind: "history", entry }}
            onOpen={onOpen}
            onRemove={() => onRemove(entry.url)}
            extra={
              <span className="entry-row-time">
                {formatRelativeTime(entry.lastVisitedAt)}
              </span>
            }
          />
        ))
      )}
    </DataPanelShell>
  )
}

function BookmarksPanel({
  entries,
  open,
  onClose,
  onOpen,
  onRemove,
}: {
  entries: Bookmark[]
  open: boolean
  onClose: () => void
  onOpen: (url: string) => void
  onRemove: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const filtered = query.trim()
    ? entries.filter(
        (b) =>
          b.url.toLowerCase().includes(query.toLowerCase()) ||
          (b.title || "").toLowerCase().includes(query.toLowerCase()),
      )
    : entries

  return (
    <DataPanelShell
      icon={<BookmarkIcon aria-hidden="true" />}
      title="书签"
      open={open}
      onClose={onClose}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="搜索书签"
    >
      {filtered.length === 0 ? (
        <li className="data-panel-empty">
          {entries.length === 0 ? "暂无书签" : "未找到匹配项"}
        </li>
      ) : (
        filtered.map((entry) => (
          <EntryRow
            key={entry.id}
            item={{ kind: "bookmark", entry }}
            onOpen={onOpen}
            onRemove={() => onRemove(entry.id)}
          />
        ))
      )}
    </DataPanelShell>
  )
}

function SettingsPage({
  preferences,
  searchEngines,
  startupBehaviors,
  onChange,
  onPickDownloadDirectory,
  onAddStartupPage,
  onRemoveStartupPage,
}: {
  preferences: BrowserPreferences
  searchEngines: SearchEngineOption[]
  startupBehaviors: StartupBehaviorOption[]
  onChange: (patch: Partial<BrowserPreferences>) => void
  onPickDownloadDirectory: () => Promise<string | null>
  onAddStartupPage: (url: string) => void
  onRemoveStartupPage: (url: string) => void
}) {
  const [startupPageDraft, setStartupPageDraft] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  function flash(message: string) {
    setStatusMessage(message)
    window.setTimeout(() => setStatusMessage(null), 1800)
  }

  function handleSearchEngineChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ searchEngine: event.target.value })
    flash("默认搜索引擎已更新")
  }

  function handleStartupBehaviorChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ startupBehavior: event.target.value as BrowserPreferences["startupBehavior"] })
    flash("启动行为已更新")
  }

  function handleHomePageChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange({ homePage: event.target.value.trim() || DEFAULT_HOME_URL })
  }

  function handleHomePageBlur() {
    flash("主页已更新")
  }

  async function handlePickDirectory() {
    const selected = await onPickDownloadDirectory()
    if (selected) {
      onChange({ downloadDirectory: selected })
      flash("下载目录已更新")
    }
  }

  function handleResetDownloadDirectory() {
    onChange({ downloadDirectory: "" })
    flash("下载目录已恢复为系统默认")
  }

  function handleAddStartupPage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const url = startupPageDraft.trim()
    if (!url) return
    if (preferences.startupPages.includes(url)) {
      setStartupPageDraft("")
      return
    }
    onAddStartupPage(url)
    setStartupPageDraft("")
    flash("启动页面已添加")
  }

  return (
    <section className="settings-page" aria-label="快擎浏览器设置">
      <div className="settings-content">
        <header className="settings-header">
          <KuaiqingLogo size={32} />
          <div>
            <h1>设置</h1>
            <p>自定义搜索、启动、主页与下载等浏览器偏好</p>
          </div>
        </header>

        <section className="settings-section">
          <header className="settings-section-header">
            <SearchIcon aria-hidden="true" />
            <div>
              <h2>搜索引擎</h2>
              <p>从地址栏或新标签页提交搜索时使用的引擎</p>
            </div>
          </header>
          <div className="settings-row">
            <label htmlFor="settings-search-engine">默认搜索引擎</label>
            <select
              id="settings-search-engine"
              value={preferences.searchEngine}
              onChange={handleSearchEngineChange}
            >
              {searchEngines.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="settings-section">
          <header className="settings-section-header">
            <ZapIcon aria-hidden="true" />
            <div>
              <h2>启动行为</h2>
              <p>选择应用启动时打开的内容</p>
            </div>
          </header>
          <div className="settings-row">
            <label htmlFor="settings-startup-behavior">启动时</label>
            <select
              id="settings-startup-behavior"
              value={preferences.startupBehavior}
              onChange={handleStartupBehaviorChange}
            >
              {startupBehaviors.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {preferences.startupBehavior === "configured-pages" ? (
            <div className="settings-startup-pages">
              <ul className="settings-startup-page-list">
                {preferences.startupPages.length === 0 ? (
                  <li className="settings-startup-page-empty">尚未添加启动页面</li>
                ) : (
                  preferences.startupPages.map((url) => (
                    <li key={url}>
                      <span className="settings-startup-page-url" title={url}>
                        {url}
                      </span>
                      <Button
                        aria-label="移除启动页面"
                        size="icon-xs"
                        title="移除"
                        variant="ghost"
                        onClick={() => onRemoveStartupPage(url)}
                      >
                        <XIcon aria-hidden="true" />
                      </Button>
                    </li>
                  ))
                )}
              </ul>
              <form className="settings-startup-page-form" onSubmit={handleAddStartupPage}>
                <input
                  autoComplete="off"
                  placeholder="添加启动页面 URL"
                  spellCheck={false}
                  value={startupPageDraft}
                  onChange={(event) => setStartupPageDraft(event.target.value)}
                />
                <Button type="submit" variant="ghost">
                  添加
                </Button>
              </form>
            </div>
          ) : null}
        </section>

        <section className="settings-section">
          <header className="settings-section-header">
            <HomeIcon aria-hidden="true" />
            <div>
              <h2>主页</h2>
              <p>点击工具栏主页按钮时打开的地址</p>
            </div>
          </header>
          <div className="settings-row">
            <label htmlFor="settings-home-page">主页地址</label>
            <input
              id="settings-home-page"
              autoComplete="off"
              placeholder={DEFAULT_HOME_URL}
              spellCheck={false}
              value={preferences.homePage}
              onChange={handleHomePageChange}
              onBlur={handleHomePageBlur}
            />
          </div>
        </section>

        <section className="settings-section">
          <header className="settings-section-header">
            <DownloadIcon aria-hidden="true" />
            <div>
              <h2>下载</h2>
              <p>选择保存下载文件的目录</p>
            </div>
          </header>
          <div className="settings-row">
            <label>下载目录</label>
            <div className="settings-download-directory">
              <span className="settings-download-directory-path" title={preferences.downloadDirectory}>
                {preferences.downloadDirectory || "系统默认（下载文件夹）"}
              </span>
              <div className="settings-download-directory-actions">
                <Button variant="ghost" onClick={handlePickDirectory}>
                  选择文件夹
                </Button>
                {preferences.downloadDirectory ? (
                  <Button variant="ghost" onClick={handleResetDownloadDirectory}>
                    恢复默认
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className={cn("settings-flash", statusMessage && "is-visible")} aria-live="polite">
          {statusMessage}
        </div>
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
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [activePanel, setActivePanel] = useState<null | "downloads" | "history" | "bookmarks">(null)
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ url: string; title: string; favicon?: string; kind: "history" | "bookmark" }>>([])
  const [preferences, setPreferences] = useState<BrowserPreferences>({
    searchEngine: "baidu",
    startupBehavior: "new-tab",
    homePage: DEFAULT_HOME_URL,
    downloadDirectory: "",
    startupPages: [],
  })
  const [searchEngines, setSearchEngines] = useState<SearchEngineOption[]>([])
  const [startupBehaviors, setStartupBehaviors] = useState<StartupBehaviorOption[]>([])
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const prevDownloadStatesRef = useRef(new Map<string, string>())

  const homeUrl = preferences.homePage || DEFAULT_HOME_URL
  const searchUrl = useMemo(() => {
    const option = searchEngines.find((item) => item.id === preferences.searchEngine)
    return option ? option.template : DEFAULT_SEARCH_URL
  }, [searchEngines, preferences.searchEngine])

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

    if (pageKey === "settings") {
      webviewsRef.current.get(tabId)?.stop?.()
      updateTab(tabId, {
        internalPage: "settings",
        url: INTERNAL_SETTINGS_URL,
        title: "设置",
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

      const tab = tabsRef.current.find((item) => item.id === tabId)
      if (tab && !tab.internalPage && isRecordableUrl(tab.url)) {
        void window.quickEngine.history
          .record({
            url: tab.url,
            title: tab.title || tab.url,
            favicon: tab.favicon || undefined,
          })
          .then(refreshHistory)
      }
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

  function createTab(initialUrl = homeUrl, options: { activate?: boolean } = {}) {
    const browserStack = browserStackRef.current

    if (!browserStack) {
      return
    }

    const tabId = `tab-${nextTabIdRef.current++}`
    const internalPage = getInternalPageKey(initialUrl)
    const initialTitle =
      internalPage === "version"
        ? "版本信息"
        : internalPage === "settings"
          ? "设置"
          : "新标签页"
    const initialUrlResolved =
      internalPage === "newtab"
        ? NEW_TAB_URL
        : internalPage === "settings"
          ? INTERNAL_SETTINGS_URL
          : initialUrl
    const tab: BrowserTab = {
      id: tabId,
      title: initialTitle,
      url: initialUrlResolved,
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

    const closingTab = current[closingIndex]
    if (closingTab && closingTab.url && !closingTab.internalPage) {
      void window.quickEngine.session.pushRecentlyClosed({
        url: closingTab.url,
        title: closingTab.title || closingTab.url,
        internalPage: closingTab.internalPage,
      })
    }

    webviewsRef.current.get(tabId)?.remove()
    webviewsRef.current.delete(tabId)

    const remaining = current.filter((tab) => tab.id !== tabId)
    setTabsSynced(() => remaining)

    if (remaining.length === 0) {
      setActiveTab(null)
      createTab(homeUrl)
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
    navigateActiveTab(normalizeInput(value, { searchUrl, homeUrl }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAddressSuggestions([])
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
    if (initializedRef.current) return
    if (!preferencesLoaded) return

    initializedRef.current = true
    void performStartup()
  }, [preferencesLoaded])

  async function performStartup() {
    const behavior = preferences.startupBehavior
    if (behavior === "restore-last-session") {
      const session = await window.quickEngine.session.load()
      if (session && session.tabs.length > 0) {
        const restoredCount = restoreFromSession(session)
        if (restoredCount > 0) {
          showStatus(`已恢复 ${restoredCount} 个标签页`)
          return
        }
      }
    }

    if (behavior === "configured-pages" && preferences.startupPages.length > 0) {
      for (let index = 0; index < preferences.startupPages.length; index += 1) {
        const pageUrl = preferences.startupPages[index]
        const normalized = normalizeInput(pageUrl, { searchUrl, homeUrl })
        createTab(normalized, { activate: index === 0 })
      }
      return
    }

    createTab(homeUrl)
  }

  function restoreFromSession(session: SavedSession): number {
    let restoredCount = 0
    let activateId: string | null = null

    session.tabs.forEach((saved) => {
      const id = `tab-${nextTabIdRef.current++}`
      const internalPage = (saved.internalPage as InternalPageKey) || getInternalPageKey(saved.url)
      const resolvedUrl =
        internalPage === "newtab"
          ? NEW_TAB_URL
          : internalPage === "settings"
            ? INTERNAL_SETTINGS_URL
            : internalPage === "version"
              ? INTERNAL_VERSION_URL
              : saved.url
      const tab: BrowserTab = {
        id,
        title: saved.title || resolvedUrl || "新标签页",
        url: resolvedUrl,
        internalPage,
        loading: false,
        canGoBack: false,
        canGoForward: false,
        favicon: "",
      }

      const browserStack = browserStackRef.current
      if (!browserStack) return

      const webview = document.createElement("webview") as BrowserWebView
      webview.className = "browser-view"
      webview.dataset.tabId = id
      webview.setAttribute("src", "about:blank")
      webview.setAttribute("partition", "persist:quick-engine")
      webview.setAttribute(
        "webpreferences",
        "contextIsolation=yes,nodeIntegration=no,javascript=yes",
      )
      webviewsRef.current.set(id, webview)
      attachWebviewEvents(id, webview)
      browserStack.append(webview)

      setTabsSynced((current) => [...current, tab])

      if (saved.active) {
        activateId = id
      }

      if (!internalPage) {
        void Promise.resolve(webview.loadURL(resolvedUrl)).catch(() => {
          updateTab(id, { title: "页面加载失败", loading: false })
        })
      } else if (internalPage === "version") {
        void loadInternalPage(id, INTERNAL_VERSION_URL)
      }

      restoredCount += 1
    })

    if (restoredCount === 0) return 0

    if (activateId) {
      setActiveTab(activateId)
    } else {
      const fallbackId = tabsRef.current[tabsRef.current.length - restoredCount]?.id ?? null
      if (fallbackId) setActiveTab(fallbackId)
    }

    return restoredCount
  }

  useEffect(() => {
    let disposed = false
    const unsubscribe = window.quickEngine.downloads.subscribe((items) => {
      if (!disposed) setDownloads(items)
    })
    void window.quickEngine.downloads.list().then((items) => {
      if (!disposed) setDownloads(items)
    })
    return () => {
      disposed = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const prevStates = prevDownloadStatesRef.current
    for (const item of downloads) {
      const prev = prevStates.get(item.id)
      if (prev === item.state) continue
      if (!prev && item.state === "progressing") {
        showStatus(`正在下载：${item.filename}`)
      } else if (prev === "progressing" && item.state === "completed") {
        showStatus(`下载完成：${item.filename}`)
      } else if (
        prev === "progressing" &&
        (item.state === "interrupted" || item.state === "canceled")
      ) {
        showStatus(`下载未完成：${item.filename}`)
      }
      prevStates.set(item.id, item.state)
    }
  }, [downloads])

  function handleDownloadAction(action: DownloadAction, id: string) {
    const api = window.quickEngine.downloads
    if (action === "openFile") void api.openFile(id)
    else if (action === "openFolder") void api.openFolder(id)
    else if (action === "cancel") void api.cancel(id)
    else if (action === "retry") void api.retry(id)
    else if (action === "remove") void api.remove(id)
  }

  const activeTabBookmarked = useMemo(
    () =>
      activeTab?.url
        ? bookmarks.find((b) => b.url === activeTab.url) ?? null
        : null,
    [activeTab?.url, bookmarks],
  )

  useEffect(() => {
    void window.quickEngine.history.list().then(setHistory)
    void window.quickEngine.bookmarks.list().then(setBookmarks)
    void Promise.all([
      window.quickEngine.settings.get(),
      window.quickEngine.settings.listSearchEngines(),
      window.quickEngine.settings.listStartupBehaviors(),
    ]).then(([prefs, engines, behaviors]) => {
      setPreferences(prefs)
      setSearchEngines(engines)
      setStartupBehaviors(behaviors)
      setPreferencesLoaded(true)
    })
  }, [])

  useEffect(() => {
    const draft = addressDraft.trim()
    if (!draft) {
      setAddressSuggestions([])
      return
    }
    let disposed = false
    const lower = draft.toLowerCase()
    void window.quickEngine.history.search(draft).then((results) => {
      if (disposed) return
      const seen = new Set<string>()
      const merged: Array<{ url: string; title: string; favicon?: string; kind: "history" | "bookmark" }> = []
      for (const bm of bookmarks) {
        if (seen.has(bm.url)) continue
        if (
          bm.url.toLowerCase().includes(lower) ||
          (bm.title || "").toLowerCase().includes(lower)
        ) {
          seen.add(bm.url)
          merged.push({ url: bm.url, title: bm.title, favicon: bm.favicon, kind: "bookmark" })
        }
      }
      for (const h of results.slice(0, 8)) {
        if (seen.has(h.url)) continue
        seen.add(h.url)
        merged.push({ url: h.url, title: h.title, favicon: h.favicon, kind: "history" })
      }
      setAddressSuggestions(merged.slice(0, 8))
    })
    return () => {
      disposed = true
    }
  }, [addressDraft, bookmarks])

  function refreshHistory() {
    void window.quickEngine.history.list().then(setHistory)
  }

  function refreshBookmarks() {
    void window.quickEngine.bookmarks.list().then(setBookmarks)
  }

  function toggleBookmark() {
    if (!activeTab?.url || !isRecordableUrl(activeTab.url)) {
      showStatus("无法收藏此页面")
      return
    }
    if (activeTabBookmarked) {
      void window.quickEngine.bookmarks.remove(activeTabBookmarked.id).then(refreshBookmarks)
      showStatus("已取消收藏")
    } else {
      void window.quickEngine.bookmarks
        .add({
          url: activeTab.url,
          title: activeTab.title || activeTab.url,
          favicon: activeTab.favicon || undefined,
        })
        .then(refreshBookmarks)
      showStatus("已加入书签")
    }
  }

  function handleHistoryOpen(url: string) {
    navigateActiveTab(url)
    setActivePanel(null)
  }

  function handleHistoryRemove(url: string) {
    void window.quickEngine.history.remove(url).then(refreshHistory)
  }

  function handleHistoryClear() {
    void window.quickEngine.history.clear().then(refreshHistory)
    showStatus("已清空历史记录")
  }

  function handleBookmarkOpen(url: string) {
    navigateActiveTab(url)
    setActivePanel(null)
  }

  function handleBookmarkRemove(id: string) {
    void window.quickEngine.bookmarks.remove(id).then(refreshBookmarks)
  }

  function handleSuggestionPick(url: string) {
    setAddressSuggestions([])
    navigateActiveTab(url)
  }

  function handlePreferencesChange(patch: Partial<BrowserPreferences>) {
    void window.quickEngine.settings.set(patch).then((next) => {
      setPreferences(next)
    })
  }

  function handleAddStartupPage(url: string) {
    const next = Array.from(new Set([...preferences.startupPages, url])).slice(0, 10)
    handlePreferencesChange({ startupPages: next })
  }

  function handleRemoveStartupPage(url: string) {
    const next = preferences.startupPages.filter((item) => item !== url)
    handlePreferencesChange({ startupPages: next })
  }

  const sessionSaveTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!initializedRef.current) return
    if (sessionSaveTimerRef.current !== undefined) {
      window.clearTimeout(sessionSaveTimerRef.current)
    }
    sessionSaveTimerRef.current = window.setTimeout(() => {
      const snapshot = {
        tabs: tabsRef.current.map((tab) => ({
          id: tab.id,
          url: tab.url,
          title: tab.title,
          internalPage: tab.internalPage,
        })),
        activeTabId: activeTabIdRef.current,
      }
      void window.quickEngine.session.save(snapshot)
    }, 600)
    return () => {
      if (sessionSaveTimerRef.current !== undefined) {
        window.clearTimeout(sessionSaveTimerRef.current)
        sessionSaveTimerRef.current = undefined
      }
    }
  }, [tabs, activeTabId])

  async function handleReopenClosedTab() {
    const entry = await window.quickEngine.session.popRecentlyClosed()
    if (!entry) {
      showStatus("没有可恢复的标签页")
      return
    }
    const resolved =
      entry.internalPage === "newtab"
        ? NEW_TAB_URL
        : entry.internalPage === "settings"
          ? INTERNAL_SETTINGS_URL
          : entry.internalPage === "version"
            ? INTERNAL_VERSION_URL
            : entry.url
    createTab(resolved)
    showStatus("已恢复关闭的标签页")
  }

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
        createTab(homeUrl)
      }

      if (modifierPressed && event.shiftKey && event.key.toLowerCase() === "t") {
        event.preventDefault()
        void handleReopenClosedTab()
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
                    ) : tab.internalPage === "settings" ? (
                      <SettingsIcon aria-hidden="true" className="tab-icon" />
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
              onClick={() => createTab(homeUrl)}
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
              <ToolButton label="主页" onClick={() => navigateActiveTab(homeUrl)}>
                <HomeIcon aria-hidden="true" />
              </ToolButton>
            </div>

            <div className="browser-address-wrapper">
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
              {addressSuggestions.length > 0 ? (
                <ul className="address-suggestions" role="listbox">
                  {addressSuggestions.map((suggestion) => (
                    <li key={suggestion.url}>
                      <button
                        type="button"
                        className="address-suggestion"
                        title={suggestion.url}
                        onClick={() => handleSuggestionPick(suggestion.url)}
                      >
                        <span className="entry-favicon">
                          <EntryFavicon src={suggestion.favicon} />
                        </span>
                        <span className="address-suggestion-text">
                          <span className="address-suggestion-title">{suggestion.title}</span>
                          <span className="address-suggestion-url">{suggestion.url}</span>
                        </span>
                        <span className="address-suggestion-kind">
                          {suggestion.kind === "bookmark" ? "书签" : "历史"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="toolbar-actions">
              <ToolButton
                className={cn("is-bookmarked", activeTabBookmarked && "is-active")}
                label={activeTabBookmarked ? "取消收藏" : "加入书签"}
                onClick={toggleBookmark}
              >
                <StarIcon aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="书签管理"
                onClick={() => setActivePanel((value) => (value === "bookmarks" ? null : "bookmarks"))}
              >
                <BookmarkIcon aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="历史记录"
                onClick={() => setActivePanel((value) => (value === "history" ? null : "history"))}
              >
                <HistoryIcon aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="下载"
                onClick={() => setActivePanel((value) => (value === "downloads" ? null : "downloads"))}
              >
                <DownloadIcon aria-hidden="true" />
              </ToolButton>
              <ToolButton
                label="设置"
                onClick={() => navigateActiveTab(INTERNAL_SETTINGS_URL)}
              >
                <SettingsIcon aria-hidden="true" />
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
            <NewTabPage
              bookmarks={bookmarks}
              history={history}
              onNavigate={navigateActiveTab}
              onSubmitInput={submitAddressInput}
            />
          ) : null}
          {activeTab?.internalPage === "settings" ? (
            <SettingsPage
              preferences={preferences}
              searchEngines={searchEngines}
              startupBehaviors={startupBehaviors}
              onChange={handlePreferencesChange}
              onPickDownloadDirectory={window.quickEngine.settings.pickDownloadDirectory}
              onAddStartupPage={handleAddStartupPage}
              onRemoveStartupPage={handleRemoveStartupPage}
            />
          ) : null}
          <DownloadsPanel
            items={downloads}
            open={activePanel === "downloads"}
            onClose={() => setActivePanel(null)}
            onAction={handleDownloadAction}
          />
          <HistoryPanel
            entries={history}
            open={activePanel === "history"}
            onClose={() => setActivePanel(null)}
            onOpen={handleHistoryOpen}
            onRemove={handleHistoryRemove}
            onClear={handleHistoryClear}
          />
          <BookmarksPanel
            entries={bookmarks}
            open={activePanel === "bookmarks"}
            onClose={() => setActivePanel(null)}
            onOpen={handleBookmarkOpen}
            onRemove={handleBookmarkRemove}
          />
          <div className={cn("status-text", statusVisible && "is-visible")} aria-live="polite">
            {statusMessage}
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
