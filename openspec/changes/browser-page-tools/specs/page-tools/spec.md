## ADDED Requirements

### Requirement: Find in page
The browser SHALL provide find-in-page controls for the active normal web tab.

#### Scenario: User searches within page
- **WHEN** the user opens find in page and enters a query
- **THEN** the active webview highlights matches and exposes match count and current match position when available

### Requirement: Page zoom
The browser SHALL provide zoom controls for the active normal web tab.

#### Scenario: User changes zoom level
- **WHEN** the user increases, decreases, or resets page zoom
- **THEN** the active web page updates to the requested zoom level and the browser displays the current zoom state

### Requirement: Print page
The browser SHALL provide a print action for the active normal web tab.

#### Scenario: User prints page
- **WHEN** the user activates print for a normal web page
- **THEN** the browser invokes the Electron print flow for the active webview

### Requirement: Developer tools
The browser SHALL provide a developer tools action for the active normal web tab.

#### Scenario: User opens developer tools
- **WHEN** the user activates developer tools
- **THEN** the browser opens developer tools for the active webview

### Requirement: Reload and stop consistency
The browser SHALL keep reload and stop controls consistent with active tab loading state.

#### Scenario: Active tab is loading
- **WHEN** the active tab is loading a page
- **THEN** the toolbar presents stop behavior for that tab

#### Scenario: Active tab is idle
- **WHEN** the active tab is not loading
- **THEN** the toolbar presents reload behavior for that tab
