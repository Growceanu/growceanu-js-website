# growceanu-js-website

Vanilla JavaScript for the **growceanu.com** Webflow site, served through the
[jsDelivr](https://www.jsdelivr.com/) CDN straight from this GitHub repo.

> © Growceanu. All rights reserved. Proprietary — not licensed for reuse.

> ⚠️ **This repo must stay PUBLIC.** jsDelivr's GitHub source only serves public
> repositories. The code here is client-side and already public on the live site.

## How Webflow loads these files

Reference a file by its jsDelivr URL, pinned to the **major version range `@1`**.
Add `.min.js` to get jsDelivr's on-the-fly minification.

```
https://cdn.jsdelivr.net/gh/Growceanu/growceanu-js-website@1/src/<file>.min.js
```

Embed in Webflow (Project Settings → Custom Code → Footer for site-wide, or
Page Settings → Custom Code → Before `</body>` for one page):

```html
<script
  src="https://cdn.jsdelivr.net/gh/Growceanu/growceanu-js-website@1/src/global-example.min.js"
  defer
></script>
```

`@1` always resolves to the latest `v1.x.y` tag. The URL in Webflow never changes
until a major version bump (see *Folder structure — current and planned* below).

## Authoring a script

Each file in `src/` is a self-contained IIFE with a header comment and **one
concern per file**. Template:

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

  if (window.Webflow) {
    window.Webflow.push(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
```

Before committing, syntax-check: `node --check src/<file>.js`.

## Naming convention — `<scope>-<name>.js`

`scope ∈ { global, home, despre, contact, component, lib }`

| Prefix | Meaning | Example |
|--------|---------|---------|
| `global-` | runs site-wide | `global-nav.js` |
| `home-`, `despre-`, `contact-` | one Webflow page | `home-hero.js` |
| `component-` | reusable widget | `component-accordion.js` |
| `lib-` | shared utility | `lib-dom.js` |

## Publishing a change

1. Edit/add the file under `src/`.
2. `node --check src/<file>.js`.
3. Commit to `main`.
4. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
5. Tag and push:
   ```bash
   git tag vX.Y.Z
   git push origin main --tags
   ```
6. `@1` picks up the new tag automatically (within the cache TTL).

Semver: **patch** = fix; **minor** = new script / compatible change; **major** =
breaking change (re-pin Webflow to the new `@N`).

## Caching & instant updates

- `@1` (range) is cached ~12h; exact tags (`@v1.2.0`) and commit SHAs are
  immutable and cached permanently.
- To force a refresh while testing against `@main`, purge:
  ```
  https://purge.jsdelivr.net/gh/Growceanu/growceanu-js-website@main/src/<file>.js
  ```
- For production hardening you may add an `integrity` (SRI) attribute to the
  `<script>` tag using the hash jsDelivr reports.

## Folder structure — current and planned

**Now (flat — Approach B):** all scripts live directly in `src/`, named by the
convention above. Chosen for speed.

**Later (scoped — Approach A):** when `src/` grows unwieldy, migrate to folders.
The filename prefix already encodes the destination, so the move is mechanical:

| Flat (now) | Scoped (later) |
|-----------|----------------|
| `src/global-*.js` | `src/global/*.js` |
| `src/home-*.js` | `src/pages/home/*.js` |
| `src/contact-*.js` | `src/pages/contact/*.js` |
| `src/component-*.js` | `src/components/*.js` |
| `src/lib-*.js` | `src/lib/*.js` |

This changes every CDN path, so it ships as a **major version bump** (`v2.0.0`)
and Webflow re-pins to `@2`. Treat it as a planned release, never an accident.
