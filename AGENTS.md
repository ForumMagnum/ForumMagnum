## Cursor Cloud specific instructions

### Services Overview

| Service | How to Run | Notes |
|---------|-----------|-------|
| Next.js Dev Server | See "Starting the dev server" below | Main application on port 3000 |
| PostgreSQL (pgvector) | Docker container on port 5433 | Required for all server functionality |

### Starting the dev server

The dev server requires a PostgreSQL database with the schema loaded. Start PostgreSQL via Docker, then run:

```bash
PORT=3000 ENV_NAME=localLwDevDb FORUM_TYPE=LessWrong \
  PG_URL="postgres://postgres:password@localhost:5433/postgres" \
  SKIP_VERCEL_CODE_PULL=true \
  node --no-deprecation ./node_modules/.bin/next dev --turbopack
```

The `SKIP_VERCEL_CODE_PULL=true` env var is needed because the Vercel CLI is not configured in cloud environments. Without it, the standard `yarn start` script will fail trying to sync environment variables from Vercel.

### Starting PostgreSQL

```bash
docker run -d --rm --name forum-magnum-postgres \
  -e POSTGRES_PASSWORD=password -p 5433:5432 \
  -v $PWD/schema/accepted_schema.sql:/docker-entrypoint-initdb.d/00_accepted_schema.sql \
  ankane/pgvector
```

Wait a few seconds for PostgreSQL to initialize the schema before starting the dev server.

### Docker setup in Cloud Agent VMs

Docker requires special configuration in the nested container environment:
- Storage driver: `fuse-overlayfs` (configured in `/etc/docker/daemon.json`)
- iptables: must use `iptables-legacy` (via `update-alternatives`)
- Socket permissions: `chmod 666 /var/run/docker.sock` after starting dockerd

Start dockerd with: `sudo dockerd &>/tmp/dockerd.log &`

### Running tests

- **Unit tests**: `yarn unit` (no database needed)
- **Integration tests**: Require PostgreSQL on port 5433. Run `yarn create-integration-db` first if the template DB hasn't been created, then `yarn integration`
- **Lint**: `yarn eslint` (ESLint only) or `yarn tsc` (TypeScript only) or `yarn lint` (both in parallel)
- **Codegen**: `yarn generate` (requires `PG_URL` and `ENV_NAME` env vars set)

### Key gotchas

- Node.js v24.13+ is required (use `nvm use 24.13`). The `.nvmrc` specifies this.
- The `unix-dgram` native module fails to build on Node 24 but is optional and can be ignored.
- After any schema/GraphQL/fragment changes, run `yarn generate` before type-checking.
- The first user created on a fresh database automatically becomes an admin.
- `HOCUSPOCUS_URL` not being set produces a warning but doesn't affect core functionality.
