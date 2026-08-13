# Susan Drury Membership Portal Architecture

**Author:** Susan Drury Membership Project
**Status:** Implementation baseline  
**Primary production target:** Railway with MySQL  
**Public hostname:** `membership.susandrury.com`

## Purpose and Product Boundary

The portal is a private digital sanctuary for Susan Drury’s paying clients. It owns member identity, entitlement checks, Susan’s teachings library, courses, lesson progress, recent activity, administration, and secure launch authorization for Elevate To Love, Enlightened Body, and Tao Interactive. The public SusanDrury.com site remains the marketing and purchase destination; the membership portal becomes the authenticated delivery surface.

The current public membership offers Silver, Gold, and Platinum levels and explicitly includes weekly calls, course access, app access, and member benefits.[1] The portal therefore models access as a lifecycle and tier, not as a single permanent user flag.

## System Context

| Boundary | Responsibility | Trust Level |
|---|---|---|
| React client | Presents the member and administrator interfaces; never decides authorization by itself | Untrusted client |
| Express and tRPC server | Authenticates sessions, enforces entitlements, validates mutations, issues app launch grants, and records activity | Trusted application |
| MySQL | Stores identities, password hashes, sessions, memberships, content metadata, course structure, progress, app grants, and audit events | Trusted data store |
| Bunny storage and CDN | Stores uploaded video, audio, image, and document bytes in Susan’s dedicated `membership-susan` zone; MySQL stores only keys and metadata | Trusted media store |
| ThriveCart | Reports purchase and subscription lifecycle events to the portal | Authenticated external source |
| Three Susan Drury apps | Redeem one-time launch grants and establish their own local sessions | Authenticated relying parties |

## Architecture Choices

The implementation keeps interfaces modular so that Susan can begin with a lighter operational model and add automation without replacing the portal.

| Approach | Tradeoffs | Cost | Setup Complexity |
|---|---|---:|---:|
| Administrator-managed membership access | Fastest launch and no checkout integration dependency, but Susan must activate, pause, and cancel members manually | No additional service cost | Low |
| ThriveCart webhook synchronization with administrator override | Automatically reflects successful purchases, pauses, renewals, refunds, and cancellations; requires ThriveCart secret and product identifiers | No additional runtime service beyond Railway | Medium |
| Full shared identity provider across all four products | Most standardized long-term SSO and centralized identity lifecycle; requires each existing app to adopt the same identity provider and may add a monthly vendor cost | Vendor-dependent | High |

The codebase will support both manual membership control and authenticated ThriveCart synchronization. Manual override remains available for support and exceptional cases. ThriveCart documents real-time HTTP POST notifications for orders, refunds, renewals, pauses, resumptions, failures, and cancellations, with a shared secret field for origin verification.[2] Its targeted event-subscription API also supplies a stable delivery identifier intended for idempotent processing.[3]

## Authentication and Paid-Member Authorization

The Railway release uses a first-party, invitation-based email and password flow so Susan’s clients do not need an account with an unrelated platform. An administrator creates a member and generates a single-use invitation. The member uses the invitation to choose a password, after which the server stores only a salted `scrypt` password hash.

Authenticated browser sessions use high-entropy opaque tokens. Only a SHA-256 hash of each token is stored in MySQL. The browser receives the original token in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie. This design supports immediate logout, administrative revocation, expiration, and per-device session control without placing identity data in a readable browser token.

Every protected server procedure applies two checks. First, a valid unexpired session must resolve to a user. Second, the user must either be an administrator or have an active membership whose start and optional expiry dates permit access. Client-side route guards improve the experience but are not security boundaries. A suspended, cancelled, expired, or pending member cannot read content APIs, request media URLs, update course progress, read activity, or create app launch grants.

| Membership State | Login Allowed | Protected Content | External App Launch | Administrative Recovery |
|---|---:|---:|---:|---:|
| `pending` | Yes | No | No | Activate or resend invitation |
| `active` | Yes | Yes | Yes | Change tier or expiry |
| `paused` | Yes | No | No | Resume access |
| `cancelled` | Yes | No | No | Reactivate after payment review |
| `expired` | Yes | No | No | Extend expiry or reactivate |

## ThriveCart Synchronization

The portal exposes an endpoint that accepts both `HEAD` and form-encoded `POST` requests because ThriveCart requires successful 2xx responses for endpoint verification and delivery.[2] The handler rejects requests with an invalid account name or secret, records each stable webhook identifier before processing, and treats duplicate deliveries as successful no-ops.

Successful orders and subscription payments activate or refresh the member associated with the normalized customer email. Pause and failed-rebill events can place access into `paused` according to the configured grace policy. Cancellation or refund events revoke protected access while retaining the account and learning history. Product identifiers map to Silver, Gold, or Platinum through environment configuration so no payment identifiers are hard-coded in source control.

## Secure SSO Handoff Contract

The public site currently links Elevate To Love at `https://elevatetolove.com` and Enlightened Body at `https://enlightenedbody.love`.[4] [5] Tao Interactive’s destination and verification endpoint remain configuration inputs.

The default handoff uses a **one-time authorization code exchange**, which keeps reusable secrets and member claims out of browser URLs. The browser receives only a random code with a lifetime of approximately 90 seconds.

| Step | Portal | Browser | Destination App |
|---:|---|---|---|
| 1 | Verifies the current session and active membership | Requests launch for one named app | — |
| 2 | Creates a random code, stores only its hash, audience, member, expiry, and unused state | Receives the destination launch URL | — |
| 3 | — | Navigates to the app with the one-time code | Receives the code |
| 4 | Authenticates the app server and atomically consumes the code | — | Sends the code from its backend to the exchange endpoint |
| 5 | Returns a short-lived signed identity assertion containing the permitted claims | — | Verifies the assertion and creates its own secure session |

The assertion contains only `sub`, normalized email, display name, membership tier, issuer, audience, issued-at time, expiry, and unique identifier. It does not contain passwords, payment details, administrator data, or a reusable portal session. Each destination receives a distinct client identifier and secret. Codes are audience-bound, expire quickly, and can be consumed once. Exchange attempts are written to the audit log.

| SSO Method | Tradeoffs | Cost | Setup Complexity |
|---|---|---:|---:|
| One-time code plus server exchange | Strong replay resistance and minimal browser exposure; requires a small backend callback in each app | No additional service | Medium |
| Direct short-lived signed token handoff | Lighter integration but tokens may appear in navigation history or logs and cannot be reliably made single-use without shared state | No additional service | Low |
| Shared OpenID Connect provider | Strong standardization and future ecosystem support; requires identity migration in all products | Vendor-dependent | High |

The portal will implement the one-time exchange contract and a safe “integration not configured” state. Each app still requires a compatible callback, client credentials, and production launch URL before live SSO can be completed.

## Content, Course, and Media Rules

Teachings support `video`, `audio`, `image`, `text`, and `mixed` presentation types. Content records contain titles, slugs, descriptions, body text, publishing state, category, ordering, and optional media references. Course records contain ordered modules or lessons, and progress records are unique per member and lesson. Completion is server-authoritative and produces an activity record.

Uploaded bytes never enter MySQL. Production media is written directly to Susan’s dedicated `membership-susan` Bunny storage zone. Public brand artwork is stored there as WebP and delivered through a cacheable, whitelisted `/api/public/brand/*` route; protected teaching and course media is delivered only through the application’s authenticated member-media route. Both routes read the object from Bunny with the server-only storage key, while the protected route also supports byte-range responses for audio and video playback. The database keeps the Bunny object key, MIME type, original filename, byte size, duration when known, and accessibility metadata.

## Administrator Security

Administrator procedures require both a valid session and the `admin` role. Sensitive changes write an audit event containing the actor, action, target type, target identifier, timestamp, and non-secret summary. Member password hashes, session hashes, SSO codes, client secrets, and ThriveCart secrets are never returned to the client.

Destructive operations are avoided in the first release. Teachings, courses, and lessons use draft, published, or archived states. Member access uses lifecycle transitions. This preserves history and reduces accidental data loss.

## Railway Deployment Contract

Railway runs one Node.js web process and supplies MySQL through `DATABASE_URL`. The repository includes a production build, a production start command that reads `PORT`, a health endpoint, generated SQL migrations, and a separate migration command. Static configuration is committed; credentials are provided only through Railway variables.

The custom domain is configured after the first successful Railway deployment. DNS for `membership.susandrury.com` should point to the Railway-provided target, and the application origin variable must then be updated to the final HTTPS URL before invitations or external app callbacks are enabled.

## References

[1]: https://susandrury.com/membership "Susan Drury — Elevate to Love Community"
[2]: https://support.thrivecart.com/help/using-webhook-notifications/ "ThriveCart — Using Webhook Notifications"
[3]: https://developers.thrivecart.com/documentation/event_subscription/intro/ "ThriveCart Developers — Event Subscriptions"
[4]: https://susandrury.com/mobile-app "Susan Drury — Elevate to Love App"
[5]: https://susandrury.com/enlightened-body-app "Susan Drury — The Enlightened Body"
