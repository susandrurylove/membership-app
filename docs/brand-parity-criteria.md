# Susan Drury Membership Brand-Parity Criteria

**Author:** Manus AI

The membership portal should feel unmistakably connected to SusanDrury.com while remaining a calm, high-clarity product interface. The public site establishes a spiritual editorial-luxury language through **Lora typography, midnight navy, antique gold, warm ivory, selective teal, tracked uppercase labels, fine gold lines, rounded pills, nature imagery, and the mandala identity**.[1]

| Criterion | Required Outcome | Test Method |
|---|---|---|
| Typography | Lora remains the principal editorial and interface typeface; headings preserve expressive serif hierarchy without compromising form clarity | Static token assertion and computed-style browser check |
| Core palette | Gold `#C9A84C`, dark navy near `#1E234C`, warm ivory near `#FDFAF5`, and teal near `#2D7D7D` are defined as named tokens rather than scattered literals | Source scan and token-usage test |
| Reading surfaces | Member and administrator work surfaces remain ivory-first with dark readable text | Contrast test and screenshot review |
| High-emphasis surfaces | Navy is reserved for hero, selected navigation, or ceremonial moments rather than every container | Visual snapshot and component inventory |
| Primary actions | Primary actions use a gold or teal pill with visible hover, active, disabled, loading, and keyboard-focus states | Interaction test and contrast test |
| Secondary actions | Secondary actions use dark or transparent surfaces with fine gold borders and warm-ivory or dark text as context requires | Component snapshot and contrast test |
| Eyebrow labels | Section labels use uppercase text, compact size, and generous tracking consistently | DOM/style assertion |
| Borders | Gold hairlines are restrained, consistent, and never the sole carrier of state | Source/style scan and accessibility review |
| Mandala | Only the dedicated Susan Drury membership brand assets are used; the mark retains aspect ratio and descriptive alternative text | Asset allowlist test and accessibility test |
| Imagery | Nature or Susan imagery appears only where it improves orientation or emotional context, not inside dense administrative workflows | Manual visual protocol and page inventory |
| Motion | Animation is gentle, non-blocking, and disabled or reduced under `prefers-reduced-motion` | Browser emulation test |
| Responsive behavior | Navigation, cards, dialogs, tables, media, and forms remain usable at narrow mobile, large mobile, tablet, laptop, and wide desktop widths | Multi-viewport browser suite |
| Accessibility | Focus remains visible; controls have names; contrast meets the project’s existing normal-text threshold; keyboard use is complete | Automated and manual accessibility protocol |
| State clarity | Empty, loading, success, warning, error, disabled, and destructive states are visually distinct and written in calm, direct language | State-matrix tests and screenshots |

> **Design rule:** Brand affinity is achieved through disciplined tokens, hierarchy, rhythm, and interaction quality—not by decorating every surface or copying unrelated public-site layouts.

## References

[1]: https://susandrury.com/ "Susan Drury — Elevate to Love"
