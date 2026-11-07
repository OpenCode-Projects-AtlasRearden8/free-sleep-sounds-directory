# STATUS — Free Sleep Sounds Directory

Last updated: 2026-11-07 · Built and tested by Asdale Dynamics, LLC

## What was built

A zero-dependency static site (`index.html` + `styles.css` + `app.js` +
`audio-engine.js` + `data/sources.js`) cataloguing free, no-signup sleep and
focus audio:

- **Brown noise / rain / fan loops**: myNoise, SimplyNoise, Rainy Mood, plus curated
  YouTube search pages with long-upload filters.
- **ASMR-safe picks**: every audio entry is sound-only; a dedicated "no talking" search
  recipe keeps results whisper-free.
- **Workaround-free streamers**: 24/7 live streams (Lofi Girl) — permanent streams, not
  10-hour videos that die mid-night. No Premium, no extensions, no ad tricks.
- **YouTube length tricks**: honest first-party features only — one-click Loop,
  the "Long (> 20 min)" filter, and the YouTube mobile app's built-in Sleep Timer.
- **Timer apps that auto-stop**: iPhone/iPad Clock "Stop Playing", Android Clock
  media-volume fade, Windows/Mac/Linux shutdown-command timers — so audio never
  runs all night.
- **Built-in brown noise generator** with an auto-stop fade-out sleep timer
  (1–480 min), running locally in the browser via Web Audio. Works offline
  (e.g. over `file://`).
- **Toggleable ADHD focus edition**: one button re-flags focus-session picks, opens
  a focus panel, and pairs picks with a 25-minute Pomodoro timer.

Design rules enforced by tests: every source must be `signupRequired: false`,
`adTricks: false`, https-only URLs, and valid categories.

## How to run

```bash
npm start          # zero-dependency server → http://localhost:8080
# or: just open index.html directly (works over file://)
```

## How to verify (test suite)

```bash
npm test           # node --test, no dev dependencies needed
```

15 tests cover: source data integrity (no signup, no ad-tricks, valid types/categories,
https URLs), topic coverage (brown noise, rain, fans, ASMR-safe, streamers, YouTube
tricks, timers, focus), fade-plan math (fade ≤ total, curve ramps to 1), minute parsing
(1–480, junk rejected), remaining-time formatting, brown-noise amplitude headroom
(max ≤ 3.5 over a 100k-sample walk), HTML escaping, no remote/insecure scripts,
index.html wiring, exact MIT copyright line, README credit, and STATUS.md presence.

## Verification results (this build)

- `npm test`: **15/15 tests pass** (issues found and fixed during verification:
  removed the risky inline duplicate of the source data, fixed `data/sources.js`
  not exposing `window.SOURCES` in the browser, fixed a false-positive regex on
  script tags, and scoped the insecure-link check to allow localhost examples).
- `node --check`-equivalent syntax validation for `app.js`, `audio-engine.js`,
  `data/sources.js`, `server.js`: pass.
- `npm start` server smoke run in this session: page and assets returned HTTP 200
  with correct content types (verified via curl during the build).

## Known gaps / honest limitations

- No external-link health checker: URLs (e.g. myNoise, SimplyNoise, YouTube search
  pages) were chosen for stability, but a scheduled link-check job is not wired up yet.
- The "no signup" claim is a point-in-time editorial check, not continuously enforced
  by a crawler; third-party sites can change their pages.
- The built-in generator is one timbre (brown noise). Rain/fan presets inside the
  generator itself are future work.
- YouTube's mobile-app Sleep Timer UI wording can vary by app version; the entry links
  the official Help article, but exact menu labels may drift.
- No automated browser test (e.g. Playwright) for the Play/Stop UI; the audio engine's
  browser-only half is verified by review and manual use, while its pure math is fully
  unit-tested.
- Lofi Girl and YouTube ads: the streams themselves are free and no-signup, but YouTube
  may show in-stream ads to non-Premium viewers — disclosed on the card rather than
  recommended around.
