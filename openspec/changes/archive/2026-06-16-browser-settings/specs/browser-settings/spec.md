## ADDED Requirements

### Requirement: Settings page
The browser SHALL provide an internal settings page for user-configurable browser preferences.

#### Scenario: User opens settings
- **WHEN** the user opens the settings entry point
- **THEN** the browser displays an internal settings page without loading a remote web page

### Requirement: Search engine setting
The browser SHALL allow the default search engine template to be configured from supported options.

#### Scenario: User changes search engine
- **WHEN** the user selects a supported search engine in settings
- **THEN** future search terms submitted from the address bar or new-tab search use that search engine

### Requirement: Startup behavior setting
The browser SHALL allow users to choose startup behavior between opening the new-tab page, restoring the last session, or opening configured pages.

#### Scenario: User chooses session restore
- **WHEN** the user configures startup to restore the last session
- **THEN** the next application start attempts to reopen the saved session tabs

### Requirement: Home page setting
The browser SHALL allow the home button destination to be configured.

#### Scenario: User sets custom home page
- **WHEN** the user configures a custom home page URL
- **THEN** activating the home button navigates the active tab to that configured page

### Requirement: Download settings
The browser SHALL allow users to configure download location behavior.

#### Scenario: User changes download directory
- **WHEN** the user selects a download directory in settings
- **THEN** future downloads use that directory by default

### Requirement: Persist preferences
The browser SHALL persist settings across application restarts.

#### Scenario: Application restarts after setting change
- **WHEN** the user changes a setting and restarts the application
- **THEN** the browser loads the previously saved setting value
