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
| Verified release commit | `2b0481b3e9b03622a9be86a58085e2b35bdca551` |
| Railway domain | `https://membership-app-production-b288.up.railway.app` |
| Health endpoint | `https://membership-app-production-b288.up.railway.app/api/health` |

The app's GitHub deployment trigger is active for `main`. MySQL deployed successfully, and the application receives its private connection through the Railway reference `${{MySQL.MYSQL_URL}}` assigned to `DATABASE_URL`. The light, mobile-responsive release completed its build, Drizzle pre-deploy migration, runtime startup, and Railway health check successfully. `/api/health`, `/login`, `/`, `/teachings`, `/courses`, `/apps`, and `/admin` all returned HTTP 200 on the generated Railway domain.

Baseline production variables are configured for the canonical origin, sessions, invitations, password resets, and disabled-by-default external app SSO integrations. `APP_ORIGIN` is set to `https://membership.susandrury.com`. Secret values are held only in Railway and are not recorded here.

## Custom Domain DNS Handoff

Railway custom domain `membership.susandrury.com` is attached to the production `membership-app` service. Railway domain ID is `7491477b-0642-4473-86bf-4cc4a3e3a941`. The authoritative nameservers are Porkbun nameservers, so add the following record in the Porkbun DNS controls for `susandrury.com`:

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `membership` | `4tv3nb1q.up.railway.app` | DNS only while Railway verifies and issues TLS |

The record was absent when checked, so Railway currently reports `DNS_RECORD_STATUS_REQUIRES_UPDATE` and is validating ownership. After the CNAME propagates, Railway will verify the domain and issue its certificate automatically. The generated Railway domain remains live in the meantime.

Remaining production tasks are to add the DNS record above, bootstrap Susan's administrator account using `pnpm admin:create`, configure private S3-compatible media storage, and provide the three destination apps' SSO launch credentials before enabling their integrations.
