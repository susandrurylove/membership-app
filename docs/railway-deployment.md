# Railway Deployment and Environment Guide

**Author:** Susan Drury Membership Project
**Target hostname:** `membership.susandrury.com`

## Deployment Model

The repository is configured for Railway’s Railpack builder. The committed `railway.json` runs the production build, executes forward database migrations in a pre-deploy container, starts the Node.js service, and checks `/api/health` before routing traffic. Railway’s current configuration format supports `buildCommand`, `preDeployCommand`, `startCommand`, `healthcheckPath`, timeout, and restart-policy fields.[1] Pre-deploy commands receive the service environment and fail the deployment when migrations fail.[2]

The server listens on Railway’s injected `PORT`. Railway uses that same port while checking the configured health endpoint and requires an HTTP `200` response before activating a new deployment.[3]

## Required Variables

| Variable | Example or Format | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables production runtime behavior |
| `APP_ORIGIN` | `https://membership.susandrury.com` | Canonical origin used for links, cookies, and SSO issuer validation |
| `DATABASE_URL` | Railway MySQL reference variable | Connects the app and migration runner to MySQL |
| `SESSION_COOKIE_NAME` | `susan_membership_session` | Names the private member session cookie |
| `SESSION_TTL_DAYS` | `30` | Sets the maximum session lifetime |
| `INVITATION_TTL_HOURS` | `72` | Sets the validity period for a member setup link |
| `PASSWORD_RESET_TTL_MINUTES` | `30` | Sets the validity period for a password-reset link |

## Member Invitations

The preliminary release generates a single-use invitation link in Susan’s administrator panel. Susan copies that link into her existing email workflow. Direct SMTP delivery and password-reset email are not enabled in this release, so no email credentials are required for deployment.

## ThriveCart Variables

The public membership page currently sends buyers to ThriveCart checkout. The preliminary release uses administrator-managed activation, pausing, cancellation, tier, and expiration controls. The following variable names are reserved for a future automatic webhook synchronization after Susan’s product identifiers and webhook policy are confirmed.

| Variable | Purpose |
|---|---|
| `THRIVECART_ACCOUNT` | Expected ThriveCart account identifier |
| `THRIVECART_WEBHOOK_SECRET` | Server-only value used to validate notifications |
| `THRIVECART_SILVER_PRODUCT_ID` | Maps the Silver checkout product to the portal tier |
| `THRIVECART_GOLD_PRODUCT_ID` | Maps the Gold checkout product to the portal tier |
| `THRIVECART_PLATINUM_PRODUCT_ID` | Maps the Platinum checkout product to the portal tier |
| `THRIVECART_FAILED_PAYMENT_GRACE_DAYS` | Optional access grace period after a failed rebill; recommended initial value `3` |

Do not register a ThriveCart webhook yet: `/api/webhooks/thrivecart` is not part of this preliminary release. Manual administration remains authoritative until the synchronization endpoint is implemented and tested against Susan’s real checkout events.

## Bunny Media Variables

Uploaded videos, audio, images, and documents live in Susan’s dedicated `membership-susan` Bunny storage zone. MySQL contains only metadata and Bunny object keys. The application keeps the storage access key server-side and serves protected member media through authenticated application routes.

| Variable | Purpose |
|---|---|
| `BUNNY_STORAGE_ACCESS_KEY` | Server-only write/read key for the `membership-susan` storage zone |
| `BUNNY_STORAGE_ZONE` | `membership-susan` |
| `BUNNY_STORAGE_ENDPOINT` | `https://ny.storage.bunnycdn.com` |

## External App SSO Variables

Each destination app has an independent enable switch, callback URL, client identity, secret, and assertion audience. Keep an app disabled until its backend can redeem one-time codes and verify signed assertions.

| App | Variables |
|---|---|
| Elevate To Love | `ELEVATE_SSO_ENABLED`, `ELEVATE_SSO_LAUNCH_URL`, `ELEVATE_SSO_CLIENT_ID`, `ELEVATE_SSO_CLIENT_SECRET`, `ELEVATE_SSO_AUDIENCE` |
| Enlightened Body | `ENLIGHTENED_BODY_SSO_ENABLED`, `ENLIGHTENED_BODY_SSO_LAUNCH_URL`, `ENLIGHTENED_BODY_SSO_CLIENT_ID`, `ENLIGHTENED_BODY_SSO_CLIENT_SECRET`, `ENLIGHTENED_BODY_SSO_AUDIENCE` |
| Tao Interactive | `TAO_SSO_ENABLED`, `TAO_SSO_LAUNCH_URL`, `TAO_SSO_CLIENT_ID`, `TAO_SSO_CLIENT_SECRET`, `TAO_SSO_AUDIENCE` |

The shared lifetimes are controlled by `SSO_CODE_TTL_SECONDS`, with an initial value of `90`, and `SSO_ASSERTION_TTL_SECONDS`, with an initial value of `300`.

## Deployment Procedure

Create a Railway project from the `susandrurylove/membership-app` GitHub repository, add a MySQL service, and expose its `DATABASE_URL` to the application service. Add the required variables in the service’s Variables panel. The committed pre-deploy command applies files under `drizzle/migrations` before the new service version starts.

After the first healthy deployment, add `membership.susandrury.com` as a custom domain in Railway and apply the DNS target Railway provides. Update `APP_ORIGIN` to the final HTTPS origin before issuing invitations or activating SSO. Confirm that `/api/health` returns `200`, then create Susan’s administrator account with the bootstrap command below.

```bash
ADMIN_EMAIL="susan@example.com" \
ADMIN_NAME="Susan Drury" \
ADMIN_PASSWORD="replace-with-a-private-password" \
pnpm admin:create
```

Run this as a Railway one-off command with `DATABASE_URL` already available. Do not commit the real email password combination to the repository. Re-running the command updates the matching administrator password and restores administrator access.

## Migration Commands

| Command | Use |
|---|---|
| `pnpm db:generate` | Generates a forward migration after a reviewed schema change |
| `pnpm db:migrate` | Applies committed migrations to the configured MySQL database |
| `pnpm admin:create` | Creates or repairs the first administrator using temporary `ADMIN_*` environment values |
| `pnpm check` | Runs TypeScript validation |
| `pnpm test` | Runs the Vitest suite |
| `pnpm build` | Builds the production client and server bundle |

## References

[1]: https://docs.railway.com/config-as-code/reference "Railway — Config as Code Reference"
[2]: https://docs.railway.com/deployments/pre-deploy-command "Railway — Add a Pre-Deploy Command"
[3]: https://docs.railway.com/deployments/healthchecks "Railway — Healthchecks"
