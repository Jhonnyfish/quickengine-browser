## Why

Quick Engine Browser already has a working Electron/Chromium shell, but the first screen still feels like a generic utility instead of the KuaiQing product shown in the reference design. This change turns the existing browser shell into a branded, product-ready starting experience while keeping the scope focused on UI and internal new-tab behavior.

## What Changes

- Introduce the KuaiQing visual identity from the reference design: dark-first browser chrome, blue/purple brand accent, branded logo, refined tab styling, and a more polished toolbar/address surface.
- Add a first-class internal new-tab page at `kuaiqing://newtab`.
- Make new windows and new tabs open the KuaiQing new-tab experience by default.
- Add a branded new-tab layout with logo, central search/address entry, quick links, and static recommendation cards.
- Connect the new-tab search/address entry to the existing URL normalization and navigation behavior.
- Keep existing browser capabilities intact, including multi-tab browsing, webview navigation, address-bar search, and the `chrome://version` compatibility page.
- Leave downloads, bookmarks, history, account sync, extension support, permission management, and Chromium fork work out of scope for this change.

## Capabilities

### New Capabilities

- `browser-shell-branding`: Defines the branded KuaiQing browser chrome experience, including visual identity, tab bar, navigation toolbar, address surface, and brand/tool affordances.
- `internal-new-tab`: Defines the `kuaiqing://newtab` internal page behavior, including default tab startup, search/address navigation, quick links, and static recommendation content.

### Modified Capabilities

- None. No existing OpenSpec capability specs are present in this project yet.

## Impact

- Affected renderer code: `src/App.tsx`, `src/index.css`, and likely new renderer components for logo, chrome layout, and the new-tab page.
- Affected Electron code: minimal changes may be needed in `electron/main.js` or `electron/preload.js` if the internal page model requires additional app metadata or protocol handling.
- Affected types: `src/types/electron.d.ts` may need updates only if new preload APIs are introduced.
- Dependencies: no new runtime dependency is expected; existing React, Electron, Tailwind, shadcn/ui, and lucide-react dependencies should be sufficient.
- Validation: `npm run lint` and `npm run build:renderer` should pass after implementation.
