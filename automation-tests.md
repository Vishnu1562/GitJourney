# Automation Test Specification: GitJourney

## Feature Overview
- **Feature Name**: GitJourney — Interactive GitHub Repo Transit Map & Storyteller
- **Vibe/Theme**: Modern vintage cartographic transit / subway line aesthetic. High craft, rich tactile micro-interactions, responsive SVG rail path, station boarding passes, ambient train sound effects via Web Audio API, and milestone fanfare.
- **Tech Stack**: Angular 22 (Standalone Components, Signals, Vitest, Web Audio API, HTML5 Canvas Confetti).
- **Target Audience**: Developers, hiring managers, and open source communities who want a memorable, visual way to explore a project's timeline and releases.

---

## Component Architecture Contract
The application is decomposed into clean, focused standalone components:
1. `RepoInputComponent` (`app-repo-input`):
   - Input bar with validation for `owner/repo` or full GitHub URL.
   - Quick-load preset chips (e.g., `angular/angular`, `facebook/react`, `torvalds/linux`, `vuejs/core`, `twbs/bootstrap`).
   - Loading indicator and rate-limit notice badge.
   - Inputs: `loading: boolean`, `rateLimit: RateLimitInfo | null`
   - Outputs: `loadRepo: EventEmitter<string>`, `selectPreset: EventEmitter<string>`

2. `JourneyMetricsComponent` (`app-journey-metrics`):
   - Real-time statistics bar:
     - Total Stations (Commits analyzed)
     - Express Junctions (Releases / Tags)
     - Journey Duration (Days from first to latest commit)
     - Midnight Oil Index (% of commits authored between 12 AM and 5 AM)
     - Top Conductors (Top commit authors with avatar/commit count)
   - Inputs: `metrics: JourneyMetrics | null`

3. `StationMapComponent` (`app-station-map`):
   - Responsive SVG railway route canvas with stations:
     - Origin Terminal: Initial commit
     - Waypoint Stations: Intermediate commits
     - Express Junctions: Release tags (highlighted with glowing badges)
     - Midnight Stations: Commits stamped with moon icon
     - Terminus: Latest commit (Head of line)
   - Animated Train Cart scrubber that follows the SVG line.
   - Play/Pause/Rewind controls and playback speed toggle (1x, 2x, 4x).
   - Zoom/pan and smooth scroll tracking to keep the active train in view.
   - Inputs: `stations: Station[]`, `activeStationIndex: number`, `isPlaying: boolean`, `speed: number`
   - Outputs: `stationSelect: EventEmitter<Station>`, `togglePlay: EventEmitter<void>`, `setSpeed: EventEmitter<number>`, `seekStation: EventEmitter<number>`

4. `StationInspectorModal` (`app-station-inspector`):
   - Vintage Boarding Pass / Railway Ticket modal detailing:
     - Station Name / Commit summary & full message
     - Station Master (Author name, email, avatar)
     - Departure Timestamp (formatted human-readable + relative time)
     - Ticket Reference / SHA hash (with 1-click copy feedback)
     - Release badge if this commit is an express junction
     - Next Station / Previous Station traversal buttons
     - Direct link to view on GitHub
   - Inputs: `station: Station | null`, `hasNext: boolean`, `hasPrev: boolean`
   - Outputs: `close: EventEmitter<void>`, `next: EventEmitter<void>`, `prev: EventEmitter<void>`

5. `AudioService` (`SoundFXService`):
   - Pure Web Audio API synthesized sound generator:
     - Departure whistle (`playWhistle()`)
     - Rail click-clack cadence (`playTrackClick()`)
     - Station arrival chime (`playStationChime()`)
     - Express release celebration fanfare (`playFanfare()`)
     - Audio mute/unmute state with persistent preference in LocalStorage.

6. `GitApiService` & `GitStorageService`:
   - Fetches repository details, commits, and releases from GitHub REST API.
   - Parses URLs and cleans repo strings (`https://github.com/owner/repo` -> `owner/repo`).
   - Handles rate limiting gracefully with automated fallback to rich curated demo datasets.
   - Client-side cache (SessionStorage) to prevent redundant network requests.

7. `AppComponent` (`app-root`):
   - Master orchestrator connecting state signals:
     - `currentRepo: WritableSignal<string>`
     - `isLoading: WritableSignal<boolean>`
     - `errorMessage: WritableSignal<string | null>`
     - `stations: Signal<Station[]>`
     - `activeStationIndex: WritableSignal<number>`
     - `isPlaying: WritableSignal<boolean>`
     - `selectedStation: WritableSignal<Station | null>`
     - `audioEnabled: WritableSignal<boolean>`

---

## Preconditions
1. Modern web browser with JavaScript and Web Audio API enabled.
2. Responsive from mobile screens (360px width) up to 4K ultra-wide displays.
3. Network connection available for live GitHub API; automated offline demo fallback when offline or rate-limited.

---

## Test Data
- Standard Valid Repo: `angular/angular`
- Preset Repos:
  - `facebook/react`
  - `vuejs/core`
  - `twbs/bootstrap`
  - `torvalds/linux`
- Fallback Curated Demo Repos:
  - `demo/gitjourney` (Pre-bundled mock dataset with 30 diverse commits, 4 releases, midnight oil commits).

---

## Happy Flows

### `HF-001`: Load Repository by Name and Render Railway Line
- **Preconditions**: User is on the landing page with empty or default input.
- **Actions**: User inputs `angular/angular` into the repo input bar and clicks "Explore Journey" (or presses Enter).
- **Expected Results**:
  - Loading skeleton appears during fetch.
  - Commits and releases are fetched and mapped into `Station` objects.
  - SVG railway route renders with station nodes, route color lines, and origin/terminus badges.
  - Metrics bar populates with total commits, release count, and duration.
- **Final State**: `isLoading = false`, `stations.length > 0`, `activeStationIndex = 0`.

### `HF-002`: Quick-Load via Preset Chip
- **Preconditions**: User is on the home screen.
- **Actions**: User clicks the "facebook/react" preset button.
- **Expected Results**:
  - Input field updates to `facebook/react`.
  - Journey auto-triggers and renders the React project transit map.
- **Final State**: Stations for React are loaded and rendered.

### `HF-003`: Station Selection Opens Boarding Pass Inspector
- **Preconditions**: Railway line is rendered with stations.
- **Actions**: User clicks on station node at index 5.
- **Expected Results**:
  - Station arrival chime audio triggers (if audio enabled).
  - Active station updates to index 5.
  - Vintage Boarding Pass modal opens showing commit message, author avatar, date, and SHA.
- **Final State**: `selectedStation !== null`, `activeStationIndex = 5`.

### `HF-004`: Play/Pause Journey Scrubber Moves Train Cart
- **Preconditions**: Route rendered with > 1 station.
- **Actions**: User clicks "Play Journey" button.
- **Expected Results**:
  - Train whistle audio effect plays.
  - Scrubber advances station by station at selected speed (e.g., 1.5s per station).
  - Rhythmic track click sound plays on each station transition.
  - Train cart SVG follows the track coordinates.
  - On reaching an Express Junction (Release), milestone chime/fanfare triggers.
  - On reaching Terminus, playback automatically stops and celebratory confetti triggers.
- **Final State**: `isPlaying = false`, `activeStationIndex = stations.length - 1`.

### `HF-005`: Audio Mute/Unmute State Toggle
- **Preconditions**: App is loaded with audio enabled by default.
- **Actions**: User clicks the sound toggle button in header.
- **Expected Results**:
  - Sound icon toggles to muted state.
  - AudioService silences all Web Audio output.
  - Preference persisted in `localStorage`.
- **Final State**: `audioEnabled = false`.

### `HF-006`: Copy Commit SHA to Clipboard
- **Preconditions**: Boarding pass inspector modal is open.
- **Actions**: User clicks the "Copy SHA" button beside the ticket reference.
- **Expected Results**:
  - SHA string copied to clipboard via `navigator.clipboard`.
  - Button displays "Copied!" feedback badge for 2 seconds.
- **Final State**: Clipboard contains the 7-character commit SHA.

### `HF-007`: Boarding Pass Next/Previous Navigation
- **Preconditions**: Inspector modal is open at station 3 of 10.
- **Actions**: User clicks "Next Station →".
- **Expected Results**:
  - Modal transitions to station 4.
  - Railway map moves active train indicator to station 4.
- **Final State**: `activeStationIndex = 4`, `selectedStation = stations[4]`.

---

## Negative Flows

### `NF-001`: Invalid Repository Input Format
- **Preconditions**: User focuses repo input field.
- **Actions**: User inputs invalid string (e.g. `just-a-word`, `foo/bar/baz/qux`, `///`) and submits.
- **Expected Results**:
  - Inline validation error appears: *"Please enter in 'owner/repo' format (e.g., angular/angular) or a valid GitHub URL."*
  - No network request is dispatched.
- **Final State**: Form is invalid, error visible, state unchanged.

### `NF-002`: Repository Not Found (404)
- **Preconditions**: User inputs a non-existent repo (e.g., `this-user-does-not-exist/neither-does-this-repo-9999`).
- **Actions**: Dispatches fetch to GitHub API.
- **Expected Results**:
  - API returns HTTP 404.
  - Friendly error banner displayed: *"Repository not found. Double-check the spelling, or try one of our curated showcase routes below."*
  - 1-click button provided: *"Load Demo Journey"*.
- **Final State**: `errorMessage !== null`, `isLoading = false`.

### `NF-003`: GitHub API Rate Limit Exceeded (403)
- **Preconditions**: Unauthenticated IP hits GitHub API rate limit (60 requests/hr).
- **Actions**: GitHub API returns 403 Forbidden with `x-ratelimit-remaining: 0`.
- **Expected Results**:
  - App catches 403 gracefully without crash.
  - Notice banner informs: *"GitHub API rate limit reached for your network. Switching seamlessly to offline demo mode!"*
  - Automatically loads full curated demo repository dataset so user experience is not disrupted.
- **Final State**: Demo dataset rendered, informative banner visible with reset time.

### `NF-004`: Network Disconnected / Offline
- **Preconditions**: User device loses internet connection.
- **Actions**: User attempts to load a new repo while offline.
- **Expected Results**:
  - Network error caught.
  - Notice shows offline status and offers to load offline-cached repos or pre-bundled demo.
- **Final State**: Demo journey accessible even when offline.

---

## Edge Cases

### `EC-001`: Single-Commit Repository
- **Preconditions**: Repository has only 1 commit.
- **Actions**: Journey loaded for 1-commit repo.
- **Expected Results**:
  - Route renders single origin/terminus station without division by zero.
  - Play button is disabled or visually indicates journey has arrived.
  - No NaN or coordinate calculation errors in SVG track.
- **Final State**: 1 station rendered cleanly.

### `EC-002`: Long Commit Messages and Emojis
- **Preconditions**: Commit message has 300+ characters, markdown links, and emojis (e.g. `feat(core): 🎉 support 🚀 unicode`).
- **Actions**: Station rendered on map and inspected in modal.
- **Expected Results**:
  - Map station tooltip truncates summary cleanly with ellipsis.
  - Boarding pass modal displays full formatted message with emoji support without layout overflow.
- **Final State**: Layout intact, no horizontal scroll blowout.

### `EC-003`: Missing Author Avatar or Anonymous Commits
- **Preconditions**: Commit author has no GitHub profile picture or is authored by git CLI without linked email.
- **Actions**: Station inspector displayed.
- **Expected Results**:
  - Fallback retro railway conductor avatar / SVG monogram generated from author initials.
  - No broken `<img>` icon.
- **Final State**: Clean fallback avatar displayed.

### `EC-004`: Rapid Scrubber Play/Pause & Speed Changes
- **Preconditions**: Journey playback is running at 1x.
- **Actions**: User rapidly toggles speed (1x -> 2x -> 4x -> Pause -> Play).
- **Expected Results**:
  - Timers cleanly cancel and reschedule without leaking intervals or overlapping audio cues.
  - Train smoothly adjusts speed without teleporting erratically.
- **Final State**: Consistent timing state.

---

## Validation Rules
- `VR-001`: Repo input pattern matches either:
  1. `owner/repo`: `^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$`
  2. GitHub URL: `^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/)?$`
- `VR-002`: Cleaned repo identifier is always formatted as lowercase `owner/repo`.

---

## State Transitions
- `ST-001`: Initial Landing State (`currentRepo: null`, empty route, preset chips visible).
- `ST-002`: Loading State (`isLoading: true`, pulsating train track skeleton, controls disabled).
- `ST-003`: Journey Ready State (`isLoading: false`, track drawn, station 0 active, train at origin).
- `ST-004`: Traveling State (`isPlaying: true`, train advancing along path, audio clicks ticking).
- `ST-005`: Inspection State (`selectedStation !== null`, modal open, journey optionally paused).
- `ST-006`: Terminus Arrival State (`activeStationIndex === stations.length - 1`, confetti explosion, fanfare played).

---

## Recovery & Retry
- `RR-001`: Retry button on failed API requests.
- `RR-002`: "Explore Demo Journey" button always available as 1-click fallback.
- `RR-003`: Web Audio Context resume handler if browser autoplay policy blocks initial audio until user gesture.

---

## Priority Matrix
- **P0 (Critical)**: `HF-001`, `HF-002`, `HF-003`, `HF-004`, `NF-001`, `NF-002`, `NF-003`, `EC-001`.
- **P1 (High)**: `HF-005`, `HF-006`, `HF-007`, `ST-006`, `RR-002`.
- **P2 (Delight)**: `SoundFXService` procedural audio, Canvas confetti, responsive SVG animations.
