## 1. Internal Page Model

- [x] 1.1 Add `kuaiqing://newtab` and related internal-page constants in the renderer.
- [x] 1.2 Extend internal URL detection to identify `kuaiqing://newtab` while preserving `chrome://version`, `about:version`, and `quickengine://version`.
- [x] 1.3 Update input normalization so empty/default new-tab navigation and explicit `kuaiqing://newtab` resolve to the internal new-tab page.
- [x] 1.4 Extend tab state to distinguish normal web pages from internal `newtab` and `version` pages without relying only on a boolean.

## 2. New Tab Behavior

- [x] 2.1 Change initial startup tab creation to open `kuaiqing://newtab`.
- [x] 2.2 Change the tab-bar new-tab button and keyboard shortcut to open `kuaiqing://newtab`.
- [x] 2.3 Change fallback tab creation after closing the last tab to open `kuaiqing://newtab`.
- [x] 2.4 Change the home button to navigate the active tab to `kuaiqing://newtab`.
- [x] 2.5 Ensure `kuaiqing://newtab` does not trigger normal webview network navigation.

## 3. Branded Components

- [x] 3.1 Add a reusable `KuaiqingLogo` React component using the blue/purple brand gradient and speed mark.
- [x] 3.2 Add a `NewTabPage` React component with brand hero, central search/address input, quick-link entries, and static recommendation cards.
- [x] 3.3 Wire `NewTabPage` search submissions to the same navigation path used by the toolbar address form.
- [x] 3.4 Wire quick-link activation to navigate the active tab to each configured destination.

## 4. Browser Chrome Styling

- [x] 4.1 Add KuaiQing design tokens to `src/index.css` for dark-first background, chrome bar, surfaces, borders, text, muted text, and brand accents.
- [x] 4.2 Restyle the tab bar so active, inactive, loading, favicon/title, close, and new-tab states match the branded design direction.
- [x] 4.3 Restyle the navigation toolbar and address surface while preserving current back, forward, refresh/stop, home, and submit behavior.
- [x] 4.4 Add responsive/stable sizing rules so the tab bar, toolbar controls, address entry, and new-tab page remain usable at the supported minimum window width.

## 5. Regression Preservation

- [x] 5.1 Verify normal web URLs still load in webviews and update title, favicon, loading, back, and forward state.
- [x] 5.2 Verify search terms still navigate to the configured Baidu search URL.
- [x] 5.3 Verify `chrome://version` still displays app, Electron, Chromium, runtime, and path details.
- [x] 5.4 Verify tab switching, closing, and creating additional tabs works while the active tab is `kuaiqing://newtab`.

## 6. Validation

- [x] 6.1 Run `npm run lint`.
- [x] 6.2 Run `npm run build:renderer`.
- [x] 6.3 Run `openspec validate brand-newtab-browser-shell`.
