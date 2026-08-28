# ESCAPE — AI Travel Agent website

This version specifically addresses the visual issues from the previous review.

## What visibly changed
- New typography: Sora for headlines and Manrope for body copy.
- Strong blue/red headline hierarchy throughout the site.
- Hero: blue “Скажите, куда хотите.” + red “ESCAPE сделает остальное.”
- Images and text are aligned to equal-height blocks on desktop.
- Hero image uses a fixed visual height; feature images use consistent 470px desktop / 420px tablet / 320px mobile heights.
- Image cropping uses `object-fit: cover` and section-specific positioning.
- Vertical spacing between sections is reduced.
- Booking / Skyscanner / Maps / Weather / Airline / Rail / Ferry / EV grid is 4×2 on desktop, 2×4 on mobile.
- Continuous red dotted journey road is retained on desktop and tablet.
- Mobile typography, spacing, cards, image sizes and one-column stacking are explicitly tuned.
- CSS / JS / images use `?v=6` to reduce stale-cache issues.

## Important
All 7 images remain in the repository ROOT:
hero.jpg
airport.jpg
ev.jpg
paris.jpg
amsterdam.jpg
weekend.jpg
together.jpg

There is no assets folder.

## Deployment
Replace the old repository files with the complete contents of this package in one commit. Vercel should deploy automatically.
