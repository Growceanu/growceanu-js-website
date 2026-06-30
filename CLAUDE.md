# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`growceanu-js-website` hosts the custom **vanilla JavaScript** for the **growceanu.com** site (built in Webflow). The files here are served straight from GitHub through the **jsDelivr** CDN and referenced from Webflow's custom-code panels. There is **no build step** — what is committed is what ships (jsDelivr minifies on the fly via the `.min.js` URL suffix).

> ⚠️ **This repo must stay PUBLIC.** jsDelivr's GitHub source only serves public repositories.
> © Growceanu. All rights reserved. Proprietary — not licensed for reuse.

## Hard rules (do not break)

- **No build tooling.** No bundler, no npm dependencies, no TypeScript, no CI, no transpile step. Files in `src/` are hand-written ES that runs as-is in the browser. Don't introduce a `dependencies` block, a build script, or a `dist/`.
- **Keep the repo public** (see above).
- **Never change a published CDN path lightly** — Webflow pins `@1`, so a moved/renamed `src/` file silently breaks the live site. Path changes are major-version events (see Versioning).

## Authoring a script

Every file in `src/` is a self-contained **IIFE** with a header comment and **one concern per file**. Template:

```js
/*!
 * <scope>-<name>.js — <one-line purpose>
 * Used on: <Webflow page(s) / "site-wide">
 * Added: v<X.Y.Z>
 */
(function () {
  "use strict";

  function init() {
    // DOM-dependent logic here
  }

  // Run after Webflow has initialized the page; fall back to DOMContentLoaded.
  if (window.Webflow) {
    window.Webflow.push(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
```

Before committing, syntax-check (this is the only "test" in this repo):

```bash
node --check src/<file>.js
```

## Naming convention — `<scope>-<name>.js`

`scope ∈ { global, home, despre, contact, component, lib }`

| Prefix | Meaning | Example |
|--------|---------|---------|
| `global-` | runs site-wide | `global-nav.js` |
| `home-`, `despre-`, `contact-` | one Webflow page | `home-hero.js` |
| `component-` | reusable widget | `component-accordion.js` |
| `lib-` | shared utility | `lib-dom.js` |

The repo is **flat** (`src/*.js`) for now. The prefix encodes a future folder layout — when `src/` grows unwieldy it migrates to scoped folders (`src/pages/home/`, `src/components/`, …) as a **major version bump**. See the README "Folder structure" section.

## Serving from Webflow (jsDelivr)

Production URL, pinned to the major range `@1`, auto-minified:

```
https://cdn.jsdelivr.net/gh/Growceanu/growceanu-js-website@1/src/<file>.min.js
```

Embed in Webflow custom code (Project Settings → Footer for site-wide, or Page Settings → Before `</body>`):

```html
<script src="https://cdn.jsdelivr.net/gh/Growceanu/growceanu-js-website@1/src/global-example.min.js" defer></script>
```

While testing against `@main`, purge stale cache:
`https://purge.jsdelivr.net/gh/Growceanu/growceanu-js-website@main/src/<file>.js`

## Versioning & publishing a change

Releases are semver Git tags; Webflow pins `@1`, which resolves to the latest `v1.x.y`.

1. Edit/add the file under `src/`; `node --check` it.
2. Commit to `main`.
3. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
4. Tag and push:
   ```bash
   git tag vX.Y.Z
   git push origin main --tags
   ```

Semver: **patch** = fix to an existing script; **minor** = new script / backward-compatible change; **major** = breaking change, including the flat→scoped folder migration (re-pin Webflow to the new `@N`).

## Conventions

- Indentation: 2 spaces, LF, final newline (enforced by `.editorconfig`).
- Git identity for commits: the `aerimescu-grow` account/identity (as on all Growceanu repos).
- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

## Files

- `src/` — the served scripts (flat, scope-prefixed).
- `examples/webflow-embed.html` — copy-paste embed snippet for Webflow.
- `README.md` — full usage/authoring/publish docs (human-facing).
- `CHANGELOG.md` — one entry per released tag.
- `package.json` — metadata only (`UNLICENSED`, `private`); **no** dependencies or build scripts.

---

Pentru context organizațional complet:
```bash
claude --add-dir "../growceanu-kb"
```
