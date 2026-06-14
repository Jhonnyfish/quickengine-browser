## Why

When QuickEngine Browser closes with tabs open, all of that context is lost — on next launch the user starts from a blank new-tab page. This breaks the continuity users expect from a desktop browser and forces them to manually reopen everything. This change adds basic session restore: saving the open-tab state at shutdown, restoring it at startup when the user opts in, and tracking recently closed tabs for "reopen closed tab".

## What Changes

- Persist tab state (URLs, active tab identity, internal page identifiers) at application shutdown.
- Restore the saved session when startup behavior is configured to restore (depends on `browser-settings`).
- Track recently closed tabs and support reopening the most recently closed tab.
- Gracefully handle invalid or unavailable saved session entries without blocking startup.

## Capabilities

### New Capabilities

- `session-restore`: Saves and restores browser session state, including last open tabs and recently closed tabs.

### Modified Capabilities

- None. No existing main OpenSpec capability specs are present in this project yet.

## Impact

- Affected Electron code: window lifecycle hooks (before-quit) to persist session, startup path to restore session, IPC for recently closed tab tracking, and local persistence.
- Affected renderer code: tab-state subscription for serialization, "reopen closed tab" entry in tab context menu or shortcut.
- Affected types: `src/types/electron.d.ts` for session IPC typings.
- Affected storage: session state file (JSON) in the user data directory. May share the persistence layer with `browser-settings`.
- Dependencies: depends on `browser-settings` for the "restore last session" startup-behavior configuration. Should be implemented after `browser-settings`.
- Validation: `npm run lint`, `npm run build:renderer`, focused manual checks of save/restore cycles, and `openspec validate browser-session-restore` should pass.

## Non-goals

- Cross-window session sync, multi-window grouping, and named sessions are out of scope.
- Per-tab history restoration (back/forward stack) is out of scope for this change.
- Cloud session sync is out of scope.
