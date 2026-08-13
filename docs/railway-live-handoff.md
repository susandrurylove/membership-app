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
| Verified application release commit | `7200366e1715e9a4e6ceb6997432b8b299a38146` |
| Railway domain | `https://membership-app-production-b288.up.railway.app` |
| Health endpoint | `https://membership-app-production-b288.up.railway.app/api/health` |

The app's GitHub deployment trigger is active for `main`. MySQL deployed successfully, and the application receives its private connection through the Railway reference `${{MySQL.MYSQL_URL}}` assigned to `DATABASE_URL`. The independent, mobile-responsive release completed its build, Drizzle pre-deploy migration, full 17-table schema verification, runtime startup, and database-aware Railway health check successfully. `/api/health`, `/login`, `/`, `/teachings`, `/courses`, `/apps`, and `/admin` all returned HTTP 200 on `membership.susandrury.com`.

Baseline production variables are configured for the canonical origin, sessions, invitations, password resets, and disabled-by-default external app SSO integrations. `APP_ORIGIN` is set to `https://membership.susandrury.com`. Secret values are held only in Railway and are not recorded here.

## Custom Domain DNS Handoff

Railway custom domain `membership.susandrury.com` is attached to the production `membership-app` service. Railway domain ID is `7491477b-0642-4473-86bf-4cc4a3e3a941`. The authoritative nameservers are Porkbun nameservers, so add the following record in the Porkbun DNS controls for `susandrury.com`:

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `membership` | `4tv3nb1q.up.railway.app` | DNS only while Railway verifies and issues TLS |

The Porkbun CNAME propagated successfully. Railway verified ownership and issued a valid certificate for `membership.susandrury.com`.

Remaining operational tasks are to bootstrap Susan's administrator account using `pnpm admin:create` and provide the three destination apps' SSO launch credentials before enabling their integrations. Media storage uses Susan’s dedicated `membership-susan` Bunny zone.
