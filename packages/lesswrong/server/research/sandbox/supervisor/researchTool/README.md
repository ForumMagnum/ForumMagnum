# research-tool — in-sandbox CLI

Single-file Node CLI deployed verbatim into the Vercel Sandbox. Wraps the
`/api/research/agent/*` HTTP endpoints with the bearer token already loaded
from env.

## Files

- `researchTool.cjs` — the CLI itself. Pure Node (built-ins only, no npm
  deps). Designed to be copied into the sandbox via `sandbox.writeFiles`.

## How it's deployed

`buildSupervisorBundle.js` (`yarn research-supervisor-build`) copies this file
verbatim to `sandbox/dist/research-tool.cjs`. From there it reaches a sandbox
two ways, both writing it to `RESEARCH_TOOL_PATH` from `sandboxLayout.ts` —
`/root/.research/bin/research-tool`, mode `0755`, outside the agent's cwd:

- `sandboxManager.overlayPlatformFiles()` writes it on every fresh provision and
  every resume, so a sandbox always runs the deployed server's copy rather than
  whatever its snapshot froze.
- `scripts/buildResearchSandboxSnapshot.ts` seeds the same path into the
  baseline snapshots.

There is no `/usr/local/bin` shim: the file carries a `#!/usr/bin/env node`
shebang, and the supervisor prepends `~/.research/bin` to the `PATH` it gives
the Claude Code subprocess (`researchBinPath()` in `supervisor/devServer.ts`),
so `research-tool ...` resolves from Bash.

The supervisor sets this per-subprocess env at spawn (`supervisor/index.ts`):
- `RESEARCH_BACKEND_BASE_URL` — the ForumMagnum backend host
- `RESEARCH_BACKEND_TOKEN` — the agent-scoped sandbox-callback token for *this
  conversation* (minted fresh per dispatch with a TTL sized to outlive the
  sandbox session)
- `RESEARCH_PROJECT_ID` — the project this sandbox is scoped to; used to build
  URLs (the token also pins the project server-side)
- `RESEARCH_CONVERSATION_ID` — the current conversation id, for disambiguating
  fetched document/transcript references that point back to this same session
- `RESEARCH_DEV_CONTROL_URL` — where `research-tool dev …` reaches the
  supervisor's localhost-only dev-server controller

## Auth contract

The CLI sends `Authorization: Bearer $RESEARCH_BACKEND_TOKEN` on every
request. The token is validated by `researchAgentAuth.ts:verifySandboxCallbackToken`
on the backend. That function verifies both scopes of sandbox-callback token:
the `agent` scope this CLI carries, which is per-conversation, and the
`supervisor` scope the supervisor process uses for its own POST persistence
callback to `/api/research/agent/conversations/:id/events` and its heartbeats.
They are separate tokens; this CLI only ever holds the agent-scoped one.

## Output format

`stdout`: a single JSON object per invocation, the verbatim API response.
`stderr`: human-readable error message (no JSON wrapping). Non-zero exit
on any error.

This is intentional — Claude Code parses the structured response and
displays errors raw to the model. It's also greppable for shell pipelines
inside the sandbox if anyone ever needs that.
