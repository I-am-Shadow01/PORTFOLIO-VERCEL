# CID — Kinetic Studio

A bilingual (Thai/English), responsive developer portfolio. The focus is demonstrable public work and a native, interactive visual experience rather than decorative framework overhead.

## Design and interaction

- Editorial dark/light themes, persistent language and theme preferences, mobile navigation with keyboard and Escape support.
- Four curated public repositories, category filtering, project details, and direct source links. The SVG project visuals are original illustrative studies, not screenshots or evidence of functionality.
- A solid procedural WebGL2 kinetic sculpture with analytic geometry, surface normals, spectral material and studio lighting. Pointer or touch exploration, pause/resume, alternate material and reset are available. A local SVG poster is shown if WebGL2 cannot initialize.
- Render only while the hero is visible; suspend on hidden tabs and reduced-motion preference. Adaptive resolution/pacing is based on measured browser cadence, not claims of a guaranteed frame rate. Secondary CSS animations are scoped to visible illustrations.
- No runtime framework, external JavaScript, tracking, or private repository data. The existing public profile/contact content is retained.

## Local run

Use Python 3 (or any static HTTP server):

```sh
python -m http.server 4173
```

Open http://127.0.0.1:4173. The production site is static; no runtime dependency install or build is needed.

## Validation

```sh
npm ci
npm run check
npx playwright install chromium
npm test
```

If the installed Chrome is preferred, set PLAYWRIGHT_CHANNEL=chrome and run the same tests. Playwright starts its own local server; CI installs Chromium and retains screenshots/reports. Tests cover navigation, language/theme persistence, project filtering, viewport bounds, frame changes and WebGL fallback, reduced motion, pause/reset and material changes. Real-device frame rate depends on GPU, resolution and thermal conditions.

## Structure

- index.html — entry point and metadata
- src/content.js — existing curated bilingual content and public project information
- src/main.js — semantic markup, filters and UI state
- src/styles.css — visual design, responsive layout and entry motion
- src/scene.js — GPU graphics and lifecycle
- src/sculpture-fallback.svg — local static hero fallback
- src/project-art.js / src/project-art.css — bespoke SVG studies and secondary motion
- src/motion.js — visibility observer
- tests/ — Playwright behavior/regression checks
- vercel.json — static hosting and security headers

Deployment is Git-linked through Vercel. Use a preview branch for visual checks before merging main.