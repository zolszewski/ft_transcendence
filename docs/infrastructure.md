# Infrastructure

Operational documentation for the health check, backups, WAF and Vault. See the [README](../README.md) for the project overview.

## Health check and status page

- `https://localhost:8444/health` returns JSON: `200` if the backend, PostgreSQL and Redis respond, `503` otherwise (status `degraded`).
- `https://localhost:8444/status` shows the same state as an HTML page, refreshed every 30 seconds.
- Each service is checked with a 2-second timeout, so a stuck service does not block the page.

Check:

```bash
curl -sk https://localhost:8444/health
docker compose -f platform/docker-compose.yml stop redis
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:8444/health   # expected: 503
docker compose -f platform/docker-compose.yml start redis
```

## Disaster recovery

### Where the backups are

The `backup` service writes a compressed backup every hour to `platform/backups/`, named `academic-YYYYMMDD-HHMMSS.sql.gz`. Only the 7 most recent are kept. These files are never committed (they are in `.gitignore`).

### Check that backups are running

```bash
docker compose -f platform/docker-compose.yml ps backup
ls -lh platform/backups/
```

### Choose the backup to restore

List the available backups and copy the name of the one you want:

```bash
ls -lh platform/backups/
```

In the commands below, `FILE_NAME` is that name, without the folder (for example `academic-20261004-211612.sql.gz`).

### Test a restore (test database)

This restores the backup into a separate database, `academic_restore_test`. The real database is not modified.

```bash
docker compose -f platform/docker-compose.yml run --rm -e F=FILE_NAME --entrypoint sh backup -c '
  createdb academic_restore_test &&
  gunzip -c /backups/$F | psql -q -v ON_ERROR_STOP=1 -d academic_restore_test &&
  psql -d academic_restore_test -tA -c "SELECT count(*) FROM \"User\";"'
```

If the number displayed matches what the backup should contain, the backup is usable.

To delete the test database afterwards:

```bash
docker compose -f platform/docker-compose.yml run --rm --entrypoint sh backup -c 'dropdb academic_restore_test'
```

### Restore the real database

**Warning:** all data created after the backup will be lost.

**1. Back up the current state.** This file has the `pre-restore-` prefix, so the retention policy never deletes it. It lets you go back if the restore goes wrong:

```bash
docker compose -f platform/docker-compose.yml exec -T backup sh -c 'pg_dump --clean --if-exists | gzip > /backups/pre-restore-$(date +%Y%m%d-%H%M%S).sql.gz'
```

**2. Stop the services that write to the database** (the backend and the automatic backups):

```bash
docker compose -f platform/docker-compose.yml stop backend backup
```

**3. Restore** (replace `FILE_NAME` with the name chosen above):

```bash
docker compose -f platform/docker-compose.yml run --rm -e F=FILE_NAME --entrypoint sh backup -c 'gunzip -c /backups/$F | psql -q -v ON_ERROR_STOP=1 -d academic'
```

`ON_ERROR_STOP=1` stops the restore at the first error, instead of leaving the database half restored.

**4. Check the data:**

```bash
docker compose -f platform/docker-compose.yml exec -T postgresql psql -U academic -d academic -tA -c "SELECT (SELECT count(*) FROM \"User\"), (SELECT count(*) FROM \"Article\");"
```

**5. Restart the services:**

```bash
docker compose -f platform/docker-compose.yml start backend backup
curl -sk -i https://localhost:8444/health
```

The health check must answer `200`.

If something fails, restore the `pre-restore-*` file created in step 1, with the same command as in step 3.

User sessions are stored in Redis, which is not backed up: after a restore, users have to log in again.

### Settings

They are set in `platform/.env` (see `platform/.env.example`):

- `BACKUP_INTERVAL`: time between two backups, in seconds (3600 by default).
- `BACKUP_KEEP`: number of backups kept (7 by default).

After a change, recreate the backup container: `docker compose -f platform/docker-compose.yml up -d backup`.

## Web Application Firewall (WAF)

The WAF is built into Nginx: ModSecurity (`libnginx-mod-http-modsecurity` module) with the OWASP CRS 3.3.4 rules, in blocking mode, at paranoia level 2.

Related files:
- `platform/requirements/nginx/dockerfile`: installs the module and the rules, and sets the default action to `deny`.
- `platform/requirements/nginx/modsec/main.conf`: engine configuration, paranoia level and exclusions.
- `platform/requirements/nginx/nginx.conf`: loads the module and enables the WAF on the HTTPS server block.

Check:

```bash
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:8444/                                    # expected: 200
curl -sk -o /dev/null -w "%{http_code}\n" "https://localhost:8444/?q=<script>alert(1)</script>"     # expected: 403
curl -sk -o /dev/null -w "%{http_code}\n" "https://localhost:8444/?q=1%27%20OR%20%271%27=%271"       # expected: 403
```

### Fixed false positives

At paranoia level 2, the rules blocked the legitimate HTML sent by the article editor. Three rules are therefore not applied to the `content` field of the JSON body only:
- **941100** and **941320** (XSS detection): they blocked the HTML tags of the text (`<p>`, `<strong>`).
- **942130** (SQLi detection): it blocked a text formatted like an SQL tautology.

These exclusions only apply to the `content` field. The backend uses Prisma, which sends values as parameterized queries: an SQL injection in this field cannot change a query. The XSS risk on stored content is handled on the frontend, by sanitizing the HTML with DOMPurify before displaying it.

### Exception: `/socket.io/`

The WAF is disabled on `/socket.io/` only (`modsecurity off;` in `nginx.conf`). With ModSecurity enabled on this path, the inspection of the long-lived Socket.IO connections broke the chat.

This exception does not open an unprotected entry point for user data:
- ModSecurity only analyzes HTTP requests and responses. Once a WebSocket connection is open, the frames exchanged on it are never inspected, even with the WAF enabled.
- The browser never sends data through the socket: the backend only registers the `connection` and `disconnect` events. The socket is only used by the server to push events (`message:new`, `users:online`, `users:offline`).
- Chat messages are sent with `POST /api/chat/:userId`, which goes through `/api/` and is therefore inspected by the WAF, rate limited and validated by the backend.
- The socket connection is authenticated with the session cookie: a connection without a valid session is refused.

### Known limitations

- An XSS payload sent in another field of the JSON body is not detected by the WAF in this configuration.
- Access by IP address (`https://127.0.0.1:8444`) is blocked by rule 920350 (numeric `Host` header). Normal access through `localhost` is not.

## Secrets with Vault

The application secrets (session secret, GitHub credentials, `DATABASE_URL`) are stored in HashiCorp Vault, and the backend fetches them at startup. The application does not read them from the `.env` file.

Components:
- `vault`: Vault server, file storage in the `platform_vault_data` volume. Vault encrypts its data before writing it. It is not exposed outside the Docker network: only internal services can reach it.
- `vault-init`: bootstrap, run at each `make`. It is idempotent: it initializes Vault only once, unseals it if it is sealed, creates the `secret/` secrets engine, the `backend` policy (read-only on `secret/app`) and the backend token. It never overwrites existing secrets.
- `backend/scripts/with-vault.js`: starts the backend (migrations, then server) with the secrets fetched from Vault.

Where sensitive items are stored:
- unseal key and root token: `platform_vault_keys` volume, never in Git;
- backend token: `platform_vault_token` volume, mounted read-only in the backend;
- application secrets: encrypted in `platform_vault_data`.

### First launch (fresh clone)

1. Run `make` once: it creates `platform/.env` from `platform/.env.example`, then stops.
2. Fill in the values of `platform/.env` (GitHub credentials, session secret, `DATABASE_URL`, PostgreSQL password).
3. Run `make` again.

The `.env` file also contains the values the bootstrap uses to fill Vault the first time. If Vault is reset, these values must still be present.

### Restart

After Vault restarts, it is sealed. Running `make` again unseals it automatically through the bootstrap. Without this step, the backend cannot fetch its secrets.

Check:

```bash
docker compose -f platform/docker-compose.yml exec -T vault sh -c 'VAULT_ADDR=http://127.0.0.1:8200 vault status'
docker compose -f platform/docker-compose.yml logs vault-init
```

### Known limitations

- The PostgreSQL superuser password stays in `.env`, because the PostgreSQL container needs it at initialization, before Vault is ready.
- A single unseal key is used, and it is stored on the same machine as Vault. It is simpler to automate, but it does not protect against access to the machine.
- The root token is kept in the `platform_vault_keys` volume. In production, it should be revoked after the bootstrap.
