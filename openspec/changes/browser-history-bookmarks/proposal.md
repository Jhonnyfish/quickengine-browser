## Why

QuickEngine Browser currently has no persistent memory of where the user has been or what the user wants to revisit. Without local browsing history and bookmarks, the new-tab page cannot show recent sites, the address bar cannot offer suggestions, and users have no way to save pages for later. This change adds browsing history and bookmarks as local browser data, plus the surface integrations that make them useful in everyday browsing.

## What Changes

- Record successful top-level navigations as local history entries (URL, title, favicon when available, visit count, last visited time).
- Provide a history view that lists and searches local history.
- Allow users to add, remove, update, and open bookmarks (URL, title, favicon, creation time, folder).
- Surface recent history and bookmarks on `kuaiqing://newtab` as local shortcuts.
- Provide address-bar suggestions drawn from history and bookmarks.
- Persist all data locally; no remote services.

## Capabilities

### New Capabilities

- `history-bookmarks`: Stores browsing history and bookmarks locally, provides search/list/add/remove behavior, and supports new-tab and address-bar suggestions.

### Modified Capabilities

- None. No existing main OpenSpec capability specs are present in this project yet.

## Impact

- Affected Electron code: navigation event hooks for history recording, IPC channels for history/bookmark CRUD, and local persistence (SQLite or JSON with schema migration).
- Affected renderer code: history view, bookmarks manager, new-tab integration (extends existing `NewTabPage` from `brand-newtab-browser-shell`), and address-bar suggestion dropdown.
- Affected types: `src/types/electron.d.ts` for history/bookmark IPC typings.
- Affected storage: SQLite database or schema-versioned JSON files in the user data directory.
- Dependencies: may introduce a SQLite binding (e.g., `better-sqlite3`) or continue with JSON files. The chosen approach should be consistent with other user-data features (`browser-settings`, `browser-downloads`).
- Validation: `npm run lint`, `npm run build:renderer`, focused manual checks of recording/suggesting/bookmarking, and `openspec validate browser-history-bookmarks` should pass.

## Non-goals

- Cross-device sync of history or bookmarks is out of scope.
- Cloud-based suggestions, trending sites, or remote search suggestions are out of scope.
- Bookmark folders/nesting beyond a single level and bookmark tags are out of scope for this change.
