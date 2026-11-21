# CID KAGENOU — Portfolio

## Visual restoration (November 2026)

The original neon-lime / dark editorial design is intentionally restored from
commit `3bce83b` instead of replacing its identity with a new template. It keeps
the custom Canvas2D particle engine, interactive background, project search,
theme/accent/hue controls, language switching and optional visual effects.

The restoration fixes narrow-phone typography and statistics, an accidental
accent rewrite when the color picker initializes, rapid theme switching,
reduced-motion static canvas repainting, hidden canvas effects accumulating
in low-power mode, and adaptive particle density at the lowest quality tier.
The decorative canvas has a bounded pixel budget on very large screens.

For verification, run `npm ci && npm run check && npm test` for real Chromium
responsive/interaction tests. Existing headless engine smoke/benchmarks remain
in `verify/`: run `npm ci --prefix verify && npm run test:smoke`. Dependencies
are for tests only; the deployed site remains a static ES-module application.

### Orbit-motion correction

The mathematical circles (Fourier epicycles, 4D hypersphere, Lorenz attractor,
and times-table cardioid) now use elapsed-time integration rather than
multiplying total uptime by changing interaction speed. Pointer influence is
smoothed, epicycle circles share their exact centers with the rotating arms,
and the cardioid evolves through recognizable low-order patterns. Hypersphere
projection reuses scalar outputs and cached trigonometry instead of allocating
arrays for every projected point.

A dependency-free, static portfolio hosted on Vercel. It uses native ES modules, so no install or build step is required.

## Edit content

Update `src/config.js` for profile details, projects, contact links, and payment options. Section rendering lives in `src/sections/`; visual styles are in `src/styles.css`.

## Run locally

Serve the directory with any static file server, for example `npx serve .`, then open the URL it prints. Do not open `index.html` directly: ES modules work more reliably through a local server.

## Deploy

Push to the connected GitHub repository. Vercel serves the repository root as a static site; `vercel.json` sets caching and security headers.

## Project map

- `index.html` — semantic entry point, metadata, pre-paint preference loading, font preloads
- `src/app.js` — composition and app lifecycle
- `src/config.js` — all editable portfolio content
- `src/sections/` — individual page sections
- `src/utils/loop.js` — **one shared `requestAnimationFrame` loop + shared pointer/scroll state** for the whole site
- `src/utils/background.js` — canvas visual engine (driven by `loop.js`)
- `src/utils/` — settings, animation, cursor, scrolling, effects
- `src/components/` — settings panel

## Performance architecture (v2)

The whole page runs on **a single rAF loop** (`src/utils/loop.js`). Every animated
feature — background layers, cursor ring, sparkle trail, FPS meter, nav/scroll
progress, hero typing — subscribes to it instead of keeping its own loop or its
own `mousemove`/`scroll` listeners. The loop also pauses automatically when the
tab is hidden and exposes `prefers-reduced-motion`.

The background engine (`src/utils/background.js`) is still dependency-free
Canvas2D (no three.js — a ~160KB dependency + GPU context would cost more than
the line-art math layers it would replace). It is, however, heavily optimized:

| technique | effect |
|---|---|
| alpha-bucket batching | all segments of a layer are grouped by quantized alpha and stroked once per bucket → `stroke()` drops from ~2,000/frame to ≤10/layer |
| cached color table | `rgba(...)` strings are precomputed per accent change, not per segment |
| typed-array spatial grid | counting-sort grid (no `Map<string,[]>`) → zero per-frame allocation |
| ring-buffer trails | Lorenz / flow-field / epicycle trails live in `Float32Array`s → no GC churn |
| low-res wave buffer | wave interference writes ~5,500 px (was 921,600) then upscales |
| adaptive quality | FPS hysteresis first lowers backing-store resolution, then drops layers; reported live via `pf:adaptive-quality` |
| frame continuity | never clear the canvas and omit visible orbit/flow/wave layers on idle frames; all active layers repaint together |
| scroll & energy parallax | every layer has a depth; pointer/scroll speed feeds an `energy` term that drives speed, glow and star rate |

On small coarse-pointer screens, **Adaptive Quality** limits the decorative
Canvas2D backing scale to 1.4× (or the device DPR if lower), then continues
adjusting resolution/layers using the existing FPS hysteresis. Page layout,
fonts, and controls remain at native CSS/device rendering resolution. Turning
Adaptive Quality off immediately restores the full available Canvas scale
(up to 2× DPR and the existing pixel budget) and any adaptively hidden layers.
The 1.4× threshold was compared in Chrome mobile emulation; it is not a
physical-phone FPS guarantee.

### Motion continuity regression (21 November 2026)

The background now preserves the same particles, stars, flow points, trails,
and Lorenz state through ordinary viewport changes (including dynamic mobile
browser chrome). Historical pixel-space trails are transformed with the new
viewport, rather than wiped and randomly reseeded. Particle and flow motion,
star lifetimes, visual impulses, and easing use elapsed time, not an assumed
display refresh rate. Soft-core pair forces have finite bounds, and the vortex
field mixes Cartesian directions to avoid an `atan2` branch-cut snap.
Scroll-driven background parallax is eased with bounded per-frame drift so
large programmatic scroll changes cannot teleport the decorative scene.

In Performance Mode, clearing a Canvas frame also means **redrawing every
currently visible effect**. Previously the idle optimization skipped drawing
epicycles/flow/waves every other frame, producing an observable flicker even
when the FPS counter looked healthy. Adaptive transitions now have minimum
dwell/hysteresis and fade out expensive layers rather than instantaneously
dropping them; particle counts converge gradually.

Run `npm test` for browser + physics regression. `tests/motion-continuity.spec.mjs`
measures the actual Canvas draw cadence and instruments read-only phase/particle
state through mobile resize, orientation and tab visibility. Run
`node verify/motion-benchmark.mjs` for paired Chrome screenshots, video and
callback-timing samples against the current production baseline. A callback
cadence is **not** physical-screen FPS, and passing tests does not by itself
guarantee perceptually flawless animation on every real device.

Benchmarked headlessly (same interaction script, 1280×720, software rasterizer):

| mode | frame time before → after | canvas state writes/frame before → after |
|---|---|---|
| eco | 0.09 → 0.11 ms | 0.8 → 0.8 |
| medium | 3.2 → 2.2 ms | 791 → 30 |
| performance | 23.0 → 11.7 ms | 3,853 → 103 |

(`putImageData` pixels per frame: 921,600 → 5,544.)

### Settings & shortcuts

Settings (gear button): theme, language, accent + custom hue picker, font size,
**motion intensity slider**, cursor, **cursor trail**, background FX,
**adaptive quality**, performance mode, FPS counter.

First visit on a `prefers-reduced-motion` system starts in a calm preset
(animations off, eco mode) — every choice can be changed afterwards.

Shortcuts: `Alt+S` settings · `Alt+T` cycle theme · `Alt+F` FPS meter.

## Verification

`verify/` contains a headless harness (jsdom + `@napi-rs/canvas`, not part of
the deployed site) that boots the real `app.js`, drives frames and interaction,
and checks for regressions. After `npm i` inside `verify/`:

```bash
node smoke.mjs ..                 # full-app regression check
node bench.mjs .. performance     # engine benchmark + canvas screenshot
```

## Project explorer (2026 refresh)

Public work is curated in `src/config.js` and presented as bilingual case studies
by `src/sections/projects.js` and the scoped `src/project-explorer.css`.

- Filter by project type, search by name/stack, or press `/` to search.
  `Escape` clears search.
- Expand **Architecture notes** on each project card to see why it was built
  that way. Buttons, links and disclosures use semantic HTML and ARIA.
- The site requests *public repository metadata only* from the GitHub API once
  per page lifetime to show the latest push month. Curated dates render as a
  fallback when GitHub is rate-limited or unavailable. No API token is needed.
- Private repositories are deliberately excluded from public portfolio content.
- Existing Canvas2D, settings, animations, themes and language switching remain
  intact; the explorer adds no runtime dependency.

## Automated checks

Pull requests run `.github/workflows/portfolio-checks.yml` (Node 22 and
`verify/smoke.mjs`) to check real page boot, project filtering, search,
empty states, ARIA states, settings, bilingual rebuilding and background engine.
To run locally:

```bash
cd verify
npm ci
node smoke.mjs ..
```
