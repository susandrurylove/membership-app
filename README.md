# Elevate to Love — Susan Drury Membership App

A membership community for people who meet weekly with Susan Drury online — toward
healing, embodying awareness and presence, and coming to know the body from a
spiritual perspective. The design follows the SusanDrury.com sensibility: lovely,
divine, and grounded (warm cream ground, gold accents, serif voice, spacious layout).

## Features

1. **Daily Tao Te Ching** — a verse that rotates by day-of-year, each with a meditation suggestion (`#tao`).
2. **Elevate Your Life to Love** — teachings (neuroplasticity, the Default Mode Network, meeting your parents anew) each with an assignment (`#life`).
3. **Elevate Your Body to Love** — teachings across the body-as-messenger systems, each with a practice (`#body`).
4. **After the Retreat** — integration teachings & assignments for retreat-goers (`#retreat`).
5. **Body Cards Facilitator Certification** — a paid 4-month program with specific facilitator teachings and a **downloadable, print-to-PDF manual** covering all 21 systems (`#facilitator` → `facilitator-manual.html`).
6. **20-Class Lesson Plan** — a swipeable reference guide, six teachings per class, for certified facilitators to present with ease (`#lessons`).
7. **About Susan** (`#about`) and a **spiritually-grounded FAQ** (`#faq`).

## Tech

Zero-dependency static site — HTML, one CSS design system, and a small vanilla-JS
hash router. No build step, hosts anywhere (GitHub Pages, Netlify, Vercel, S3).

- `index.html` — app shell + nav + footer
- `assets/style.css` — the full design system
- `assets/content.js` — all teachings, assignments, Tao verses, lesson plans, FAQ (in Susan's voice)
- `assets/app.js` — client router and views
- `facilitator-manual.html` — standalone printable facilitator manual

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## What's still needed for production (see notes below)

This ships as a complete, content-rich front end. To make it a live paid membership,
wire in: member **authentication**, **Stripe** (or similar) for the monthly fee and the
$1,200 / 4×$325 certification, a **members-only gate** on premium content, a
**video/meeting link** surface for the weekly calls (Zoom), and a light **CMS** so Susan
can post new daily reflections and teachings herself.

---
© 2026 Susan Drury. Together, we rise. · With infinite love and support on your journey.
