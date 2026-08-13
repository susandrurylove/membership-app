# Production Independence Verification

The production membership portal uses Railway for the Node application and MySQL database, first-party sessions for authentication, and Susan’s dedicated `membership-susan` Bunny storage zone for logo and member-media objects.

| Check | Result |
|---|---|
| Tracked-source scan | Zero former-runtime, alternate-database, obsolete storage, OAuth, analytics, or API markers |
| Dependency and lockfile scan | Zero former-runtime or alternate-database packages and markers after a clean install |
| Built-output scan | Zero former-runtime, alternate-database, obsolete storage, OAuth, analytics, or API markers |
| Automated tests | 49 passing tests across authorization, SSO, storage, media routes, responsive design, keyboard interaction, and contrast |
| Static validation | TypeScript and Drizzle migration metadata checks passed |
| Production build | Vite client and bundled Express server completed successfully |
| Railway deployment | Deployment `3128fac3-f49f-4de5-a680-1f88d1962fe9` succeeded for application commit `7200366e1715e9a4e6ceb6997432b8b299a38146` |
| MySQL | Railway MySQL is the sole authoritative database. Deployment applied migration 0002, completed the 17-table schema verifier with no missing tables, asserted `media_assets.storageProvider` defaults to `bunny`, started the app, and `/api/health` reported `database: connected` |
| Bunny storage | Real upload, authenticated range read, and delete passed against `membership-susan`; protected media remains behind member authorization |
| Official logo | Four deterministic WebPs are stored in Bunny only; live 48px and 320px responses matched the prepared hashes exactly |
| Access controls | Signed-out member-media and administrator-upload requests both returned HTTP 403 |
| Custom domain | `membership.susandrury.com` returned valid TLS and HTTP 200 for login, dashboard, teachings, courses, apps, and administration routes |
| Git delivery | `susandrurylove/membership-app` on `main` is connected with auto-deploy enabled |
| Stability passes | Three consecutive complete production checks passed against the same successful deployment; the custom-domain list contained exactly `membership.susandrury.com` and zero generated service domains |

No customer records or secret values were read or written during verification. Credential checks used only variable presence and non-secret configuration values. No supplied logo image is committed to the repository.
