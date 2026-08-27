# QA Protocol Runtime Guide

The generated protocol contains **2,000 unique checks across 25 domains**. Each domain contributes 80 checks from four controls, four contexts, and five operating conditions. Stable QA IDs are used for traceability.

| Artifact | Purpose |
|---|---|
| `qa-protocol.json` | Machine-readable source for validation, dashboards, filtering, and evidence mapping |
| `qa-protocol.csv` | Spreadsheet-compatible execution and review artifact |
| `../../docs/qa-protocol-2000.md` | Human-readable full protocol |
| `../../scripts/generate-qa-protocol.mjs` | Deterministic generator |
| `../../scripts/verify-qa-protocol.mjs` | Structural, weighting, uniqueness, and secret-hygiene validator |

Run `pnpm qa:protocol:check` to regenerate and verify the protocol. Run `pnpm qa` to execute type checks, the automated test suite, and protocol verification together.

The release gate is strict: **all P0 checks and every release-blocking P1 check must pass before production promotion**. Automated tests should include the relevant stable QA ID in their test title or adjacent comment. Evidence may be an assertion result, API response, database assertion, screenshot, performance record, or documented manual observation.
