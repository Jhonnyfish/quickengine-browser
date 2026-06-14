## ADDED Requirements

### Requirement: Save session tabs
The browser SHALL save enough session state to restore normal and internal tabs after restart.

#### Scenario: Application closes with open tabs
- **WHEN** the application is closing with tabs open
- **THEN** the browser persists tab URLs, active tab identity, and internal page identifiers needed for restoration

### Requirement: Restore last session
The browser SHALL restore saved tabs when startup behavior is configured to restore the last session.

#### Scenario: Application starts with restore setting
- **WHEN** the application starts and startup behavior is set to restore the last session
- **THEN** the browser opens the saved tabs and activates the previously active tab when possible

### Requirement: Recently closed tabs
The browser SHALL track recently closed tabs and allow the latest closed tab to be reopened.

#### Scenario: User reopens closed tab
- **WHEN** the user activates reopen closed tab after closing a tab
- **THEN** the browser recreates the most recently closed tab with its saved URL and internal page state

### Requirement: Invalid session recovery
The browser SHALL handle invalid or unavailable saved session URLs without blocking startup.

#### Scenario: Saved session contains invalid entry
- **WHEN** a saved session entry cannot be restored
- **THEN** the browser skips or replaces that entry and still opens a usable browser window
