# Susan Drury Membership Portal — Initial Brand and Product Audit

## Public Brand Observations

The current [SusanDrury.com](https://susandrury.com) experience uses an elegant spiritual editorial style rather than a conventional software-dashboard aesthetic. The dominant visual language combines deep midnight navy backgrounds, warm ivory surfaces, luminous gold accents, fine divider lines, subtle celestial symbols, and large high-contrast serif headlines. Photography is presented in softly rounded arches and circles, reinforcing the sanctuary-like tone.

The homepage hero pairs a dark navy field with cream serif typography and a saturated gold focal shape. Buttons use pill-like proportions, uppercase letter spacing, and gold or outlined treatments. Supporting body copy is restrained and readable, while small eyebrow labels use uppercase tracking and star or diamond ornaments. The membership portal should preserve these recognizable cues while increasing interface clarity for repeat daily use.

Live computed styles confirm **Lora** as the primary typeface for both display and body copy, with Georgia and Times New Roman fallbacks. The public theme uses an ivory page background of `oklch(0.99 0.005 85)`, a dark blue foreground of `oklch(0.18 0.04 265)`, a primary navy of `oklch(0.28 0.08 265)`, and a warm gold accent of `oklch(0.75 0.08 75)`. The main gold call-to-action resolves to approximately `rgb(201, 168, 76)`, while hero cream text resolves to approximately `rgb(245, 237, 214)`.

Public call-to-action buttons use a `50px` pill radius, `12px` uppercase labels, `600–700` weight, and approximately `1.8px` tracking. The portal will retain this brand signature for major actions while using more compact accessible controls for frequent administrative operations. The portal shell will combine navy navigation, ivory content canvases, teal feature panels inspired by the membership hero, restrained gold focus states, and subtle mandala or diamond ornaments. It will avoid a generic corporate dashboard appearance.

## Public Product Findings

The public membership is presented as the **Elevate to Love Community** with Silver, Gold, and Platinum tiers. Public benefits include weekly live calls, course access, premium app access, and member savings. The portal therefore needs a membership tier and lifecycle model rather than a single boolean permission flag.

The existing Elevate To Love web app is publicly linked at `https://elevatetolove.com`. The Enlightened Body web app is publicly linked at `https://enlightenedbody.love`. No public Tao Interactive application endpoint was visible in the main site navigation during this initial audit; its launch URL and token-verification contract remain required integration inputs.

The current public courses destination linked from the homepage returned a branded not-found page during the audit. Course data should therefore be treated as portal-managed content rather than scraped or coupled to the present marketing-site route.

## Integration Security Direction

The portal should never append a long-lived credential to an external app URL. Each launch should request a one-time or very short-lived signed token from the portal server, scoped to the destination app and current active member. The destination app must verify the signature, audience, issuer, expiry, and unique token identifier before creating its own session. The final token claims and exchange endpoint will be implemented against each app’s actual API contract.

Until those contracts and signing secrets are available, all three integrations will be represented by production-shaped launch services and configuration variables, with safe unavailable states instead of insecure placeholder authentication.

## Content and Data Direction

Teachings need a polymorphic presentation layer supporting video, audio, image, text, and mixed media while storing only metadata and object-storage references in MySQL. Courses require ordered lessons, enrollment or entitlement checks, per-member progress, completion timestamps, and recent-activity records. Susan’s administrator role must control member access, publishing state, ordering, and media metadata without requiring code changes.

## Sources Reviewed

- [Susan Drury homepage](https://susandrury.com)
- [Elevate to Love Community membership](https://susandrury.com/membership)
- [Elevate to Love app overview](https://susandrury.com/mobile-app)
- [The Enlightened Body app overview](https://susandrury.com/enlightened-body-app)
