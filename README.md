# ESCAPE! — AI Travel Agent

Marketing and product site for **ESCAPE!**, a personal AI travel agent.
Static site, no build step: upload the repository root as-is.

## Structure

```
index.html               single-page product story (20 sections)
privacy.html             ┐
terms.html               │
cookies.html             ├ legal pages (shared renderer, content in assets/legal-docs.js)
disclaimer.html          │
community.html           ┘
404.html                 localised not-found page
assets/
  styles.css             design system + all page styles
  app.js                 i18n engine, scroll storytelling, modals, cookie consent
  i18n.js                RU / UA / EN dictionary for index.html
  legal.css              legal page styles
  legal.js               legal page renderer + chrome strings
  legal-docs.js          5 legal documents × 3 languages
  fonts.css              @font-face declarations
  fonts/                 self-hosted woff2 (Manrope, Onest, Great Vibes)
img/                     WebP imagery, responsive pairs (-sm 1200w / -lg 2200w)
favicon.svg  robots.txt  sitemap.xml  vercel.json
```

## Languages

Russian, Ukrainian and English. Everything is translated: navigation, copy,
phone UI, forms, validation, cookie banner, legal documents, SEO metadata and
accessibility labels.

Selection order: `?lang=` query parameter → `localStorage` → browser language →
Russian fallback. The choice persists across pages.

## Brand

The wordmark is Great Vibes set in ESCAPE red, given a hairline stroke for body;
the exclamation mark is a custom location-pin SVG (`#brand-pin`), tilted 13° to
the right so it sits on the script's own slant, and aligned to its baseline.
It is defined once as an SVG symbol and referenced everywhere — never redrawn.

## Design system

Tokens live at the top of `assets/styles.css`: navy/warm-white/sky palette with
red used only as an accent, a clamp-based type scale, an 8px spacing rhythm and
one device component with three sizes (hero 100%, feature 85–95%, secondary
70–80%).

## Data and privacy

No analytics, no advertising scripts, no third-party embeds, no external font
CDN. The site stores only the language choice, the cookie decision and — while
server-side intake does not exist — waitlist entries, all in the visitor's own
browser. Consent is granular and refusing is as easy as accepting.

## Content rules observed

No fake App Store links, partnerships, integrations, reviews, user counts or
live booking data. Market statistics are attributed to UN Tourism (World
Tourism Barometer, January 2025) and WTTC (Economic Impact Research 2025).

## Local preview

```
python3 -m http.server 8080
```

Root-relative paths are used throughout, so serve from the repository root.

## Operator

DMYTRO SUKHYNA · Greece (EU) · escape.travel.ai@gmail.com · support 10:00–19:00 UTC+3
