# Research workspace — Vercel Sandbox runtime (T2)

Code that owns sandbox provisioning, lifecycle, and the in-sandbox supervisor process.
See `research-tool-design.md` ("Sandbox lifecycle and conversation execution" / "Streaming")
for the design context.

## Smoke test

`smokeTest.ts` is the bare-minimum end-to-end check that:

1. provisions a sandbox via `Sandbox.create()` (node24 runtime, 2 vCPUs, 5-minute timeout)
2. runs `echo hello` and reads `stdout()`
3. writes a tiny Node HTTP responder via `sandbox.writeFiles()`
4. launches it detached on port 3000
5. resolves the public URL via `sandbox.domain(3000)` and `fetch`es it from the host
6. stops the sandbox via `sandbox.stop({ blocking: true })`

### Running it

```sh
set -a && source .env.local && set +a
yarn ts-node -r tsconfig-paths/register --swc --project tsconfig-repl.json \
  packages/lesswrong/server/research/sandbox/smokeTest.ts
```

Auth: relies on `VERCEL_OIDC_TOKEN` from `.env.local` (refreshed via `vercel env pull`).
Falls back to `VERCEL_TOKEN` + `VERCEL_TEAM_ID` + `VERCEL_PROJECT_ID` if OIDC isn't present.

### Verified behaviour (2026-05-05, SDK `@vercel/sandbox@1.10.0`)

- Provision-to-running round-trip: ~5–7 seconds wall-clock.
- `sandbox.domain(port)` returns a fully-qualified `https://sb-<id>.vercel.run` host
  with TLS terminated upstream — no extra cert handling needed inside the sandbox.
- The public URL is reachable from the host within ~1 second of the in-sandbox
  responder calling `server.listen(...)`. No retries needed in the happy path,
  but the smoke test keeps a small backoff loop in case Vercel routing lags.
- `runCommand({ detached: true })` returns a `Command` (not `CommandFinished`) and
  the process keeps running after the call resolves. Killing the sandbox stops it.
- `runCommand({ ... })` (non-detached) returns `CommandFinished` whose `stdout()`
  / `stderr()` are async methods, not properties — first call fetches and caches.
- `writeFiles([{ path, content }])` succeeds with absolute paths under
  `/vercel/sandbox` (the writable user dir). Use this rather than `runCommand cat
  > file` to avoid quoting headaches.

### Known shape constraints (relevant to follow-up tasks)

- Up to 4 ports per sandbox via the `ports: [...]` array at create time. Design
  doc cites 15; SDK type ([sandbox.d.ts:48-49](../../../../node_modules/@vercel/sandbox/dist/sandbox.d.ts))
  caps at 4. The supervisor only needs one HTTP port — multiplex per-conversation
  routing inside that single port.
- Default `timeout` is 5 minutes; max runtime is 24 hours on Pro/Enterprise
  (45 min on Hobby) as of June 2026. Use `extendTimeout(ms)` to push out the
  cap mid-session, but each session is still bounded by that max (and the
  public URL is per-session). The "extend or roll" policy from the design doc
  lives at the supervisor / sandboxManager layer.
- `Sandbox.create` accepts `env: Record<string, string>` for default env vars
  inherited by all `runCommand` invocations — this is where the supervisor's
  `CLAUDE_CODE_OAUTH_TOKEN` and HMAC-shared-secret will go.
- `Sandbox.create` returns `Sandbox & AsyncDisposable` — `await using sandbox = ...`
  works in scripting contexts. Server-side callers will hold the handle in a
  module-level Map and call `stop()` explicitly via the manager.

## Layout

- `smokeTest.ts` — the SDK smoke test (this file's subject).
- `sandboxManager.ts` (task #17, pending) — `getOrCreateSandbox(userId, projectId)`
  with concurrency-cap spillover.
- `supervisor/` (tasks #18-#22, pending) — the Node process that runs *inside* the
  sandbox: HTTP server, signed-token validation, Claude Code subprocess
  spawning, JSONL stream parsing, dual SSE+POST fanout, heartbeat reporting.
