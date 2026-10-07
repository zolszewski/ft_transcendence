# Infrastructure

Operational reference for the health check, backups, WAF and Vault. See the [README](../README.md) for the project overview.

## Health check and status page

- `GET /health`: JSON, `200` if the backend, PostgreSQL and Redis all respond, `503` otherwise. 2s timeout per service.
- `GET /status`: same check as an HTML page, refreshed every 30s.

```bash
curl -sk https://localhost:8444/health
```

## Backups and disaster recovery

`backup` runs `pg_dump` every hour into `platform/backups/academic-YYYYMMDD-HHMMSS.sql.gz`, keeps the 7 most recent, and is not committed (`.gitignore`). `BACKUP_INTERVAL` / `BACKUP_KEEP` are set in `platform/.env`; apply a change with `docker compose up -d backup`.

List `platform/backups/` and use one of the file names as `FILE_NAME` below.

**Test a restore** (uses a separate database, the real one is untouched):

```bash
docker compose -f platform/docker-compose.yml run --rm -e F=FILE_NAME --entrypoint sh backup -c '
  createdb academic_restore_test &&
  gunzip -c /backups/$F | psql -q -v ON_ERROR_STOP=1 -d academic_restore_test &&
  psql -d academic_restore_test -tA -c "SELECT count(*) FROM \"User\";"'
docker compose -f platform/docker-compose.yml run --rm --entrypoint sh backup -c 'dropdb academic_restore_test'
```

**Restore the real database** (all data created after the backup is lost):

```bash
# 1. Snapshot the current state first, so a failed restore can be undone
docker compose -f platform/docker-compose.yml exec -T backup sh -c 'pg_dump --clean --if-exists | gzip > /backups/pre-restore-$(date +%Y%m%d-%H%M%S).sql.gz'

# 2. Stop the services that write to the database, restore, restart
docker compose -f platform/docker-compose.yml stop backend backup
docker compose -f platform/docker-compose.yml run --rm -e F=FILE_NAME --entrypoint sh backup -c 'gunzip -c /backups/$F | psql -q -v ON_ERROR_STOP=1 -d academic'
docker compose -f platform/docker-compose.yml start backend backup
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:8444/health   # expected: 200
```

On failure, restore the `pre-restore-*` file with the same command as step 2. Redis sessions are not backed up: users must log in again after a restore.

## WAF (ModSecurity)

Nginx + ModSecurity, OWASP CRS 3.3.4, blocking mode, paranoia level 2. Config in `platform/requirements/nginx/modsec/main.conf` and `nginx.conf`; default action set to `deny` in the `dockerfile`.

```bash
curl -sk -o /dev/null -w "%{http_code}\n" "https://localhost:8444/?q=<script>alert(1)</script>"   # expected: 403
```

**Exclusions**, on the `content` and `abstract` fields only — both go through Prisma's parameterized queries, so SQLi there can't alter a query, and stored HTML is sanitized by DOMPurify on the frontend:

| Rule | False positive |
|---|---|
| 941100, 941320 (XSS) | HTML tags in article text (`<p>`, `<strong>`) |
| 942130, 942200 (SQLi) | Prose that looks like a SQL tautology, or has a comma followed by an apostrophe |

**Exclusion on the uploaded file name** (`FILES:file`), for the same reason — never used as a path or executed, only stored as text and displayed:

| Rule | False positive |
|---|---|
| 920120, 920121 | A quote or apostrophe in the file name (e.g. `Capture d'écran ....png`, the default name of a French screenshot) |

### Exception: `/socket.io/`

WAF disabled there (`modsecurity off`), because it broke long-lived connections. Safe: ModSecurity never inspects WebSocket frames; the browser only receives events over the socket, it never sends data through it; chat messages go through `POST /api/chat/:userId`, which is inspected.

**Known limits:** an XSS payload in another JSON field is not caught. Access by IP (`https://127.0.0.1:8444`) is blocked by rule 920350 (numeric `Host` header); `localhost` is not affected.

## Secrets (Vault)

`SESSION_SECRET`, the GitHub credentials and `DATABASE_URL` are stored in Vault (KV v2, `secret/app`); the backend reads them at startup through a read-only token, never from `.env`.

- `vault`: server, file storage in the `platform_vault_data` volume.
- `vault-init`: idempotent bootstrap run at each `make` — initializes Vault once, unseals it, creates the `backend` policy and token, seeds the secrets if absent.
- Unseal key and root token: `platform_vault_keys` volume, never in Git. Backend token: `platform_vault_token`, mounted read-only.

**First run:** `make` creates `platform/.env` and stops; fill it in, then `make` again — these values seed Vault once.

**After a Vault restart** (it comes back sealed): running `make` again re-runs the bootstrap and unseals it.

```bash
docker compose -f platform/docker-compose.yml exec -T vault sh -c 'VAULT_ADDR=http://127.0.0.1:8200 vault status'
```

**Known limits:** the PostgreSQL superuser password stays in `.env` (needed before Vault is up). A single unseal key is stored on the same machine as Vault. The root token stays in `platform_vault_keys`; it should be revoked after bootstrap in production.
