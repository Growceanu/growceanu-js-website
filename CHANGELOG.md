# Changelog

Notable changes to the served scripts. Versions are Git tags (`vX.Y.Z`);
Webflow pins the major range `@1`.

## v1.1.7 — 2026-07-02

- `campaigns-v2.js` — card image now uses the REST `cover` field
  (`cover[0].url`) as the primary source, falling back to `round_images`
  then the placeholder.
- `campaigns-v2.js` — coming-soon rounds hide the raising block (amount +
  percent) and the valuation; live and closed rounds still show them.

## v1.1.6 — 2026-07-02

- `campaigns-v2.js` — company card now shows the company name (`startup.name`,
  trimmed) instead of the round name. Tags are read from `startup.tags`
  (`tag.tag_translations[].tag`); previously the script read a non-existent
  top-level `tags` field, so tags never rendered.

## v1.1.5 — 2026-07-01

- Actualizat Follow label

## v1.1.4 — 2026-07-01

- Adăugat translate la label Coming soon

## v1.1.3 — 2026-07-01

- FIX Actualizat urls pentru locale RO.

## v1.1.2 — 2026-07-01

- Actualizat urls pentru locale RO.

## v1.1.1 — 2026-06-30

- `campaign.js`, `campaigns-updated.js`, `campaigns-v2.js` — switch API and
  link targets from staging to production (`api3.growceanu.com`,
  `app.growceanu.com`).

## v1.1.0 — 2026-06-30

- `src/campaign.js` — single campaign detail page (`single-campaign-container`).
- `src/campaigns-updated.js` — campaigns grid (`campaigns-grid-container`).
- `src/campaigns-v2.js` — campaigns grid v2 with coming-soon section.
- `src/videomodal.js` + `src/videomodal.css` — Wistia video modal.

## v1.0.0 — 2026-06-30

- Initial repo scaffold (skeleton, metadata, docs).
- `src/global-example.js` — jsDelivr delivery sanity-check script.
