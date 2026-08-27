# SusanDrury.com Visual System Observations

**Source:** [SusanDrury.com](https://susandrury.com/), inspected August 26, 2026.

The public site uses a **spiritual editorial-luxury aesthetic** rather than a generic wellness template. Its strongest identity comes from deep midnight/navy fields, luminous warm gold, warm ivory text and backgrounds, landscape photography, Susan’s portrait framed in a tall organic arch, and a restrained mandala mark. Headlines use a high-contrast serif with occasional italic emphasis; navigation and eyebrow labels use small uppercase lettering with generous tracking. Body copy remains serif-led, measured, and calm.

| Element | Observed Treatment | Membership-App Criterion |
|---|---|---|
| Primary dark field | Deep midnight/navy | Use for high-emphasis moments, not every screen |
| Accent | Luminous antique gold | Reserve for borders, highlights, primary actions, progress, and sacred-symbol details |
| Light field | Warm ivory/cream | Keep as the primary reading surface for the member portal |
| Secondary calm color | Muted teal/sea green visible in broader brand imagery | Use sparingly for success, focus, and supporting navigation accents |
| Hero imagery | Expansive nature photography with dark overlay | Use only where it supports content; avoid decorative clutter inside task-oriented admin views |
| Portrait framing | Tall rounded organic arch with fine gold edge | Adapt for optional editorial imagery, not controls |
| Headlines | Large expressive serif, sometimes italic | Preserve hierarchy while keeping portal labels and forms highly readable |
| Eyebrows/navigation | Uppercase, widely tracked, compact | Use consistently for section context and primary navigation |
| Buttons | Rounded pill geometry; gold-filled primary and dark outlined secondary | Standardize interactive states with accessible contrast and visible keyboard focus |
| Borders/dividers | Fine gold hairlines | Apply lightly to cards, grouped sections, and navigation separators |
| Motion | Gentle hero reveal and restrained carousel movement | Honor reduced-motion preferences; never block login or navigation |

The existing membership portal already uses warm ivory, navy-teal text, gold accents, serif headings, rounded cards, and the Susan Drury mandala. The next design pass should therefore **refine and systematize** the current direction rather than replace it. The priority is stronger brand-token consistency, clearer state feedback, polished empty states, responsive admin ergonomics, and visual regression coverage.

## Captured Evidence

- Public-site hero screenshot: `/home/ubuntu/screenshots/susandrury_2026-08-26_20-55-42_1390.webp`
- Membership administrator dashboard screenshot: `/home/ubuntu/screenshots/membership_susandrur_2026-08-26_20-48-24_6086.webp`
- Membership member dashboard screenshot: `/home/ubuntu/screenshots/membership_susandrur_2026-08-26_20-48-55_5742.webp`
- Membership login screenshot: `/home/ubuntu/screenshots/membership_susandrur_2026-08-26_20-48-33_8078.webp`

## Measured Public-Site Tokens

| Token or Component | Measured Value |
|---|---|
| Body font | `Lora, Georgia, "Times New Roman", serif`; 16px/24px |
| Body foreground | `oklch(0.18 0.04 265)` |
| Body surface | `oklch(0.99 0.005 85)` |
| Hero heading | Lora 70.4px/77.44px, weight 800, `rgb(245, 237, 214)` |
| Gold accent | `#C9A84C` / `rgb(201, 168, 76)` |
| Dark navy action | `rgb(30, 35, 76)` |
| Teal action | `rgb(45, 125, 125)` |
| Primary pill | Gold fill, white text, 50px radius, 12px uppercase, 1.8px tracking, 14px × 32px padding |
| Secondary pill | Translucent dark fill, 1px gold border, warm-ivory text, 50px radius |
| Tertiary pill | Transparent fill, 1px 60%-opacity gold border, gold text |

These values are **reference anchors**, not a requirement to turn every portal surface dark. The membership app should retain its calmer ivory-first task environment while using the same gold, navy, teal, Lora typography, pill geometry, tracked labels, and fine-line detailing in a consistent token system.
