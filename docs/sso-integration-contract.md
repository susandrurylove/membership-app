# External Application SSO Integration Contract

**Version:** 1.0 draft for implementation  
**Issuer:** `https://membership.susandrury.com`  
**Relying applications:** Elevate To Love, Enlightened Body, and Tao Interactive

## Contract Summary

The membership portal is the identity and entitlement authority. A destination app must not accept a member email, database identifier, or membership tier directly from the browser. Instead, the browser transports a random one-time authorization code to the destination. The destination app’s backend authenticates itself to the portal, redeems that code once, verifies the resulting short-lived assertion, and creates its own secure session.

## Browser Launch Flow

An authenticated member selects an app from the portal. The portal server confirms that the session is valid, the membership is active, and the requested app is enabled. It generates 32 cryptographically random bytes, returns the raw value only to the browser, and stores only a SHA-256 hash with the audience, member identifier, 90-second expiry, creation time, and unused state.

The browser is redirected to the app-specific callback URL with the following query parameters:

```text
https://destination.example/sso/callback?code=<one-time-code>&issuer=https%3A%2F%2Fmembership.susandrury.com
```

The code is an ephemeral credential. Destination apps must remove it from the visible URL after redemption by redirecting to a clean application route.

## Server-to-Server Exchange

The destination backend redeems the code over TLS. The browser must never call this endpoint because the request requires the destination’s confidential client secret.

```http
POST /api/sso/exchange HTTP/1.1
Host: membership.susandrury.com
Authorization: Basic base64(<client-id>:<client-secret>)
Content-Type: application/json

{
  "code": "<one-time-code>"
}
```

The portal authenticates the client using a timing-safe secret comparison. In one database transaction it locks the matching grant, verifies that the grant is unused and unexpired, verifies that its audience belongs to the authenticated client, marks it consumed, and then returns an assertion.

```json
{
  "access_token": "<signed-jwt>",
  "token_type": "Bearer",
  "expires_in": 300
}
```

The signed assertion expires after five minutes. It is not a portal session and must not be used to call the membership portal after the exchange.

## Assertion Claims

| Claim | Required | Meaning |
|---|---:|---|
| `iss` | Yes | Exact issuer URL, `https://membership.susandrury.com` |
| `aud` | Yes | The destination-specific audience configured in both systems |
| `sub` | Yes | Stable opaque portal member identifier |
| `email` | Yes | Normalized member email for destination-account matching |
| `name` | Yes | Current display name, or an empty string when unavailable |
| `membership_tier` | Yes | `silver`, `gold`, or `platinum` |
| `iat` | Yes | Issued-at Unix timestamp |
| `exp` | Yes | Expiry no more than five minutes after `iat` |
| `jti` | Yes | Unique assertion identifier for audit and optional replay protection |

The assertion intentionally excludes payment details, password data, portal cookies, administrator flags, course progress, and private content.

## Destination Verification Rules

Each destination app must verify the signature with its own configured secret, require the expected algorithm, compare `iss` and `aud` exactly, reject expired or not-yet-valid assertions, and reject missing required claims. It should then upsert a local user by a stable external subject mapping, not by accepting arbitrary browser-supplied identity data. The app creates its own `Secure`, `HttpOnly` session cookie and redirects away from the callback URL.

Failures must not reveal whether an email or member identifier exists. A destination should show a generic message with a link back to the membership portal. The portal records the client, grant identifier, member, result, timestamp, and request metadata without recording the raw code, client secret, or signed assertion.

## Error Responses

| HTTP Status | Code | Condition |
|---:|---|---|
| `400` | `invalid_request` | Missing or malformed code |
| `400` | `invalid_grant` | Unknown, expired, consumed, or audience-mismatched code |
| `401` | `invalid_client` | Missing or incorrect destination credentials |
| `403` | `member_inactive` | Membership was revoked before exchange completed |
| `429` | `rate_limited` | Client or network exceeded exchange limits |
| `503` | `integration_not_configured` | Destination is disabled or missing production configuration |

All error bodies use a stable JSON shape:

```json
{
  "error": "invalid_grant",
  "error_description": "The launch authorization could not be completed."
}
```

## App-Specific Production Inputs

The following values must be supplied by the owner of each destination app before live SSO can be activated. Until then, the portal keeps the integration disabled and displays a clear administrator-facing configuration notice.

| Application | Known Public URL | Required Callback or Launch URL | Required Audience | Required Confidential Credential | Callback Requirement |
|---|---|---|---|---|---|
| Elevate To Love | `https://elevatetolove.com` | Exact backend-owned `/sso/callback` URL | Destination-defined stable string | Unique client ID and secret | Redeem code from server, verify assertion, create local session |
| Enlightened Body | `https://enlightenedbody.love` | Exact backend-owned `/sso/callback` URL | Destination-defined stable string | Unique client ID and secret | Redeem code from server, verify assertion, create local session |
| Tao Interactive | Not yet identified publicly | Production base URL and exact `/sso/callback` URL | Destination-defined stable string | Unique client ID and secret | Redeem code from server, verify assertion, create local session |

## Railway Environment Variables

| Variable | Purpose |
|---|---|
| `APP_ORIGIN` | Canonical portal origin used as issuer and redirect origin |
| `SSO_ASSERTION_TTL_SECONDS` | Signed assertion lifetime; default `300` |
| `SSO_CODE_TTL_SECONDS` | One-time code lifetime; default `90` |
| `ELEVATE_SSO_ENABLED` | Enables Elevate To Love launch after full configuration |
| `ELEVATE_SSO_LAUNCH_URL` | Exact Elevate To Love callback URL |
| `ELEVATE_SSO_CLIENT_ID` | Portal-side identifier for the Elevate To Love backend |
| `ELEVATE_SSO_CLIENT_SECRET` | Secret shared only with the Elevate To Love backend |
| `ELEVATE_SSO_AUDIENCE` | Required Elevate To Love assertion audience |
| `ENLIGHTENED_BODY_SSO_ENABLED` | Enables Enlightened Body launch after full configuration |
| `ENLIGHTENED_BODY_SSO_LAUNCH_URL` | Exact Enlightened Body callback URL |
| `ENLIGHTENED_BODY_SSO_CLIENT_ID` | Portal-side identifier for the Enlightened Body backend |
| `ENLIGHTENED_BODY_SSO_CLIENT_SECRET` | Secret shared only with the Enlightened Body backend |
| `ENLIGHTENED_BODY_SSO_AUDIENCE` | Required Enlightened Body assertion audience |
| `TAO_SSO_ENABLED` | Enables Tao Interactive launch after full configuration |
| `TAO_SSO_LAUNCH_URL` | Tao Interactive callback URL |
| `TAO_SSO_CLIENT_ID` | Portal-side identifier for the Tao Interactive backend |
| `TAO_SSO_CLIENT_SECRET` | Secret shared only with the Tao Interactive backend |
| `TAO_SSO_AUDIENCE` | Required Tao Interactive assertion audience |

## Operational Acceptance Tests

Before enabling an app, the implementation must demonstrate that a valid active member can launch once; a second redemption of the same code fails; an expired code fails; a code for another audience fails; an inactive member cannot create a code; revocation between launch and exchange blocks the exchange; incorrect client credentials fail; and no raw code, secret, or assertion appears in application logs.

