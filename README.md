# CID KAGENOU — Portfolio

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
| idle awareness | expensive layers halve their update rate when the pointer is still |
| scroll & energy parallax | every layer has a depth; pointer/scroll speed feeds an `energy` term that drives speed, glow and star rate |

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
