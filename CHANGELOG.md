# Changelog

Notable changes to the served scripts. Versions are Git tags (`vX.Y.Z`);
Webflow pins the major range `@1`.

## v1.1.19 — 2026-07-23

- `campaigns-v2.js` — non-openable coming-soon cards (Origin BCI, RongoDesign)
  are now grayscaled + dimmed so the openable cards (Rayscape, Urban Spaces)
  clearly stand out; before, the only difference was the "See more" label. Also,
  when the list query returns no cover for an openable prep round (Urban Spaces),
  the cover is pulled from the detail endpoint and swapped in, so the card shows
  a real image instead of the placeholder.

## v1.1.18 — 2026-07-23

- `campaigns-v2.js` — Campaign-preparation cards in the opportunities list now
  open the campaign detail page (like live cards) instead of only offering
  Follow. Openable = live rounds + preparation rounds. Preparation rounds are
  identified by an explicit id allowlist (`OPENABLE_PREP_IDS`, currently just
  Urban Spaces) because the API doesn't flag them per round yet — add ids or swap
  for the flag later. Openable cards get a brighter cover + a "See more" CTA and
  open in the same tab; non-openable coming-soon cards (Origin BCI, RongoDesign)
  keep Follow -> sign-up.

## v1.1.17 — 2026-07-23

- `videomodal.js` — the video now autoplays on mobile too. Mobile browsers block
  autoplay-with-sound outside a tap gesture (the Wistia player loads async), so
  it stayed paused. Added `silentAutoPlay: true` (muted autoplay fallback, with
  Wistia's "Click for sound" prompt) and `playsinline: true` (keeps playback
  inside the fullscreen modal on iOS). Desktop still autoplays with sound.

## v1.1.16 — 2026-07-23

- `campaign.js` — the video preview/poster image now falls back to the REST
  `cover` (`[{ url }]`) when a round has no `round_images` (e.g. a
  Campaign-preparation round like Urban Spaces), instead of showing the dark
  placeholder. Mirrors the fallback `campaigns-v2.js` already uses; rounds that
  have `round_images` (e.g. Rayscape) are unchanged.

## v1.1.15 — 2026-07-23

- `campaign.js` — the browser tab title is now set to the company name
  (`startup.name`, falling back to the round name) instead of the static
  "Campaign".
- `videomodal.js` — the video now autoplays when the modal opens (`autoPlay:
  true`; removed the on-open pause). Desktop plays with sound; on mobile the
  browser may fall back to muted because the async Wistia load lands outside the
  tap gesture.

## v1.1.14 — 2026-07-23

- `videomodal.css` — on mobile (≤767px) the video modal now fills the whole
  viewport (100vw × 100dvh, no side margins or fixed portrait ratio) instead of a
  boxed portrait dialog, so tapping the video opens it edge-to-edge. `dvh` tracks
  the mobile browser chrome, with `vh` as fallback. Desktop is unchanged.

## v1.1.13 — 2026-07-23

- `campaign.js` — deal-term rows with a zero/empty value now hide the whole row
  (label + value) instead of rendering a "-" placeholder. Covers pre-money and
  post-money valuation, minimum investment, external commitments, target round
  for Growceanu, raised through Growceanu, and target date. Each is a
  `.div-block-108` row; both the desktop `.dealtermscontent` table and the mobile
  copy are hidden. Also hides the investors pill (`.campaign-box-investors`) when
  a round has no investors yet. Live rounds are unchanged (all values > 0). Part
  of enabling the campaign detail page for Campaign-preparation rounds (the card
  link + backend detail endpoint for preparation rounds are tracked separately).
- `campaign.js` — the Type deal-term row (`.div-block-107`) now hides when the
  round has no type set (empty or "-"), consistent with the other deal terms.
- `campaign.js`, `campaigns-v2.js` — the Wistia video id is now parsed from a
  full media URL (`https://<acct>.wistia.com/medias/<id>`) as well as from a bare
  id. Previously a full URL was stripped to a garbage string that still passed
  the modal's validator, so the play button appeared but the video never loaded
  (e.g. Urban Spaces). Bare ids like Rayscape's are unchanged.

## v1.1.12 — 2026-07-20

- `campaign.js` — `extractCid()` now extracts the first well-formed UUID from the
  inbound `cid` (or returns `null`) instead of stripping punctuation and slicing to
  48 chars. A campaign deep-link with a stray second `?` before the UTM block
  (`?cid=<uuid>?utm_source=…`) made `URLSearchParams` read `cid` as
  `<uuid>?utm_source=linkedin`; the old strip+slice folded the UTMs in and produced
  an invalid 48-char pseudo-uuid, causing ~52/day Postgres `invalid input syntax for
  type uuid` errors on the Rayscape live round. Well-formed and uppercase links are
  unchanged. Adds `test/campaign.test.js` (built-in `node:test`, run
  `node --test test/campaign.test.js`). Board 2026-07-20-191536.

## v1.1.11 — 2026-07-06

- `campaign.js`, `campaigns-v2.js` — read round totals from
  `round_investors_aggregate.aggregate` (`sum.amount_invested`, `count`), the
  shape the API actually serves; the old `round_totals` alias is kept as a
  fallback. Fixes "Raised from Growceanu" (`.campaign-amount-invested`)
  showing "-" instead of the invested amount, and restores the investor count
  and funding percent derived from it on both the campaign page and the
  opportunities listing.

## v1.1.10 — 2026-07-05

- `campaign.js`, `campaigns-updated.js`, `campaigns-v2.js` —
  `formatNumberToUnit` keeps one decimal with a comma separator
  (1,500,000 → "1,5 mil" instead of "2 mil"); round values stay clean
  ("2 mil", not "2,0 mil"). Also fixes the boundary so exactly
  1,000,000 renders "1 mil" instead of "1000 k". Affects
  `.campaign-raising-value` and `.campaign-valuation`.

## v1.1.9 — 2026-07-03

- `campaign.js` — format thousand values for Deal Term data + update url opportunities

## v1.1.8 — 2026-07-02

- `campaigns-v2.js` — coming-soon cards now hide the whole `.campaign-box-raising`
  wrapper (including the "Raising" label), not just the inner amount/percent.
  Fixes a leftover "Raising" label from v1.1.7.

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
