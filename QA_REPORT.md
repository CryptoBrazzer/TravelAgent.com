# ESCAPE! — QA report

Site: www.escapetravel.site · Verified with headless Chromium (Playwright) against a
local static server serving the repository root.

## Pass 1 — Visual

Captured and reviewed viewport slices of every section at **320, 360, 375, 390, 430,
768, 1024, 1280, 1440, 1728 and 1920 px**, in Russian, Ukrainian and English.

| Check | Result |
|---|---|
| Horizontal overflow at every breakpoint | none (scrollWidth == viewport at all 11 widths) |
| Legal pages at 360 px | no overflow on any of the five |
| Escape! wordmark | 6 instances, all identical, all red |
| Location-pin symbol | one `<symbol>` definition, referenced 6×, aspect ratio identical (0.478–0.479), never distorted, tilted 9° right |
| Phone device scale | hero 326 px (100%), feature 274 px (84%), secondary 238 px (73%) — within the defined bands |
| Phone screens filled | dead space below the last row reduced to 9–30 px on all four devices |
| Imagery | 18 photographs, WebP, responsive `srcset` (1200w / 2200w), no upscaling, no baked-in text |
| Section rhythm | alternating light / surface / sky / dark bands; no two adjacent sections use the same layout format |

Fixed during this pass: lead-paragraph centring bug, toast peeking above the fold,
hero floating cards covering phone UI, nested-pill rendering in the tag row, Paris
device clipped by its figure, phone text invisible on dark sections, EV route nodes
colliding on small screens, low-contrast CTA button over photography, flywheel labels
overflowing their circles, mobile split composition hidden behind the device.

## Pass 2 — Functional

**56 checks, 56 passed, 0 console errors, 0 failed network requests.**

- Cookie consent: banner appears, all three actions work, necessary category locked on,
  granular preferences persist and are reflected on reopen, reject stores all-false,
  reopen from the footer works.
- Waitlist: opens from every trigger, blocks empty name, blocks malformed email, records
  platform choice, shows the success state, persists the entry, closes on Escape.
- Language: RU/UA/EN switch instantly, set `<html lang>`, persist to `localStorage`.
- Scroll demos: AI pipeline, live timeline, delay replan, EV route, globe pins (10/10),
  flywheel — all fire and complete.
- Interactive: Amsterdam rain toggle rebuilds and reverts the chain; world-intent chips
  swap the answer; statistics counters reach 1,4 / 1,6 / 11,6 / 366.
- Integrity: every internal anchor resolves, every SVG symbol reference resolves, no
  broken images, every image has `alt`.
- Mobile: drawer opens, sets `aria-expanded`, closes on navigation.
- All 15 legal documents render (RU/UA/EN × 5), 779–2199 words each.
- 404 page localises.

## Pass 3 — Content and localisation

Audited by diffing every rendered text node against the Russian dictionary values.

| Check | Result |
|---|---|
| Dictionary keys per language | 493 / 493 / 493 |
| Missing keys | none in any language |
| Empty translations | none |
| Untranslated text nodes in UA | none |
| Untranslated text nodes in EN | none |
| Untranslated `alt` / `placeholder` / `aria-label` | none |
| Placeholder text (lorem/TODO/TBD) | none |
| Cyrillic left in EN mode | none |
| Russian orthography markers in UA legal documents | none |
| Legal section parity | 71 sections per language (17/20/9/12/13) |

## Accessibility

- One `<h1>`, no heading-level jumps, three navigation landmarks, `header`/`main`/`footer`.
- Skip link is the first tab stop; keyboard reaches navigation, language switch and CTA.
- Visible focus ring on all interactive elements; every control has an accessible name.
- Form fields labelled; dialogs use `aria-modal` + `aria-labelledby` with a focus trap.
- Two `aria-live` regions (toast, world answer).
- `prefers-reduced-motion`: reveals render at full opacity, hero parallax disabled,
  scroll-driven sequences jump to their end state.

## Performance

| | Size | Gzipped |
|---|---|---|
| Critical path (HTML + CSS + JS + hero image) | 532 KB | **324 KB** |
| — of which the hero photograph | 254 KB | 254 KB |
| Legal document bundle (legal pages only) | 240 KB | 65 KB |
| All imagery | 7.7 MB | lazy-loaded below the fold |

Fonts are self-hosted woff2, Latin + Cyrillic subsets only, `font-display: swap`,
two files preloaded. No third-party requests of any kind at runtime.

## Content integrity

- No fake App Store or Google Play links — iOS and Android are marked "soon".
- No fabricated partnerships, integrations, reviews, ratings, user counts or live
  booking data.
- Market statistics attributed on-page: UN Tourism, World Tourism Barometer, January
  2025 (1.4 bn arrivals; US$1.6 tn receipts) and WTTC Economic Impact Research 2025
  (US$11.6 tn GDP contribution, 9.8%; 366 m jobs).
- No company registration or VAT number invented; no residential address or personal
  telephone number published.
