# AGENTS.md

See [CLAUDE.md](./CLAUDE.md) for ForumMagnum codebase patterns and conventions.

## Cursor Cloud specific instructions

### Node.js version

The repo requires **Node 24.x** (see `.nvmrc`). Cloud VMs may ship a different default Node on `PATH` (e.g. `/exec-daemon/node`). Prepend nvm’s Node 24 before running yarn/next:

```bash
export PATH="$HOME/.nvm/versions/node/v24.13.1/bin:$PATH"
```

(`nvm install` / `nvm use` per `.nvmrc` is a one-time setup step.)

### Local Postgres (no Vercel / no Docker)

When Vercel CLI and remote dev DB credentials are unavailable, use a **local PostgreSQL 16+** instance with the **pgvector** extension:

1. Start Postgres (Ubuntu example): `sudo pg_ctlcluster 16 main start`
2. Create DB and load schema:
   - `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"`
   - `sudo -u postgres psql -c "CREATE DATABASE forummagnum;"`
   - `sudo -u postgres psql -d forummagnum -f schema/accepted_schema.sql`
   - Optional test metadata: `sudo -u postgres psql -d forummagnum -f playwright/fixtures.sql`
3. Create `.env.local` (gitignored) with at least:
   - `SKIP_VERCEL_CODE_PULL=true`
   - `PG_URL=postgres://postgres:password@localhost:5432/forummagnum`
   - `ENV_NAME=localLwDevDb`
   - `FORUM_TYPE=LessWrong`

### Starting the dev server

Do **not** use `yarn start` without Vercel linkage (it runs `vercel env pull`). With `.env.local` as above:

```bash
export PATH="$HOME/.nvm/versions/node/v24.13.1/bin:$PATH"
SKIP_VERCEL_CODE_PULL=true node --no-deprecation ./node_modules/.bin/next dev --turbopack --port 3000
```

App URL: http://localhost:3000

### Tests and lint

| Task | Command |
|------|---------|
| Unit tests | `yarn unit` (no Postgres) |
| ESLint | `yarn eslint` or `yarn lint` (see `package.json`) |
| Typecheck | `yarn tsc` / `yarn checktypes` |
| Integration DB setup | `yarn integration-db-up` (Docker on port **5433**) then `yarn create-integration-db` — **warning:** `create-integration-db` starts a temporary Next dev server and calls `/api/dropAndCreatePg` + `/api/quit`, which will stop any dev server on port 3000 |
| Playwright E2E | `yarn playwright-test` (manages Docker DB + dev server on port **3456**; see `playwright.config.ts`) |

### Optional services

- **Hocuspocus** (Lexical collaborative editing): `cd fly/hocuspocusServer && yarn start:dev`, set `HOCUSPOCUS_URL=ws://localhost:8080` in env when starting Next.
- **Elasticsearch**: optional; search indexing logs errors if credentials are missing but core posting still works locally.

### Gotchas

- Elasticsearch is not configured in minimal local setups; post creation may log `Elastic is enabled, but credentials are missing` — expected.
- Avoid running `yarn create-integration-db` while the main dev server is running on the same port.
