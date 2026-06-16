## Why

QuickEngine Browser currently hardcodes its home page destination, search engine, and startup behavior. To be a usable general-purpose browser, these core preferences must be configurable by the user and persisted across restarts. This change introduces an internal settings page and the persistence layer for browser preferences that other features (`browser-downloads`, `browser-session-restore`) will consume.

## What Changes

- Add an internal settings page (no remote web content) reachable from a settings entry point.
- Allow configuring the default search engine from supported options.
- Allow configuring startup behavior: open new-tab page, restore last session, or open configured pages.
- Allow configuring the home button destination.
- Allow configuring the download directory (consumed by `browser-downloads`).
- Persist all preferences across application restarts.

## Capabilities

### New Capabilities

- `browser-settings`: Provides a settings page and local preferences for search engine, startup behavior, home page, downloads, and profile defaults.

### Modified Capabilities

- None. No existing main OpenSpec capability specs are present in this project yet.

## Impact

- Affected renderer code: new settings page component, settings entry point in toolbar/menu, and consumption of settings in navigation, new-tab, and startup paths.
- Affected Electron code: IPC channels for reading/writing preferences, startup-behavior handling, and local persistence.
- Affected types: `src/types/electron.d.ts` for settings IPC typings.
- Affected storage: a single preferences store (JSON file or shared SQLite table) consumed by other features.
- Dependencies: persistence approach chosen here should be the same one used by `browser-history-bookmarks` and `browser-downloads`.
- Validation: `npm run lint`, `npm run build:renderer`, focused manual checks of each preference, and `openspec validate browser-settings` should pass.

## Non-goals

- Account-based settings or per-profile preferences are out of scope.
- Advanced configuration (proxy, certificates, DNS-over-HTTPS) is out of scope for this change.
- Importing settings from other browsers is out of scope.
