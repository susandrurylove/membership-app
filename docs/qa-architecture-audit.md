# Membership App Architecture and Coverage Audit

Generated from repository source. The app is a Vite React client with an Express/tRPC backend, Drizzle MySQL schema, Railway deployment, Bunny storage integration, first-party password authentication, invitation acceptance, admin/member authorization, and SSO launch support.

| Area | Count | Evidence |
|---|---:|---|
| Server TypeScript files | 32 | `server/**/*.ts` |
| Client page files | 14 | `client/src/pages/**/*.tsx` |
| Test files | 15 | `*.test.ts(x)` |
| Database tables | 17 | `drizzle/schema.ts` |
| Client routes | 9 | `client/src/App.tsx` |

## Client Routes

| Route |
|---|
| `/login` |
| `/accept-invitation` |
| `/teachings/:slug` |
| `/teachings` |
| `/courses/:slug` |
| `/courses` |
| `/apps` |
| `/admin` |
| `/` |

## Database Tables

| Symbol | Table |
|---|---|
| `users` | `users` |
| `memberSessions` | `member_sessions` |
| `memberships` | `memberships` |
| `invitationTokens` | `invitation_tokens` |
| `passwordResetTokens` | `password_reset_tokens` |
| `contentCategories` | `content_categories` |
| `mediaAssets` | `media_assets` |
| `teachings` | `teachings` |
| `teachingAssets` | `teaching_assets` |
| `courses` | `courses` |
| `courseSections` | `course_sections` |
| `courseLessons` | `course_lessons` |
| `lessonProgress` | `lesson_progress` |
| `memberActivities` | `member_activities` |
| `ssoLaunchGrants` | `sso_launch_grants` |
| `webhookDeliveries` | `webhook_deliveries` |
| `auditLogs` | `audit_logs` |

## tRPC Procedures

| Router File | Procedures |
|---|---|
| `server/routers/admin.ts` | `overview`, `list`, `create`, `updateAccess`, `refreshInvitation`, `save`, `detail`, `saveSection`, `saveLesson` |
| `server/routers/auth.ts` | `me`, `login`, `previewSignIn`, `invitation`, `acceptInvitation`, `logout` |
| `server/routers/member.ts` | `dashboard`, `categories`, `list`, `bySlug`, `updateProgress`, `url`, `launch` |

## Express Routes

| File | Routes |
|---|---|
| `server/_core/index.ts` | `GET /api/health` |
| `server/routes/adminMedia.ts` | `POST /api/admin/media/upload` |
| `server/routes/memberMedia.ts` | `GET /api/member/media/:encodedKey` |
| `server/routes/publicBrand.ts` | `GET /api/public/brand/:filename` |
| `server/routes/sso.ts` | `POST /api/sso/exchange` |

## Existing Test Inventory

| Test File | Scenarios |
|---|---|
| `client/src/accessibility-interaction.test.tsx` | `moves logically through brand, desktop navigation, sign out, and member content`<br>`opens the administrator dialog by keyboard, autofocuses its first field, and traps tab focus`<br>`reaches and opens teaching and course editors through keyboard controls`<br>`tabs through real media upload controls in a logical order`<br>`renders a focused administrator tab plus mobile-card and desktop-table member variants`<br>`renders fluid video, audio, and image media surfaces` |
| `client/src/brand-contrast.test.ts` | `${pair.label} meets the 4.5:1 normal-text threshold` |
| `client/src/responsive-brand.test.ts` | `uses only the dedicated membership Bunny WebP logo assets`<br>`uses the light ivory theme and no legacy dark shell backgrounds`<br>`provides a fixed mobile navigation and a separate desktop navigation`<br>`keeps narrow app cards and administrator dialogs within the viewport` |
| `server/admin.authorization.test.ts` | `rejects signed-out requests across management areas`<br>`rejects a fully active paying member who is not an administrator` |
| `server/auth.logout.test.ts` | `clears the first-party member session cookie` |
| `server/auth.policy.test.ts` | `normalizes email addresses consistently`<br>`hashes and verifies a password without storing the raw value`<br>`allows an active account with a current active membership`<br>`denies paused, expired, future, and cancelled memberships`<br>`allows an active administrator without a membership but denies a suspended administrator` |
| `server/auth.preview.test.ts` | `is forbidden outside the development runtime` |
| `server/authorization.allowed.test.ts` | `allows an active member through each protected member router`<br>`allows an active administrator through each management router` |
| `server/course-progress.test.ts` | `returns zero progress when a published course has no lessons`<br>`rounds partial completion to a stable whole-number percentage`<br>`reports a fully completed course at one hundred percent` |
| `server/member-media.route.test.ts` | `blocks unauthenticated requests before contacting Bunny`<br>`blocks authenticated requests without active portal access`<br>`rejects storage keys outside the protected membership namespace`<br>`forwards byte ranges and streams Bunny response metadata and bytes`<br>`rejects arbitrary Bunny object paths`<br>`streams a whitelisted WebP from Bunny with public cache protections` |
| `server/member.authorization.test.ts` | `rejects signed-out requests before any feature data is queried`<br>`rejects a signed-in member whose entitlement is paused` |
| `server/migration-config.test.ts` | `uses the committed Drizzle folder containing the journal and migrations` |
| `server/qa-fixtures.test.ts` | `provides populated teaching, course, and media states during development`<br>`never exposes the media fixture in production` |
| `server/sso.test.ts` | `does not expose client identifiers or secrets in member-visible status`<br>`keeps an integration disabled until every confidential input is present`<br>`compares destination secrets without exposing early string differences`<br>`issues a short-lived audience-bound assertion with only approved member claims` |
| `server/storage.test.ts` | `round-trips protected storage keys without exposing the path`<br>`rejects path traversal keys`<br>`fails closed when the Bunny storage key is absent` |

## Immediate Coverage Gaps

The current suite has solid unit coverage for password hashing, authorization policy, media security, storage URL handling, SSO token claims, responsive brand tokens, and accessibility interactions. The expansion should add deterministic coverage for live-login regression logic, account bootstrap/recovery safety, tRPC procedure inventory drift, database schema invariants, admin member workflows, no-public-recovery-route guarantees, visual-token parity, end-to-end browser paths, and production smoke verification.
