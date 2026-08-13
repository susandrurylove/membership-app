# Railway Live Handoff

The membership portal is now connected to Railway directly through Railway's Public API. The repository picker was bypassed because it omitted the newly created repository even though Railway's access query confirmed the public repository was reachable.

| Resource | Value |
|---|---|
| Workspace | `susandrurylove's Projects` |
| Project | `Susan Drury Membership` |
| Project ID | `703d894c-d79c-4155-8f7f-c75f44669545` |
| Environment | `production` |
| Environment ID | `41bac27b-6e8e-4175-af82-87732e8a453f` |
| Application service | `membership-app` |
| Application service ID | `0b7f3b6d-422f-4811-86a6-ec58d9b2f0e9` |
| Repository source | `susandrurylove/membership-app` |
| Branch | `main` |
| MySQL service | `MySQL` |
| MySQL service ID | `3fd5604a-7add-4cbf-926c-496785259ffb` |
| Verified release commit | `1d9db3e664ef7a406d0ce519f89373062e295a53` |
| Railway domain | `https://membership-app-production-b288.up.railway.app` |
| Health endpoint | `https://membership-app-production-b288.up.railway.app/api/health` |

The app's GitHub deployment trigger is active for `main`. MySQL deployed successfully, and the application receives its private connection through the Railway reference `${{MySQL.MYSQL_URL}}` assigned to `DATABASE_URL`. The corrected release completed its build, Drizzle pre-deploy migration, runtime startup, and Railway health check successfully.

Baseline production variables are configured for the canonical origin, sessions, invitations, password resets, and disabled-by-default external app SSO integrations. Secret values are held only in Railway and are not recorded here.

Remaining production tasks are to bind `membership.susandrury.com`, bootstrap Susan's administrator account using `pnpm admin:create`, configure private S3-compatible media storage, and provide the three destination apps' SSO launch credentials before enabling their integrations.
