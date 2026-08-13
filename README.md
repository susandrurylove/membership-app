# Susan Drury Membership Portal

This repository contains the private membership portal for Susan Drury’s clients. It unifies Susan’s teachings, structured courses, member progress, and secure handoffs to Elevate To Love, Enlightened Body, and Tao Interactive in one authenticated experience.

The portal is designed for `membership.susandrury.com` and deployed on Railway with Railway MySQL and Susan’s dedicated Bunny storage/CDN.

## Product Capabilities

| Area | Included in the Preliminary Release |
|---|---|
| Authentication | Invitation-based email/password setup, revocable server sessions, login, logout, and inactive-member states |
| Membership | Silver, Gold, Platinum, and custom tiers; pending, active, paused, cancelled, and expired lifecycle states; optional end date |
| Teachings | Categories plus video, audio, image, text, and mixed-media presentation |
| Courses | Ordered sections and lessons, lesson status, member progress, completion state, and recent activity |
| Connected apps | One-time launch codes and server-to-server exchange for all three apps; disabled safely until each destination is configured |
| Administration | Member invitations and access, categories, teachings, media uploads, courses, sections, and lessons |
| Deployment | Railway config, MySQL migrations, health check, production build, Bunny media adapter, and custom-domain guide |

No customer records, teachings, courses, ratings, reviews, or testimonials are seeded. Susan creates real member and content records through the administrator interface.

## Stack

The application uses React 19, Tailwind CSS 4, Wouter, tRPC 11, Express 4, Drizzle ORM, Railway MySQL, Vitest, and Bunny’s Storage HTTP API. Authentication sessions are opaque random credentials whose SHA-256 hashes are stored in MySQL. Passwords use salted `scrypt` hashing.

## Repository Structure

| Path | Responsibility |
|---|---|
| `client/src/pages` | Member, authentication, and administrator interfaces |
| `client/src/components` | Shared navigation, media, error, and presentation components |
| `server/routers` | Typed public, member, and administrator procedures |
| `server/auth.ts` | Password, session, cookie, and membership access policy |
| `server/sso.ts` | One-time app grants and signed destination assertions |
| `server/adminData.ts` | Administrator data operations and audit writes |
| `server/memberData.ts` | Member dashboard, teaching, course, progress, and activity queries |
| `drizzle/schema.ts` | MySQL domain schema |
| `drizzle/migrations` | Forward production migrations |
| `docs` | Architecture, brand audit, SSO contract, and Railway handoff |

## Local Development

Install dependencies and start the development process:

```bash
pnpm install
pnpm dev
```

The application requires a MySQL `DATABASE_URL` and Bunny storage variables. Configure the Railway and Bunny variables described in [`docs/railway-deployment.md`](docs/railway-deployment.md).

## Quality Commands

| Command | Purpose |
|---|---|
| `pnpm check` | TypeScript validation |
| `pnpm test` | Vitest security and domain tests |
| `pnpm build` | Production client and server build |
| `pnpm drizzle-kit check` | Migration metadata validation |
| `pnpm db:generate` | Generate a reviewed forward migration after a schema change |
| `pnpm db:migrate` | Apply committed migrations to the configured database |

## First Administrator

After applying migrations to the Railway MySQL database, run the one-time administrator bootstrap with temporary environment values:

```bash
ADMIN_EMAIL="susan@example.com" \
ADMIN_NAME="Susan Drury" \
ADMIN_PASSWORD="replace-with-a-private-password" \
pnpm admin:create
```

The password must have at least 12 characters with uppercase, lowercase, and a number. Do not commit real values. The command is idempotent for the matching email and can repair administrator access if rerun deliberately.

## External App SSO

The portal issues a random one-time code with a short expiry. A destination app receives that code in its callback URL, authenticates its backend to `/api/sso/exchange`, consumes the code atomically, verifies the returned five-minute HS256 assertion, and creates its own local session. The browser never receives a destination client secret or reusable portal session.

Each app remains disabled until its callback URL, client identifier, client secret, and expected audience are configured. See [`docs/sso-integration-contract.md`](docs/sso-integration-contract.md) for the complete contract and acceptance tests.

## Preliminary Release Boundaries

The administrator panel generates copyable invitation links; direct email delivery and password-reset email are not included yet. Member access is managed manually; ThriveCart webhook synchronization is documented as a future extension but no live webhook route is advertised or enabled. The three app launch services are implemented, but production activation requires compatible callbacks and confidential credentials from the existing app backends.

## Deployment

The committed [`railway.json`](railway.json) builds the app, runs forward migrations as a pre-deploy step, starts the Node server using Railway’s `PORT`, and checks `/api/health`. Follow [`docs/railway-deployment.md`](docs/railway-deployment.md) for Railway MySQL, Bunny storage, custom domain, administrator bootstrap, and SSO variables.

## Security Notes

Every teaching, course, progress, activity, media, and app-launch procedure requires an active membership or administrator role on the server. Administrator mutations require the administrator role independently of client navigation. Uploaded bytes are stored in object storage, never in MySQL. Draft and archived records preserve history rather than relying on destructive deletion.
