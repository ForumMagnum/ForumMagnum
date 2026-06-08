# research-tool — in-sandbox CLI

Single-file Node CLI deployed verbatim into the Vercel Sandbox. Wraps the
`/api/research/agent/*` HTTP endpoints with the bearer token already loaded
from env.

## Files

- `researchTool.cjs` — the CLI itself. Pure Node (built-ins only, no npm
  deps). Designed to be copied into the sandbox via `sandbox.writeFiles`.

## How T2 deploys it

`sandboxManager.getOrCreateSandbox()` (task #17) writes this file into the
sandbox at provision time, e.g.:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const researchToolSrc = readFileSync(
  resolve(__dirname, "supervisor/researchTool/researchTool.cjs"),
  "utf8",
);

await sandbox.writeFiles([
  { path: "/vercel/sandbox/research-tool.cjs", content: researchToolSrc },
]);
```

The supervisor's Claude Code spawn (task #19) sets `PATH` and env vars so
that Claude can invoke `research-tool ...`. Recommended approach: drop a
shim at `/usr/local/bin/research-tool`:

```sh
#!/bin/sh
exec node /vercel/sandbox/research-tool.cjs "$@"
```

The spawn must set per-subprocess env:
- `RESEARCH_BACKEND_BASE_URL` — the ForumMagnum backend host
- `RESEARCH_BACKEND_TOKEN` — the sandbox-callback token for *this conversation*
  (minted fresh per dispatch with a TTL sized to outlive the sandbox session)
- `RESEARCH_PROJECT_ID` — convenience for `list-project`
- `RESEARCH_CONVERSATION_ID` — the current conversation id, for disambiguating
  fetched document/transcript references that point back to this same session

## Auth contract

The CLI sends `Authorization: Bearer $RESEARCH_BACKEND_TOKEN` on every
request. The token is validated by `researchAgentAuth.ts:verifySandboxCallbackToken`
on the backend. The same token authorizes:

- All endpoints under `/api/research/agent/*` from this CLI
- The supervisor's own POST persistence callback to
  `/api/research/agent/conversations/:id/events`

The token is per-conversation.

## Output format

`stdout`: a single JSON object per invocation, the verbatim API response.
`stderr`: human-readable error message (no JSON wrapping). Non-zero exit
on any error.

This is intentional — Claude Code parses the structured response and
displays errors raw to the model. It's also greppable for shell pipelines
inside the sandbox if anyone ever needs that.
