const HOME_URL = 'https://www.baidu.com/';
const SEARCH_URL = 'https://www.baidu.com/s?wd=';

const tabStrip = document.querySelector('#tabStrip');
const browserStack = document.querySelector('#browserStack');
const addressForm = document.querySelector('#addressForm');
const addressInput = document.querySelector('#addressInput');
const securityIndicator = document.querySelector('#securityIndicator');
const statusText = document.querySelector('#statusText');
const backButton = document.querySelector('#backButton');
const forwardButton = document.querySelector('#forwardButton');
const reloadButton = document.querySelector('#reloadButton');
const homeButton = document.querySelector('#homeButton');
const newTabButton = document.querySelector('#newTabButton');

let tabs = [];
let activeTabId = null;
let nextTabId = 1;
let statusTimer = null;

function getActiveTab() {
  return tabs.find((tab) => tab.id === activeTabId) ?? null;
}

function normalizeInput(value) {
  const text = value.trim();

  if (!text) {
    return HOME_URL;
  }

  if (/^(localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:\/.*)?$/i.test(text)) {
    return `http://${text}`;
  }

  try {
    const url = new URL(text);
    const hasExplicitScheme = /^[a-z][a-z\d+.-]*:/i.test(text);

    if (hasExplicitScheme && ['http:', 'https:', 'file:', 'about:'].includes(url.protocol)) {
      return url.href;
    }
  } catch {
    // Continue with browser-style URL inference below.
  }

  if (!/\s/.test(text) && text.includes('.')) {
    try {
      return new URL(`https://${text}`).href;
    } catch {
      // Fall back to search for malformed domain-like input.
    }
  }

  return `${SEARCH_URL}${encodeURIComponent(text)}`;
}

function createTab(initialUrl = HOME_URL, options = {}) {
  const tab = {
    id: `tab-${nextTabId++}`,
    title: '新标签页',
    url: initialUrl,
    loading: false,
    canGoBack: false,
    canGoForward: false,
    favicon: ''
  };

  const webview = document.createElement('webview');
  webview.className = 'browser-view';
  webview.dataset.tabId = tab.id;
  webview.src = initialUrl;
  webview.setAttribute('partition', 'persist:quick-engine');
  webview.setAttribute('webpreferences', 'contextIsolation=yes,nodeIntegration=no,javascript=yes');

  tab.webview = webview;
  attachWebviewEvents(tab);
  tabs.push(tab);
  browserStack.append(webview);

  if (options.activate !== false) {
    setActiveTab(tab.id);
  } else {
    renderTabs();
  }

  return tab;
}

function attachWebviewEvents(tab) {
  const { webview } = tab;

  webview.addEventListener('did-start-loading', () => {
    tab.loading = true;
    updateNavigationState(tab);
    renderTabs();
    renderToolbar();
  });

  webview.addEventListener('did-stop-loading', () => {
    tab.loading = false;
    updateNavigationState(tab);
    renderTabs();
    renderToolbar();
  });

  webview.addEventListener('did-navigate', (event) => {
    tab.url = event.url;
    updateNavigationState(tab);
    renderToolbar();
  });

  webview.addEventListener('did-navigate-in-page', (event) => {
    tab.url = event.url;
    updateNavigationState(tab);
    renderToolbar();
  });

  webview.addEventListener('page-title-updated', (event) => {
    tab.title = event.title || tab.url || '新标签页';
    renderTabs();
  });

  webview.addEventListener('page-favicon-updated', (event) => {
    tab.favicon = event.favicons?.[0] ?? '';
    renderTabs();
  });

  webview.addEventListener('did-fail-load', (event) => {
    if (event.errorCode === -3) {
      return;
    }

    tab.loading = false;
    tab.title = '页面加载失败';
    tab.url = event.validatedURL || tab.url;
    showStatus(`加载失败：${event.errorDescription}`);
    updateNavigationState(tab);
    renderTabs();
    renderToolbar();
  });

  webview.addEventListener('new-window', (event) => {
    event.preventDefault();
    createTab(event.url);
  });

  webview.addEventListener('update-target-url', (event) => {
    if (event.url) {
      showStatus(event.url, 1200);
    }
  });
}

function updateNavigationState(tab) {
  try {
    tab.url = tab.webview.getURL() || tab.url;
    tab.canGoBack = tab.webview.canGoBack();
    tab.canGoForward = tab.webview.canGoForward();
  } catch {
    tab.canGoBack = false;
    tab.canGoForward = false;
  }
}

function setActiveTab(tabId) {
  activeTabId = tabId;

  for (const tab of tabs) {
    tab.webview.classList.toggle('is-active', tab.id === tabId);
  }

  renderTabs();
  renderToolbar();
}

function closeTab(tabId) {
  const closingIndex = tabs.findIndex((tab) => tab.id === tabId);

  if (closingIndex === -1) {
    return;
  }

  const [closedTab] = tabs.splice(closingIndex, 1);
  closedTab.webview.remove();

  if (tabs.length === 0) {
    createTab(HOME_URL);
    return;
  }

  if (activeTabId === tabId) {
    const nextTab = tabs[Math.max(0, closingIndex - 1)];
    setActiveTab(nextTab.id);
  } else {
    renderTabs();
  }
}

function renderTabs() {
  tabStrip.replaceChildren();

  for (const tab of tabs) {
    const tabButton = document.createElement('button');
    tabButton.className = 'tab';
    tabButton.type = 'button';
    tabButton.role = 'tab';
    tabButton.title = tab.title || tab.url;
    tabButton.setAttribute('aria-selected', String(tab.id === activeTabId));
    tabButton.addEventListener('click', () => setActiveTab(tab.id));

    const icon = tab.favicon ? document.createElement('img') : document.createElement('span');
    icon.className = tab.favicon ? 'tab-favicon' : 'tab-fallback';
    if (tab.favicon) {
      icon.src = tab.favicon;
      icon.alt = '';
    } else {
      icon.textContent = tab.loading ? '…' : 'Q';
    }

    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title || '新标签页';

    const closeButton = document.createElement('button');
    closeButton.className = 'tab-close';
    closeButton.type = 'button';
    closeButton.title = '关闭标签页';
    closeButton.setAttribute('aria-label', '关闭标签页');
    closeButton.textContent = 'x';
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    });

    tabButton.append(icon, title, closeButton);
    tabStrip.append(tabButton);
  }
}

function renderToolbar() {
  const activeTab = getActiveTab();

  if (!activeTab) {
    addressInput.value = '';
    backButton.disabled = true;
    forwardButton.disabled = true;
    reloadButton.textContent = '↻';
    return;
  }

  updateNavigationState(activeTab);
  addressInput.value = activeTab.url;
  backButton.disabled = !activeTab.canGoBack;
  forwardButton.disabled = !activeTab.canGoForward;
  reloadButton.textContent = activeTab.loading ? '×' : '↻';
  reloadButton.title = activeTab.loading ? '停止加载' : '刷新';
  reloadButton.setAttribute('aria-label', reloadButton.title);
  updateSecurityIndicator(activeTab.url);
}

function updateSecurityIndicator(value) {
  let label = '站点';
  let state = '';

  try {
    const url = new URL(value);
    if (url.protocol === 'https:') {
      label = '安全';
    } else if (url.protocol === 'http:') {
      label = '普通';
      state = 'is-warning';
    } else {
      label = '本地';
      state = 'is-local';
    }
  } catch {
    label = '搜索';
    state = 'is-local';
  }

  securityIndicator.textContent = label;
  securityIndicator.className = `security-indicator ${state}`.trim();
}

function navigateActiveTab(url) {
  const activeTab = getActiveTab();

  if (!activeTab) {
    createTab(url);
    return;
  }

  activeTab.url = url;
  activeTab.webview.loadURL(url);
  renderToolbar();
}

function showStatus(message, duration = 2400) {
  window.clearTimeout(statusTimer);
  statusText.textContent = message;
  statusText.classList.add('is-visible');
  statusTimer = window.setTimeout(() => {
    statusText.classList.remove('is-visible');
  }, duration);
}

addressForm.addEventListener('submit', (event) => {
  event.preventDefault();
  navigateActiveTab(normalizeInput(addressInput.value));
  addressInput.blur();
});

backButton.addEventListener('click', () => {
  const activeTab = getActiveTab();
  if (activeTab?.canGoBack) {
    activeTab.webview.goBack();
  }
});

forwardButton.addEventListener('click', () => {
  const activeTab = getActiveTab();
  if (activeTab?.canGoForward) {
    activeTab.webview.goForward();
  }
});

reloadButton.addEventListener('click', () => {
  const activeTab = getActiveTab();
  if (!activeTab) {
    return;
  }

  if (activeTab.loading) {
    activeTab.webview.stop();
  } else {
    activeTab.webview.reload();
  }
});

homeButton.addEventListener('click', () => {
  navigateActiveTab(HOME_URL);
});

newTabButton.addEventListener('click', () => {
  createTab(HOME_URL);
});

document.addEventListener('keydown', (event) => {
  const modifierPressed = event.ctrlKey || event.metaKey;

  if (modifierPressed && event.key.toLowerCase() === 'l') {
    event.preventDefault();
    addressInput.focus();
    addressInput.select();
  }

  if (modifierPressed && event.key.toLowerCase() === 't') {
    event.preventDefault();
    createTab(HOME_URL);
  }

  if (modifierPressed && event.key.toLowerCase() === 'w') {
    event.preventDefault();
    const activeTab = getActiveTab();
    if (activeTab) {
      closeTab(activeTab.id);
    }
  }

  if (event.key === 'F5') {
    event.preventDefault();
    getActiveTab()?.webview.reload();
  }
});

createTab(HOME_URL);
