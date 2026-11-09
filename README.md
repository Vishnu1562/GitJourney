# 🚂 GitJourney — Interactive GitHub Repo Transit Map & Storyteller

> **Transform any public GitHub repository into a playable, animated vintage transit line with real-time audio synthesis, milestone fanfares, and boarding pass commit inspectors.**

[![Angular](https://img.shields.io/badge/Angular-22_Standalone_%2B_Signals-dd0031.svg)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org)
[![Vitest](https://img.shields.io/badge/Vitest-44_Passing_Tests-729B1B.svg)](https://vitest.dev)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Procedural_Synthesis-f59e0b.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 🌟 Overview & Portfolio Value

**GitJourney** was built to prove that developer tools can be both technically rigorous and delightfully immersive. Rather than rendering raw JSON commit logs or generic tables, GitJourney models software repositories as living railway lines:

- **Origin Terminal**: The inaugural birth of the project.
- **Waypoints**: Iterative commits and feature deliveries.
- **Express Junctions**: Official releases and semantic version tags highlighted with glowing rings.
- **Midnight Expeditions**: Coding sessions authored between 12:00 AM and 5:00 AM stamped with moon markers.
- **Terminus Head**: The active HEAD of the line, triggering confetti physics upon arrival.

---

## 🛠️ Key Technical Features

### 1. Zero-Asset Procedural Web Audio Engine
- Built directly on top of the browser's native **Web Audio API** without loading external audio MP3/WAV files.
- Synthesizes:
  - Dual-pitch steam whistle (`playWhistle()`) with dynamic acoustic filter body.
  - Tactile wheel click-clack (`playTrackClick()`) with exponential frequency drops.
  - Station arrival bell chime (`playStationChime()`).
  - Release celebration fanfare (`playFanfare()`) with multi-note chord arpeggios.
- Audio preferences persist in `localStorage` with mute toggles and autoplay policy safeguards.

### 2. High-Performance SVG Rail Cartography
- Generates responsive, undulating SVG bezier track lines dynamically calculated from repository length.
- Features a synchronized animated train engine with steam puff particles and headlight beams following the route.
- Interactive station nodes with hover previews, express halos, and full accessibility support.

### 3. Vintage Boarding Pass Inspector Modal
- Perforated ticket styling with brass typography and watermark stamps.
- 1-click commit SHA clipboard copy with animated visual feedback.
- Station master / author profile cards with initials fallback monograms.
- Keyboard navigation (Escape to close, Next / Previous station stepping).

### 4. Rate-Limit Resilience & Curated Showcase Mode
- Built-in graceful handling of GitHub API unauthenticated rate limits (HTTP 403) and 404s.
- Automatically and seamlessly falls back to a curated 15-station interactive showcase dataset representing the GitJourney story itself.

---

## 📋 Architecture & Behavioral Contract

GitJourney was engineered using **Flow-First Test-Driven Development (TDD)**. All 20+ scenarios are documented in:
👉 [`automation-tests.md`](./automation-tests.md)

### Test Suite Highlights
- **44 Unit & Integration Tests** executed via **Vitest**.
- **100% Green Test Suite** covering:
  - Repository URL & slug validation (`VR-001`, `NF-001`).
  - Mathematical metric derivation (Days span, Midnight oil %, Conductor rankings, `EC-001`).
  - Web Audio mute persistence (`HF-005`).
  - Playback speed multipliers (1x, 2x, 4x) & scrubber timing (`HF-004`, `EC-004`).
  - Clipboard interactions and modal navigation (`HF-006`, `HF-007`).

---

## 💼 Resume & Portfolio Talking Points

Ready to paste directly into your resume under **Key Technical Projects**:

```markdown
### GitJourney — Interactive GitHub Repo Transit Cartographer
- Engineered an interactive repository visualizer using Angular 22 Signals, SVG path morphing, and native Web Audio API procedural synthesis.
- Architected an offline-first data layer with GitHub REST API integration, rate-limit safeguards, and client-side session caching.
- Synthesized multi-oscillator train whistles, track click-clacks, and release fanfare chords directly in the browser with zero external audio assets.
- Implemented 44 comprehensive unit and integration tests using Vitest following Flow-First TDD, achieving a 100% green test suite.
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+` or `v11+`

### Installation
```bash
cd D:/Projects/GitJourney
npm install
```

### Run Locally
```bash
npm start
```
Open `http://localhost:4200` in your browser.

### Run Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```
Compiled production bundles are saved to `dist/gitjourney/browser`.

---

## 📜 License
MIT © 2026. Crafted with passion for delightful frontend engineering.
