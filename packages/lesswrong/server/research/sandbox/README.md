# Research workspace — Vercel Sandbox runtime

This directory owns the sandbox that backs a research conversation: the
backend-side code that provisions and maintains it, and the supervisor program
that runs *inside* it and drives Claude Code.

One conversation owns exactly one persistent Vercel Sandbox, named
`research-{conversationId}`. Persistent sandboxes auto-snapshot their filesystem
when they stop and restore it on the next run, so the agent's working files and
Claude Code session files survive across stops.

## Backend side (runs in the ForumMagnum server)

- `sandboxManager.ts` — the whole lifecycle. `getOrCreateSandbox(conversationId,
  context)` is the single entry point (lazy, idempotent, called on every turn);
  it resolves only once the in-sandbox supervisor answers `/health`. Also holds
  the naming helpers, the platform-file overlay, the pinned-CLI reconcile, the
  supervisor launch + health probe + repair path, `stageClaudeSessionFile`, and
  `maintainSandboxTimeout` (the idle/roll policy).
- `sandboxLayout.ts` — the in-sandbox paths shared with the snapshot builder,
  plus `PINNED_CLAUDE_CODE_VERSION` and `RESEARCH_AGENT_MODEL`.
- `platformAssets.ts` — reads the built platform files out of `dist/`
  (`supervisor.js`, `research-tool.cjs`) plus `supervisor/agentInstructions.md`.
- `buildSupervisorBundle.js` — esbuild bundler producing that `dist/`
  (`yarn research-supervisor-build`). Zero-dependency CJS for the sandbox's
  vanilla node runtime.
- `saveEnvironment.ts` — turns a conversation's sandbox into a reusable
  `ResearchEnvironments` snapshot: quiesce via the supervisor's `/status`,
  snapshot, clone into a throwaway sandbox, optionally scrub the agent session,
  snapshot the clone.
- `listSandboxDirectory.ts`, `readSandboxTextFile.ts`, `sandboxResourceStats.ts`
  — read-only inspection behind the workspace UI's file browser and stats
  footer; the first two `realpath`-confine access to `/vercel/sandbox`.
- `sandboxCommands.ts` — `runSandboxCommandOrThrow`.
- `inspectSandbox.ts`, `testBootstrap.ts` — manual debug scripts (see their
  header comments for invocation).

Callers live outside this directory: `@/server/resolvers/researchResolvers.ts`
(dispatch/cancel/answer, dev-preview URLs, save-environment),
`app/api/research/agent/**` (the endpoints the sandbox calls back into), and
`@/server/scripts/buildResearchSandboxSnapshot.ts` (baseline snapshots, stored
in `SandboxBaselineSnapshots`).

## Launch sequence

Every fresh provision and every resume runs the same stack
(`launchSupervisorStack`):

1. `Sandbox.getOrCreate({ name, source: {type:"snapshot"}, persistent: true,
   resume: true, ports: [9280, 9281], … })` — resume / create / rebuild-on-expired-snapshot.
2. Overlay the current platform files (`overlayPlatformFiles`) — the supervisor
   bundle, the `research-tool` binary, and `agentInstructions.md` written as
   `~/.claude/CLAUDE.md`. Always from the deployed server's `dist/`, never from
   the snapshot, so an old snapshot still runs today's platform code.
3. `reconcileClaudeCodeVersion` — bring the CLI to `PINNED_CLAUDE_CODE_VERSION`.
4. `launchSupervisor` — `nohup setsid node ~/.research/supervisor.js`, with the
   supervisor's env passed on that `runCommand`, then poll `/health`.

Paths (`sandboxLayout.ts`): the agent's cwd is `/vercel/sandbox`; platform files
live outside it under `HOME=/root` — `~/.research/supervisor.js`,
`~/.research/bin/research-tool`, `~/.research/queue/` (durable state, never
overlaid), `~/.claude/CLAUDE.md`, `~/.claude/projects/` (Claude Code sessions).

Session policy: `SESSION_TIMEOUT_MS` (30 min) is an idle dead-man's switch;
`maintainSandboxTimeout` — driven by the supervisor's heartbeat — extends it
while a turn runs and stops ("rolls") an idle session past `SESSION_ROLL_AGE_MS`
(4.5 h), leaving the next turn to resume from the auto-snapshot.

## Inside the sandbox: `supervisor/`

A single bundled Node process, launched per session:

- `index.ts` — entrypoint. Reads env, wires the pieces, runs `init.sh`, starts
  the dev server, self-heals a turn left dangling by a restart, handles
  shutdown. Also builds the per-conversation `--append-system-prompt` context.
- `server.ts` — the auth-gated HTTP API on port 9280: `POST /dispatch`,
  `POST /cancel/:conversationId`, `POST /answer/:conversationId`,
  `GET /status`, and an unauthenticated `GET /health`.
- `conversationHub.ts` — owns the one live Claude process per conversation,
  fans parsed JSONL lines to the post-persister, tracks busy/idle from the CLI's
  `session_state_changed` events, and implements cancel and `AskUserQuestion`
  answering.
- `claudeRunner.ts` — spawns and talks to `claude -p --input-format stream-json
  --output-format stream-json` (one long-lived process per conversation; turns
  are fed as stream-json user messages; cancel uses the `interrupt`
  control_request).
- `jsonlParser.ts` — line chunker that hands back the **verbatim** raw line
  alongside the parsed object; the raw line is what gets persisted.
- `postPersister.ts` + `durableEventQueue.ts` — append every event to an
  on-disk queue first, ship to
  `POST /api/research/agent/conversations/:id/events`, and only drop it once the
  backend acks. Survives restarts and backend outages.
- `heartbeat.ts` — ~10 s `POST /api/research/agent/sandboxes/:id/heartbeat`
  carrying `turnRunning` and recent dev-server activity.
- `auth.ts` — the compact HMAC bearer scheme (`base64url(payload).base64url(sig)`)
  used for backend → sandbox calls; also `DEVAUTH_SCOPE`.
- `authProxy.ts` — second public listener (port 9281) fronting the
  localhost-only dev server: `/_devauth/:token` exchanges a signed token for a
  host-only cookie, everything else proxies (HTTP + WebSocket) to the dev port.
- `devServer.ts`, `devServerManager.ts` — the agent's `dev-server.sh` run as a
  supervised child on port 9282, with restart/backoff and a localhost-only
  control server on 9283 (`/start`, `/stop`, `/restart`) that the agent reaches
  through `research-tool dev …`.
- `sessionBootstrap.ts` — installs a session JSONL the backend staged at
  `<session path>.staged`, so `claude --resume` works in a rebuilt sandbox.
- `backendResponseCheck.ts` — distinguishes a real `{ok:true}` from a tunnel
  interstitial "suspect 200".
- `agentInstructions.md` — shipped into the sandbox as `~/.claude/CLAUDE.md`;
  the agent's actual instructions. Per-conversation ids are *not* in this file;
  they arrive via `--append-system-prompt`.
- `researchTool/researchTool.cjs` — the zero-dependency CLI the agent invokes as
  `research-tool`. (Its sibling `README.md` documents the auth contract and
  output format accurately, but its deployment section predates the current
  overlay: the binary is written to `~/.research/bin/research-tool`, not
  `/vercel/sandbox`.) Subcommands include `fetch-doc`,
  `edit-doc`, `comment-doc`, `reply-comment`, `create-doc`, `list-documents`,
  `list-conversations`, `fetch-conversation`, `set-presentation`, `dev`.

## Auth and token flow

Two directions, two schemes:

- **Backend → sandbox** uses the per-conversation `supervisorSecret` (and
  `devProxySecret`) stored on the `ResearchSandboxSessions` row, injected at
  launch as `SUPERVISOR_SECRET` / `DEV_PROXY_SECRET`. Tokens are minted with
  `signSupervisorToken` and validated in-sandbox by `supervisor/auth.ts`;
  `/dispatch`, `/cancel`, `/answer` additionally require the token's `scope` to
  equal the conversation id, and the payload's `sandboxId` to match.
- **Sandbox → backend** uses HS256 JWTs minted by
  `app/api/research/agent/researchAgentAuth.ts` over
  `RESEARCH_SANDBOX_CALLBACK_SECRET`, in two scopes: `supervisor` (injected once
  per launch as `CALLBACK_TOKEN`; events + heartbeat) and `agent` (minted per
  dispatch, handed to the claude subprocess as `RESEARCH_BACKEND_TOKEN`, so
  `research-tool` can hit conversation-scoped document endpoints). Both TTLs are
  deliberately longer than a sandbox session, because they ride as spawn-time
  env in long-lived processes.

The user's Claude Code OAuth token is stored encrypted on the user
(`claudeCodeOAuthTokenEncrypted`, `@/server/research/userSecretsCrypto.ts`) and
passed to the supervisor as `CLAUDE_CODE_OAUTH_TOKEN`.

## Shared backend with the public agent API

The `/api/research/agent/*` document endpoints that `research-tool` wraps share
their implementation with the public `/api/agent/*` post-editing tools — the
same quote/prefix matching and markdown rules apply. This is stated to the agent
in `supervisor/agentInstructions.md` (see the "research-tool" section and the
"Notable differences from the public post-editing API" table), which is also the
best place to read what actually differs (`documentId` vs `postId` + link key,
default `mode` of `edit` rather than `suggest`, provenance handling).

## Empirical notes on the Vercel Sandbox SDK

Dated observations that are cheaper to keep than to rediscover. Re-verify before
relying on them; the installed SDK version is in `package.json`.

- (2026-05-05) Provision-to-running round-trip: ~5–7 seconds wall-clock.
- `sandbox.domain(port)` returns a fully-qualified `https://sb-<id>.vercel.run`
  host with TLS terminated upstream — no cert handling needed inside the sandbox.
- (2026-05-05) The public URL is reachable from the host within ~1 second of the
  in-sandbox listener calling `server.listen(...)`. The supervisor readiness
  probe still polls `/health` for up to 30 s in case routing lags.
- `runCommand(...)` returns a `CommandFinished` whose `stdout()` / `stderr()`
  are async methods, not properties — the first call fetches and caches.
- Backgrounding inside `runCommand`: the `&`-backgrounded unit must be a simple
  command with every fd redirected (`;` before it, never `&&`). Backgrounding a
  compound list makes `runCommand` wait on the subshell's inherited output
  pipes, which on a freshly created session never close, so the provision hangs
  until it times out. See the comment in `launchSupervisor`.
- `writeFiles([{ path, content, mode? }])` takes absolute paths (including
  outside the agent cwd, e.g. under `/root`), creates parent directories, and is
  the right way to move file content in — it avoids `runCommand cat > file`
  quoting problems, and it's the path a long conversation's staged session JSONL
  takes, since that can exceed the supervisor's own HTTP body cap.
- Up to 4 ports per sandbox via `ports: [...]` at create time (see
  `ports` in `node_modules/@vercel/sandbox/dist/sandbox.d.ts`). We use two:
  the supervisor (9280) and the auth-proxy (9281); everything else is
  multiplexed behind those or bound to localhost.
- (2026-05-05) `timeout` defaulted to 5 minutes. It can be pushed out
  mid-session with `extendTimeout(ms)`, but a session is still bounded by
  Vercel's hard cap, and the public URL is per-session. Note that in-repo
  comments disagree about that cap (`sandboxManager.ts` says 24 h, the heartbeat
  route says 5 h) — check Vercel's current docs rather than trusting either.
- `Sandbox.getOrCreate` runs `onCreate` only when it created the session and
  `onResume` only when it resumed one; it can also hand back a session another
  caller brought up, with neither hook firing. `getOrCreateSandbox` therefore
  health-probes and repairs rather than assuming the launch hooks ran.
- The SDK types `getOrCreate`'s `source` as git/tarball only, but at runtime it
  forwards `source` to `Sandbox.create`, which does accept a snapshot source —
  hence the cast in `getOrCreateSandbox`.
