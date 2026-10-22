# CID — Software × Curiosity

A complete redesign of the personal portfolio: a responsive editorial site with a single generative visual experiment instead of the previous multi-layer particle system.

## Design decisions

- **Writing:** concise, straightforward Thai and English. No fictional job titles, inflated project counts, or artificial performance claims.
- **Information architecture:** Introduction → featured Android build → selected public repositories → working principles → current interests → contact.
- **Visual language:** generous typography, structured spacing, tactile project illustrations, subdued indigo/ice palette, and an optional light theme.
- **Performance:** vanilla ES modules; one opt-in WebGL2 drawing surface, frame-capped, automatically suspended offscreen, with a CSS fallback and reduced-motion handling. No frontend framework or bundler.
- **Integrity:** project descriptions are based on public repository READMEs. Private repositories, payment details, and any access secrets are deliberately omitted.

## Repository structure

```
index.html                 semantic entry point and metadata
src/content.js             curated bilingual copy and project data
src/main.js                semantic component rendering and interactions
src/scene.js               isolated WebGL2 visual, cleanup and fallback
src/styles.css             design system, layout, responsive states
favicon.svg                vector identity
vercel.json                static hosting and security headers
tests/site.spec.mjs        Chromium desktop/mobile/keyboard/locale tests
playwright.config.mjs      local test server and browser configuration
.github/workflows/site-checks.yml
```

## Local usage

Install Node.js (for browser tests only), then run a static web server from the repository root:

```bash
python3 -m http.server 4173
```

Open http://localhost:4173. The public site does not need `npm install` or a build step.

## Automated checks

```bash
npm install
npx playwright install chromium
npm run check
npm test
```

The workflow runs on pull requests and saves full-page desktop and mobile screenshots as an artifact for visual review.

## Updating content

Edit `src/content.js`. Each project has a public repository name, a short factual description in Thai and English, its challenge, its approach, and technologies. It intentionally doesn't auto-publish every repository (including private ones). Text and project cards share one data source.

The hero artwork is abstract and the featured audio object is a visual study, **not an actual screenshot** of the Android app.
