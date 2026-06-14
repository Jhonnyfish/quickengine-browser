# download-management Specification

## Purpose
TBD - created by archiving change browser-downloads. Update Purpose after archive.
## Requirements
### Requirement: Track downloads
The browser SHALL track downloads initiated by web pages and expose their state to the renderer.

#### Scenario: Download starts
- **WHEN** a web page starts a file download
- **THEN** the browser creates a download item with filename, source URL, target path, received bytes, total bytes when available, state, and start time

#### Scenario: Download progress updates
- **WHEN** a tracked download receives progress updates
- **THEN** the renderer receives updated progress and state for the corresponding download item

### Requirement: Download shelf and manager
The browser SHALL provide a visible download affordance for recent downloads and a manager view for all persisted recent downloads.

#### Scenario: User opens download manager
- **WHEN** the user activates the downloads control
- **THEN** the browser displays a download manager with recent downloads, states, progress, and available actions

### Requirement: Download actions
The browser SHALL support opening completed files, opening containing folders, canceling active downloads, retrying failed downloads, and removing entries from the list.

#### Scenario: User opens completed download
- **WHEN** the user activates open on a completed download
- **THEN** the browser asks the operating system to open the downloaded file

#### Scenario: User cancels active download
- **WHEN** the user cancels an active download
- **THEN** the download is canceled and the item state is updated to canceled

### Requirement: Download location preference
The browser SHALL use a configured download directory when one is set and otherwise use the operating system default downloads directory.

#### Scenario: Download location is configured
- **WHEN** a file download begins and a custom download directory is configured
- **THEN** the browser saves the file under the configured directory unless the user chooses another location

