## ADDED Requirements

### Requirement: Record browsing history
The browser SHALL record successful top-level page navigations as local history entries.

#### Scenario: Page navigation succeeds
- **WHEN** a normal web tab completes navigation to an HTTP or HTTPS page
- **THEN** the browser stores or updates a history entry with URL, title, favicon when available, visit count, and last visited time

### Requirement: History view
The browser SHALL provide a history view that lists and searches local browsing history.

#### Scenario: User searches history
- **WHEN** the user enters a query in the history view
- **THEN** the browser shows matching history entries by title or URL ordered by recency and relevance

### Requirement: Manage bookmarks
The browser SHALL allow users to add, remove, update, and open bookmarks.

#### Scenario: User bookmarks current page
- **WHEN** the user activates bookmark on a normal web page
- **THEN** the browser stores a bookmark with URL, title, favicon when available, creation time, and folder

#### Scenario: User removes bookmark
- **WHEN** the user removes an existing bookmark
- **THEN** the bookmark no longer appears in bookmark lists or address suggestions

### Requirement: New-tab integration
The browser SHALL make recent history and bookmarks available to the new-tab page as local browsing shortcuts.

#### Scenario: New-tab page loads shortcuts
- **WHEN** the user opens `kuaiqing://newtab`
- **THEN** the browser can display pinned bookmarks and recent visits without network access

### Requirement: Address suggestions
The browser SHALL support address suggestions from local history and bookmarks.

#### Scenario: User types in address bar
- **WHEN** the user types text in the address bar
- **THEN** the browser can show matching history and bookmark suggestions without changing the submitted navigation behavior
