# Free Sleep Sounds Directory

A curated directory of **free, no-signup sleep and focus audio**: brown noise, rain, fan
loops, ASMR-safe picks, workaround-free streamers, YouTube length tricks, and timer methods
that auto-stop so audio never runs all night.

It ships with a **built-in brown noise generator** and a **sleep timer that fades the audio
out and stops it** — pure Web Audio in your browser, no stream to buffer, works offline.

Includes a toggleable **ADHD focus edition**: flip one button and the directory re-sorts
around focus-session picks, paired with a 25-minute (Pomodoro-style) timer.

By [Asdale Dynamics, LLC](https://dylanasdale.github.io/) — beginner-friendly, plain-English
tools. *Education only; not medical advice.*

## What's inside

| Category | What you get |
| --- | --- |
| Brown noise | myNoise, SimplyNoise, built-in generator |
| Rain / fan loops | Rainy Mood, curated YouTube searches with long-upload filters |
| ASMR-safe picks | "no talking" search recipes — sounds only, nothing that jolts you awake |
| Workaround-free streamers | 24/7 live streams (e.g. Lofi Girl), no Premium needed |
| YouTube length tricks | honest first-party tricks: Loop, "Long (> 20 min)" filter, built-in sleep timer |
| Sleep timers | iPhone "Stop Playing", Android media fade, Mac/Linux/Windows shutdown commands |

Every entry is verified **free, no account required**, and none involve ad-blocking tricks or
sketchy "extensions". Distinct from our other directory (`free-focus-tools-directory`,
productivity tools) — this one is sleep & focus *audio*.

## How to run

It's zero-dependency static site. Any of these work:

```bash
# Option 1: tiny built-in server (Node 18+)
npm start                          # http://localhost:8080

# Option 2: just open the file
# double-click index.html — it works over file:// too
```

## How to run tests

```bash
npm test                           # node --test, no dev dependencies
```

Tests cover: data integrity (every source no-signup, no ad-tricks, valid categories and
https URLs), required topic coverage, timer/fade math, minute parsing, HTML escaping, and
static checks that the page wires everything up correctly.

## Structure

```
index.html        the directory page (+ tile layout, filters, focus edition)
app.js            rendering, filters, focus toggle, timer UI
audio-engine.js   Web Audio brown-noise generator + fade-out sleep timer
data/sources.js   the curated source list (one data file, tests verify it)
server.js         zero-dependency static file server (also serves as an example)
test/             node:test suite
```

## Verification checklist

- `npm test` passes (run it; the suite also checks LICENSE and README wording)
- Open the page, click **Play** on the Sleep Timer, sound fades out and stops

## License

MIT — see [LICENSE](LICENSE). © Copyright (c) 2026 Asdale Dynamics, LLC.

Maintenance note: to add or fix a source, edit `data/sources.js`, then run `npm test`.
