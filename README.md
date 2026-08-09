# CID KAGENOU — Portfolio

A dependency-free, static portfolio hosted on Vercel. It uses native ES modules, so no install or build step is required.

## Edit content

Update `src/config.js` for profile details, projects, contact links, and payment options. Section rendering lives in `src/sections/`; visual styles are in `src/styles.css`.

## Run locally

Serve the directory with any static file server, for example `npx serve .`, then open the URL it prints. Do not open `index.html` directly: ES modules work more reliably through a local server.

## Deploy

Push to the connected GitHub repository. Vercel serves the repository root as a static site; `vercel.json` sets caching and security headers.

## Project map

- `index.html` — semantic entry point, metadata, and pre-paint preference loading
- `src/app.js` — composition and app lifecycle
- `src/config.js` — all editable portfolio content
- `src/sections/` — individual page sections
- `src/utils/` — settings, animation, cursor, scrolling, and background utilities
- `src/components/` — settings panel
