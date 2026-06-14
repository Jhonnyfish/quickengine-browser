## Context

The current application is an Electron desktop browser shell with a React renderer, Tailwind/shadcn UI components, and one `<webview>` per tab. It already supports multiple tabs, URL/search normalization, navigation controls, favicon/title/loading state, keyboard shortcuts, and a `chrome://version` compatibility page rendered as a generated data URL.

The reference design in `D:\design-workbase\browser` defines the KuaiQing visual direction: dark-first browser chrome, blue/purple brand accent, a custom logo mark, a polished address surface, and a branded new-tab page with search, quick links, and recommendation cards.

## Goals / Non-Goals

**Goals:**

- Apply the KuaiQing brand identity to the existing browser chrome without replacing the Electron/Chromium foundation.
- Add `kuaiqing://newtab` as the default startup, new-tab, and fallback tab page.
- Render the new-tab experience as React UI so search, quick links, and future customization can share browser state and navigation handlers.
- Preserve existing multi-tab webview browsing, URL/search normalization, keyboard shortcuts, and `chrome://version`.
- Keep implementation scoped to the renderer unless a small preload/main-process change is required.

**Non-Goals:**

- Do not fork Chromium or move from Electron to CEF.
- Do not implement downloads, bookmarks, history, account sync, extension support, or full permission management in this change.
- Do not implement fake macOS traffic-light window controls or a frameless custom title bar; keep the native Electron window frame for now.
- Do not add live recommendation feeds, remote configuration, or editable quick links yet.

## Decisions

### Decision: Keep Electron and the existing webview tab model

Continue using Electron's current `<webview>`-based tab implementation for normal web pages.

Rationale: The existing code already has navigation state, title/favicon updates, popup handling, and keyboard shortcuts built around one webview per tab. Replacing that with `WebContentsView` would be a larger architectural change and should be a separate hardening/refactor change.

Alternative considered: Move immediately to `WebContentsView`. This is a better long-term Electron direction, but it would mix a product UI change with a tab-hosting rewrite.

### Decision: Treat `kuaiqing://newtab` as a React internal page

Represent internal pages explicitly in tab state, for example with an `internalPage` or `kind` field. For `kuaiqing://newtab`, do not load the URL through the webview. Render a React `NewTabPage` surface for the active tab and keep the tab URL as `kuaiqing://newtab`.

Rationale: The new-tab page needs first-class interaction with the browser shell: submitting searches, opening quick links, and later supporting editable shortcuts. A React component avoids brittle generated HTML and keeps behavior testable from the renderer.

Alternative considered: Use `data:text/html` for new tab, matching `chrome://version`. That would be quick, but it would isolate UI logic from React state and make future customization harder.

### Decision: Preserve `chrome://version` as the existing generated internal page

Keep the existing `chrome://version` flow for this change, including the generated HTML/data URL approach.

Rationale: The version page is already functional and low-interaction. Refactoring it into React is not required for the branding/new-tab scope.

Alternative considered: Convert all internal pages to React at once. That is cleaner architecturally, but it expands scope without improving the primary new-tab experience.

### Decision: Make `kuaiqing://newtab` the default browser home surface

Replace the current Baidu home default for initial tab creation, `Ctrl+T`, the new-tab button, and the fallback tab after closing the last tab. The toolbar home button should also navigate the active tab to `kuaiqing://newtab`.

Rationale: The design positions the branded new tab as the browser's first-viewport product surface. Keeping Baidu as the home page would hide the new product experience on startup.

Alternative considered: Keep Baidu as home and only expose new tab from the plus button. That keeps current behavior, but it does not satisfy the product direction in the reference design.

### Decision: Centralize internal URL detection and navigation normalization

Extend the existing `getInternalPageKey`, `isInternalUrl`, and `normalizeInput` helpers to recognize `kuaiqing://newtab` and keep `chrome://version` intact. Both the toolbar address form and the new-tab search form should call the same navigation path.

Rationale: One normalization path prevents the address bar and new-tab search from disagreeing about whether input is a URL, internal page, localhost address, or search term.

Alternative considered: Add separate search logic inside `NewTabPage`. That would duplicate behavior and create edge cases.

### Decision: Use CSS tokens for the dark-first brand system

Move the KuaiQing colors, radii, and surface roles into CSS variables in `src/index.css`, and use them from component classes. Keep Tailwind/shadcn available, but use small semantic class names where the browser chrome needs stable sizing and states.

Rationale: The browser chrome uses fixed-format UI such as tabs, icon buttons, and address controls. CSS variables and dedicated classes make it easier to maintain stable dimensions and prevent layout shifts.

Alternative considered: Inline styles copied from the reference App.jsx. That is suitable for a design mock but not for this codebase.

### Decision: Use lucide icons in production UI

Use existing `lucide-react` icons for toolbar, search, quick links, and secondary actions. Keep the custom KuaiQing logo as a small SVG React component because it is brand identity, not a generic icon.

Rationale: The project already depends on lucide, and consistent icon geometry improves the browser chrome.

Alternative considered: Use emoji or manually drawn icons for all quick links. Emoji match the reference mock, but they look inconsistent in a packaged desktop app across platforms.

## Risks / Trade-offs

- React internal page and webview page stacking may drift in visibility state -> Keep one active-page decision in render based on the active tab, and only show the active webview when the active tab is a normal web page or data-backed version page.
- Existing `isInternal` boolean may become too vague -> Introduce a clearer internal page key rather than overloading a boolean for multiple internal page types.
- Dark-first theme can reduce readability on external web content edges -> Limit dark styling to the browser chrome and internal pages; normal web pages render inside their own webview.
- Static recommendations could look like live content -> Use clearly static local data and avoid network requests in this change.
- `kuaiqing://newtab` is not a registered Electron protocol yet -> Treat it as renderer-managed internal navigation for now; protocol registration can be a later hardening change if web content needs to link to it reliably.

## Migration Plan

1. Add the new internal URL constant and update URL normalization helpers.
2. Extend tab state to distinguish normal web pages from `newtab` and `version` internal pages.
3. Add `KuaiqingLogo` and `NewTabPage` React components with static quick-link and recommendation data.
4. Restyle the browser chrome using CSS tokens and stable class dimensions.
5. Change startup, new-tab, fallback-tab, and home actions to use `kuaiqing://newtab`.
6. Run `npm run lint` and `npm run build:renderer`.

Rollback is straightforward: revert the renderer changes and restore the previous `HOME_URL` default, because this change does not migrate persistent data or add external services.

## Open Questions

- What final URLs should the quick links use for KuaiQing邮箱, 云端文档, 日程表, 团队空间, 应用商店, and AI助手?
- Should the static recommendation cards remain product-themed placeholders, or should they link to public pages in this first implementation?
- Should a future change register a real custom Electron protocol for `kuaiqing://` so external pages and app-level navigation can resolve it outside renderer-managed input?
