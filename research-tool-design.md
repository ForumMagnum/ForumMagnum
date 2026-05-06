# Research Workspace — System Design

A new domain inside ForumMagnum (sibling to Posts/Comments) for AI-assisted thinking and research. Document-centric, collaborative from day one, with Claude Code conversations stored canonically and long-running execution in Vercel Sandbox.

## Resolved decisions from prior rounds

- **Claude Code conversations are the source of truth.** The JSONL stream Claude Code produces is persisted in Postgres on the way through. Sandboxes are ephemeral; the conversation is not.
- **Every agent interaction is a `ResearchConversation`.** Whether it begins in a sidebar chat panel, an AgentBlock embedded in a document, a "query with selected context" modal, a sub-agent spawned by another conversation, or a fork of an existing chat — they all materialize as rows in one indexed collection. Each row carries an `entrypoint` discriminated union recording how/where it was created and any context-specific metadata. This is what makes conversations referenceable across the workspace.
- **No MCP server.** Agents reach project state through a small authenticated HTTP API — same shape as our existing GraphQL surface — invoked from inside the sandbox. We control response shapes (return handles instead of full content where appropriate), avoid MCP's auto-context-injection behavior, and reuse infra we already have.
- **No auto-generated summaries.** Conversations get a user-editable title (optionally seeded by a one-shot title call) and that's it.
- **Collaborative editing from day one.** Documents are Yjs-backed using ForumMagnum's existing collab editor infrastructure. Agent writes flow through the same CRDT path as user edits.
- **Streaming directly from sandbox to client.** Each sandbox exposes an SSE endpoint over a Vercel-provided routable URL; the client connects directly. No Vercel Function in the hot path. Persistence happens in parallel via authenticated POSTs from the sandbox to our backend.
- **Reuse the existing `app/api/agent` infrastructure for document writes.** The Posts agent API already implements the full Yjs server-apply path via `withMainDocEditorSession()` (`app/api/agent/editorAgentUtil.ts:287-388`), including connecting to Hocuspocus, mutating Lexical state, and propagating updates to connected clients. New ResearchDocument endpoints adapt these route handlers; we are not building Yjs-server-apply from scratch.

## Data model

Five collections under `@/lib/collections/`, registered in `allCollections.ts` and `allSchemas.ts`. All have `userId` + `projectId` (where applicable) for permissioning via `userOwns`.

### `ResearchProjects`
- `title: TEXT`, `description: TEXT?`
- `userId: VARCHAR(27)`
- `claudeCodeTokenRef: TEXT` — pointer to the user's encrypted setup token
- `settings: JSONB` — model defaults, sandbox preferences

### `ResearchDocuments`
- `projectId`, `title?`
- `contents: JSONB` — Lexical editor state (last persisted snapshot)
- Live state owned by the collab server in `YjsDocuments` keyed by `documentId = research-doc-{_id}`.
- Reuse the existing `Revisions` pattern for history (already collection-aware via `Revisions.collectionName`).

### `YjsDocuments` (existing — schema change required for correctness)

The `post-{id}` prefix exists at the **Hocuspocus protocol layer only** (the documentName clients send over WebSocket). The postgres extension explicitly strips it before storage (`fly/hocuspocusServer/src/extensions/postgres.ts:30`), so `YjsDocuments.documentId` currently contains just `{postId}` or `{postId}/{fieldName}` — no collection marker.

This means adding a second collection that uses the same ID format risks **direct primary-key collisions**: a Post and a ResearchDocument that happen to share an `_id` would map to the same row. The Hocuspocus postgres extension uses the same 17-char alphanumeric ID generator as ForumMagnum (`postgres.ts:11-19`), so collisions in production are statistically unlikely but architecturally possible — and we shouldn't ship something where the wrong-collection-with-the-same-id case is even a question.

Schema change:
- Add `collectionName: TEXT NOT NULL` (mirrors `Revisions.collectionName`).
- Change the uniqueness constraint from `(documentId)` to composite `(collectionName, documentId)`.
- Migration: backfill `collectionName = 'Posts'` for all existing rows in one statement; safe and instant.
- `parseDocumentId()` in the postgres extension generalizes from "strip `post-` prefix" to "match against a registered prefix table, return `{collectionName, documentId}`." `post-{id}` → `('Posts', id)`; `research-doc-{id}` → `('ResearchDocuments', id)`.

Protocol-layer prefix convention is unchanged for routing/auth dispatch; the prefix is purely how the Hocuspocus server figures out *which collection's permission check to run* before any DB lookup. The JWT payload also carries `collectionName` so the WebSocket server doesn't have to re-parse the documentName at validation time.

### `ResearchConversations`
The unifying primitive. Every interaction the user has with an agent — and every agent-spawned sub-interaction — is one row here. The collection is mostly stable creation-time metadata; live state lives elsewhere.

```
_id, userId, projectId          — identity / permissions
claudeSessionId: TEXT           — Claude Code's UUID, used with --resume
title: TEXT?                    — user-editable, optionally auto-seeded
entrypoint: JSONB               — discriminated union, see below
lastActivityAt: TIMESTAMPTZ     — denormalized for sidebar sort, written per turn
createdAt
```

`entrypoint` discriminator (extensible — these are the kinds anticipated; new ones can be added without schema changes):

```
{ kind: 'chat' }
    — top-level chat in the project sidebar; no anchor

{ kind: 'document', documentId, anchorId }
    — anchored in a document, either a block-level AgentBlock
      or a range selection wrapped in a ResearchAnchor mark.
      AnchorId is stable; block id and selection mark id share the same namespace.

{ kind: 'query_modal', references: EntityRef[] }
    — ad-hoc query with explicitly-attached context references
      (other documents, conversations, anchors).

{ kind: 'subagent', parentConversationId }
    — spawned by another conversation via the agent-facing API.

{ kind: 'fork', parentConversationId, forkedAtSeq }
    — user-initiated fork of an existing conversation at a point
      in its event history.
```

What's intentionally not on the row:
- **`status`** — live "is a turn running" derives from the sandbox side; if the corresponding `ResearchSandboxSessions` row points at me, I'm running. Otherwise I'm idle.
- **`currentSandboxSessionId`** — the inverse pointer (sandbox → current conversation) is the canonical one. Sandboxes are the scarce resource and naturally hold the bind.
- **`tokensUsed` / `costCents`** — not consumed on any hot read path; derive from events when a project-level dashboard wants them.
- **`parentConversationId` / `originEntity`** — subsumed by `entrypoint`; their data lives inside the discriminator.

### `ResearchConversationEvents`
Append-only mirror of the Claude Code JSONL stream. Source of truth for the conversation when the sandbox is gone.

- `conversationId`, `seq: INTEGER`
- `claudeMessageUuid: TEXT?` — if the JSONL line carries one
- `kind: TEXT` — `user | assistant | tool_use | tool_result | thinking | system | error`
- `payload: JSONB` — the verbatim JSONL line (or its parsed form)
- `createdAt`
- Indexed `(conversationId, seq)` and `(conversationId, claudeMessageUuid)`

We can reconstruct a `.jsonl` file from this on demand — for display and for re-mounting the conversation inside a fresh sandbox so `claude --resume` works after the original sandbox is gone.

### `ResearchSandboxSessions`
Tracks live Vercel Sandboxes. Distinct from `ResearchConversations`; one sandbox can host many concurrent conversations.

- `userId`, `projectId`, `vercelSandboxId`, `endpointUrl`
- `status: TEXT` — `provisioning | active | idle | stopped`
- `lastUsedAt`, `expiresAt`

A sandbox is per-`(user, project)`, but the supervisor inside it **multiplexes multiple concurrent Claude Code subprocesses**. Each subprocess has its own `claudeSessionId` and its own session dir; they share the sandbox's CPU/memory/auth-token (same model as running multiple `claude -p` invocations in different terminals on a laptop). The supervisor exposes one HTTP server with per-conversation routing (`/sse/:conversationId`).

When a sandbox runs out of headroom (a conservative cap on concurrent conversations, monitored via supervisor heartbeats), provision a second sandbox for that `(user, project)`. Multiple `ResearchSandboxSessions` rows per `(user, project)` are normal. Live "which conversations are running where" lives in supervisor memory and is queryable via the supervisor's status endpoint, not denormalized into the DB.

## Document collaboration

Use the existing Lexical + Yjs + Hocuspocus stack unchanged. Verified architecture:

- **Client**: `HocuspocusProvider` (from `@hocuspocus/provider`) wired into Lexical via `@lexical/yjs` `createBinding()`. Setup in `packages/lesswrong/components/lexical/collaboration.ts`.
- **Server**: standalone Hocuspocus WebSocket server at `fly/hocuspocusServer/src/`, persisting to `YjsDocuments` (BYTEA) on every change. JWT-authenticated; tokens issued by the `HocuspocusAuth` GraphQL resolver (currently scoped per-post).
- **Server-side agent mutation**: `withMainDocEditorSession()` in `app/api/agent/editorAgentUtil.ts:287-388` connects backend code to a live Yjs doc, exposes a headless Lexical editor, applies mutations, and waits for sync to propagate. Production-grade and battle-tested on Posts.
- **Document namespace**: `post-{postId}` for main contents. ResearchDocuments will use `research-doc-{docId}`. The `YjsDocuments` row also carries an explicit `collectionName` column (see schema change above), and the JWT payload carries `collectionName` so the Hocuspocus server doesn't re-parse the documentName.

### Generalizing the dispatch points

Adding a second collection forces a number of Posts-coupled paths to take a `(collectionName, documentId)` tuple instead of a bare `postId`. The audit turned up more touch points than initially scoped; the full T1 list:

- **`HocuspocusAuth` GraphQL resolver** (`postResolvers.ts:423-453`) — generalize to `(collectionName, documentId, authPayload)`. Add `collectionName` to the JWT payload. Lower-risk alternative: ship a parallel `ResearchDocumentHocuspocusAuth` resolver. Generalization is the long-term move.
- **Hocuspocus server-side JWT decoder** (`fly/hocuspocusServer/src/auth.ts:14`) — coordinate with the resolver change. Backwards-compat: existing Posts JWTs in flight at deploy lack `collectionName`; decoder must default missing values to `'Posts'` during the rollout window.
- **`withMainDocEditorSession()`** (`editorAgentUtil.ts:287-388`) — the docname format is hardcoded `post-${postId}` at line 309 (the `name` arg passed to `HocuspocusProvider`). The function signature change must propagate through the Hocuspocus connection string. The editor-type check is *not* in this function — it lives in `isSupportedEditorType()` (`editorAgentUtil.ts:134-150`), called by `authorizeAgentDraftAccess()` (`editorAgentUtil.ts:210-243`) before this function runs.
- **`isSupportedEditorType()`** (`editorAgentUtil.ts:134-150`) — currently calls `getLatestRev(postId, "contents")` (which itself is collection-blind, see Revisions note below). This is the actual editor-type-check refactor target.
- **Hocuspocus callbacks** (`packages/lesswrong/server/hocuspocus/hocuspocusCallbacks.ts`) — far more Posts-coupled than initially scoped. Touch points include `documentNameToPostId()` (line 20), `documentNameToDocumentId()` (line 34), `saveLexicalDocumentRevision()` hardcoding `collectionName: 'Posts'` (line 134), and `pushRevisionToLexicalCollab()` building literal `post-${postId}` strings (line 259). All need to switch on `collectionName`.
- **Hocuspocus admin reset endpoint** — `pushRevisionToLexicalCollab` builds `post-${postId}` for revision restore. Same generalization.

Each is a small change individually, but the cluster is load-bearing for the existing Posts code path. Changes need careful review even though they don't change Posts behavior.

### Bootstrap requirement for new ResearchDocuments

`withMainDocEditorSession()` throws if the root has zero children after Hocuspocus sync (`editorAgentUtil.ts:372-379`). For Posts this is fine because a YjsDocuments row already exists by the time an agent tries to edit. For brand-new ResearchDocuments, no YjsDocuments row exists yet, and the function would error.

`createResearchDocument` mutation must seed an empty-but-non-empty Lexical state (a single empty paragraph node) into Hocuspocus before returning, so subsequent agent edits succeed on first contact. T1 owns the bootstrap helper.

### New editor primitives

- **ResearchAnchor** — *not* a new node class. Reuse Lexical's `MarkNode` from `@lexical/mark` (already used by the Posts comment system). Wrap selections via `$wrapSelectionInMarkNode(selection, isBackward, anchorId)` (see usage in `packages/lesswrong/components/lexical/plugins/CommentPlugin/index.tsx:1176`). Maintain a `ResearchAnchorMap: Map<string, Set<NodeKey>>` mirroring the existing `MarkNodeMap` pattern (defined in `packages/lesswrong/components/editor/lexicalPlugins/suggestions/MarkNodesContext.tsx`).
- **Anchor lifecycle**: `MarkNode.deleteID()` only splices the IDs array — it does not auto-unwrap. Callers (e.g., `CommentPlugin/index.tsx:1147-1150`) must explicitly invoke `$unwrapMarkNode(node)` when `getIDs().length === 0`. T4 mirrors this pattern: a small Lexical update listener that watches for ResearchAnchor marks emptying out and unwraps them. Text-deletion-driven removal is a separate mechanism (`MarkNode.canBeEmpty() === false`).
- **`AgentBlock`** decorator node — block-level node carrying a `conversationId`. Renders live conversation output (streaming or persisted) by reading `ResearchConversationEvents`. Visible state is derived; nothing about the conversation lives in the document JSON beyond the id.

Block-level AgentBlocks have stable block-ids; we treat the block-id as the anchorId for the conversation's `entrypoint`. Range-selection queries use a `MarkNode`-wrapped anchor id. Same namespace, same lookup path.

### Agent edits

Agent writes go through the same Yjs path as user writes, via the existing infrastructure:
1. Sandbox calls our HTTP API (`POST /documents/:id/edits`).
2. Endpoint dispatches via `withMainDocEditorSession()`: opens Hocuspocus connection, mutates Lexical state, waits for sync.
3. All connected clients (including the user typing in the same doc) see the update propagate through Hocuspocus.

The CRDT handles merging; the user is never blocked. Provenance: each agent-inserted block carries `producedByConversationId` as a Lexical node attribute, so we can render it differently and let the user accept/revert.

**Constraint:** `withMainDocEditorSession()` has a 15s sync timeout (`editorAgentUtil.ts:22`). Agent edit ops should be small/atomic; large edits should be decomposed.

## Sandbox lifecycle and conversation execution

`@/server/research/sandboxManager.ts`:

- `getOrCreateSandbox(userId, projectId)` returns an `active` Vercel Sandbox, provisioning one if needed. Sandbox env carries the user's `CLAUDE_CODE_OAUTH_TOKEN` and a short-lived signed token authenticating callbacks to our app. A small Node process inside the sandbox is the **supervisor** — it owns the SSE server, spawns Claude Code subprocesses, and POSTs events to our backend.
- `bootstrapConversation(sandbox, conversation)` — if the conversation has prior `ResearchConversationEvents`, write a synthesized JSONL into Claude Code's conversation directory before invoking `claude --resume <claudeSessionId>`. This is what makes "continue this conversation next week" work.
- `dispatchTurn(conversation, prompt, references)` — invokes `claude -p --output-format stream-json [--resume ...]` inside the supervisor, which streams events to (a) our backend for persistence and (b) the SSE endpoint for any connected clients. Sets `ResearchSandboxSessions.currentConversationId` for the duration.

`@/server/research/sandboxSupervisor/` — the Node process that runs inside the sandbox. Small, no business logic. Two responsibilities: spawn Claude Code, fan out its event stream.

## Streaming

Per-sandbox SSE, client connects directly. Persistence is a side-channel.

```
                        +-----------------------+
                        |   Vercel Sandbox      |
                        |  +-----------------+  |
                        |  | claude -p ...   |  |
                        |  +--------+--------+  |
                        |           |jsonl      |
                        |           v           |
client  <--SSE direct---+--+ supervisor +-----+ |
                        |  |  (Node)    |     | |
                        |  +-----+------+     | |
                        +--------+------------+ |
                                 |              |
                          POST /api/research/   |
                            conversations/:id/  |
                            events              |
                                 |              |
                                 v              |
                          ForumMagnum backend   |
                          -> ResearchConversationEvents
                          -> Yjs document edits (when agent writes to doc)
```

- The supervisor exposes `GET /sse/:conversationId` on a port routed via `sandbox.domain(port)` ([SDK ref](https://vercel.com/docs/vercel-sandbox/sdk-reference)) — Vercel-managed public HTTPS URL with TLS terminated for us, up to 15 ports per sandbox. The endpoint is open to the internet by default; **we enforce auth in-process** by validating an HMAC-signed bearer (or signed query param) that names `(conversationId, expiresAt)`.
- Every event is fanned out twice: SSE to subscribers, HTTPS POST to our backend (with retry/backoff). Persistence is independent of whether anyone is connected.
- Reconnect logic: client first fetches `ResearchConversationEvents` since seq N from our backend, then opens SSE with `?since=N`. The supervisor replays buffered events from N then tails live.
- If the sandbox is gone (reaped or hit the lifetime cap), the conversation is idle; the client just reads from `ResearchConversationEvents`. Resuming spins a new sandbox — and **a new public URL** — so the client always rediscovers the current SSE endpoint via our backend before connecting.

### Sandbox lifetime constraints (verified against Vercel docs)

Vercel Sandbox sessions cap at **5 hours** on Pro/Enterprise (45 min on Hobby), default 5 min, extendable up to the cap via `sandbox.extendTimeout()` ([pricing](https://vercel.com/docs/vercel-sandbox/pricing)). Persistent sandboxes (beta) auto-snapshot on stop and resume on next call, but each *session* is still 5h-capped, and the public URL is per-session.

Implications:
- A single Claude Code turn rarely runs that long; one-shot `claude -p` calls fit comfortably.
- Long-form research (the "20-hour job" goal from the original brainstorm) must be decomposed into multiple turns / multiple sandbox sessions with our event store as the continuity layer. Our existing JSONL-resume design already handles this — the only addition is an explicit "extend or roll" policy when a sandbox is approaching its cap mid-turn.
- Long-lived inbound SSE behavior at Vercel's ingress is **not documented**. Validate empirically before relying on multi-hour SSE holds; client reconnect-with-`?since=N` already covers transient drops.

**Pricing sanity check:** $0.128/Active-CPU-hour (CPU-busy only — idle SSE doesn't count), $0.0212/GB-mem-hour wall-clock, $0.15/GB egress, $0.60/M creations. One 2-vCPU/4GB sandbox idling an hour ≈ ~$0.085 memory + minimal CPU. Per-active-user-project running continuously is plausibly affordable at low concurrency.

## Agent-facing HTTP API

Mounted under `app/api/research/agent/*`. Most of the heavy lifting (auth dispatch pattern, Lexical edit ops, Yjs sync, error/analytics shapes) is adapted from the existing `app/api/agent/*` Posts API. The new endpoints differ in three ways: a different auth model (signed sandbox-callback token, not link-sharing key), a different document/collection target (`ResearchDocuments` not `Posts`), and additional non-document operations (conversations, sub-spawns).

### Auth

Signed bearer token issued to the sandbox at provision time, scoped to `(userId, projectId, expiresAt)` and HMAC-signed by our backend. Validated by an analog of `authorizeAgentDraftAccess()` (`app/api/agent/editorAgentUtil.ts:210-242`) that produces a Hocuspocus session token for the target ResearchDocument instead of a link-sharing-key token.

### Endpoints

- `GET /projects/:id/index` — handles for documents and conversations in the project (`{id, title, kind, lastActivityAt, entrypoint}`). The agent fetches detail on demand.
- `GET /documents/:id` — current Lexical content as markdown.
- `POST /documents/:id/replaceText`, `/insertBlock`, `/deleteBlock`, `/insertLLMBlock` — direct ports of the existing Posts agent endpoints, with auth + collection swapped. Each dispatches via `withMainDocEditorSession()` to apply through the live Yjs doc.
- `POST /conversations/:id/events` — the supervisor's persistence callback for streamed Claude Code events.
- `GET /conversations/:id/events` — the conversation log for cross-referencing other conversations.
- `POST /conversations` — spawn a sibling conversation as a sub-agent (the "list as primitive" pattern). Body carries `entrypoint: {kind: 'subagent', parentConversationId}` and the initial prompt. Returns the new conversationId; supervisor takes care of dispatch.

### In-sandbox CLI

The supervisor inside the sandbox provides Claude Code with a tiny CLI wrapper (`research-tool fetch-doc <id>`, `research-tool edit-doc <id> ...`, `research-tool spawn <prompt>`) that wraps these endpoints with the auth token already loaded. Keeps response shape under our control; no MCP in the loop.

## GraphQL surface (user-facing)

Default resolvers for the five collections. Custom mutations:

- `createResearchProject`
- `createResearchDocument`
- `fireResearchConversation(input)` — creates a conversation row + first user turn, dispatches. Input includes `entrypoint`, so chat-panel, AgentBlock, modal-query, and fork entrypoints all flow through the same mutation with different discriminator values.
- `continueResearchConversation(conversationId, prompt)` — adds a turn to an existing conversation; spins sandbox if needed.
- `cancelResearchConversation(conversationId)` — signals supervisor to abort the current turn.

Custom resolvers (`@/server/resolvers/researchResolvers.ts`):

- `researchProjectActivity(projectId, since?)` — flat feed of recent conversation events + document edits, used by whatever activity-surface UI we settle on.
- `researchConversationTranscript(conversationId)` — paginated event stream for chat/inline rendering.

Views in each collection's `views.ts` follow standard ForumMagnum patterns. For `ResearchConversations` specifically, the sidebar wants `byProjectAndEntrypointKind` (e.g., to list only `chat`-kind conversations in the dedicated chat sidebar), and `byProject` ordered by `lastActivityAt` for an "all conversations" view.

## Frontend shape

Routes under `app/research/`:

- `app/research/page.tsx` — project list (server component).
- `app/research/projects/[projectId]/page.tsx` — workspace shell.

Workspace shell (`@/components/research/ResearchWorkspace.tsx`, `"use client"`):

- `ProjectSidebar` — documents + chat-kind conversations in the project. Other conversation kinds (AgentBlock, modal-query, subagent) are accessed via their host context, not the sidebar — but they're still rows in the same table, so cross-cutting views like an "all activity" feed or "conversations referencing this anchor" query are cheap.
- `DocumentPane` — collaborative Lexical editor with research nodes. Selection toolbar offers "Fire as query" (creates a `document`-kind conversation). Slash menu spawns block-level AgentBlocks (also `document`-kind, with the block id as the anchor).
- `QueryModal` — invokable from anywhere; lets the user attach explicit references and fire a `query_modal`-kind conversation.
- `ChatPane` (toggleable) — shows a single chat-kind conversation; `@`-mention picker for referencing documents/anchors.
- `ActivityPane` — view over `researchProjectActivity`. Form factor (timeline/bullets/list) deliberately not committed yet; the data shape supports any of them.

The document is the primary container. `ChatPane`, `QueryModal`, and `ActivityPane` are lenses over the same conversation graph.

## End-to-end trace

User selects a paragraph in `ResearchDocuments.X`, picks "Fire as query," types "find counterexamples":

1. Editor wraps the selection in a `ResearchAnchor` (anchorId `a_abc`).
2. Editor inserts an `AgentBlock` decorator node below the paragraph with a placeholder.
3. Client calls `fireResearchConversation({projectId, entrypoint:{kind:'document', documentId:X, anchorId:'a_abc'}, prompt:"find counterexamples"})`.
4. Backend creates `ResearchConversations` row, persists the user turn as event seq 0, returns conversationId. Editor updates the AgentBlock to point at it. Backend kicks off `dispatchTurn` via `backgroundTask`.
5. `sandboxManager` ensures the project's sandbox is up. Supervisor sets `ResearchSandboxSessions.currentConversationId`, spawns `claude -p` (or `--resume` if the conversation had prior turns).
6. Claude Code runs; supervisor streams JSON events. Each event: SSE-pushed to the connected client; POSTed to backend → `ResearchConversationEvents` row.
7. Client renders streaming tokens inside the AgentBlock. If Claude Code calls `research-tool edit-doc X --insert-block ...`, the edit goes through our HTTP API → Yjs update → all connected clients (including the user typing in the same doc) see the new block appear.
8. Claude Code finishes. Supervisor emits a final event, clears `currentConversationId`, bumps `lastActivityAt`. Sandbox stays warm for the idle timeout in case the user continues.

User comes back three days later, opens the conversation, types "ok now find me prior art." Sandbox is gone; `continueResearchConversation` provisions a new one, supervisor synthesizes a JSONL from `ResearchConversationEvents`, runs `claude --resume <claudeSessionId>`, streaming resumes.

## What's deferred (and why)

- **Per-user billing / quotas** — internal-only with BYO setup tokens; not load-bearing for PMF.
- **Cross-project entity references** — single-project scope is enough to start.
- **Push-based notifications across the workspace** (e.g., toast when a background conversation in another doc completes) — adding to the backend feed is straightforward when needed; not blocking.
- **Filesystem inside the sandbox as a durable artifact store** — events table is the source of truth; sandbox FS is scratch.
- **Project-level cost dashboard** — fields to derive it (event-level token counts) flow through naturally; building the view can wait.

## Pre-flight notes (prototype context)

This is a dev-DB prototype expected to take ~30 min wall-clock time with parallel agents, so most "de-risking" work is overkill. Two things still worth pinning before launch:

### Lifecycle decisions per `entrypoint.kind`

`entrypoint.kind` is a discriminator on creation metadata, but runtime behavior per kind needs consistent answers across teammates. Pinning the v1 defaults:

- **Sandbox provisioning timing.** Lazy: a sandbox is only provisioned on first turn dispatch, never on entity creation. Closing a chat pane / blurring an AgentBlock does not affect the sandbox.
- **Conversation persistence on host deletion.** If an AgentBlock is deleted from a document, the `ResearchConversations` row persists (events are still queryable, conversation can be promoted to a top-level chat by a follow-up action). Same for fork-parent deletion. ResearchDocuments/projects don't cascade-delete conversations either; a separate cleanup story handles that later.
- **Cancel semantics.** Cancelling a parent conversation cancels in-flight children. Idempotent — cancelling an already-`idle` conversation is a no-op.
- **Fork semantics.** A `fork` conversation is *referential*: its events table starts at seq 0 with a synthetic "forked from {parentId} at seq {n}" system event, and `claude --resume` is bootstrapped by synthesizing a JSONL from the parent's events 0..n. Events themselves aren't copied.
- **Subagent visibility.** Sub-agent conversations are listed in the sidebar's "all" view but hidden from the chat-only view, since they have a chat-shaped UI but aren't user-initiated.

### Migration: defaults are sufficient

T1 adds `collectionName` to `YjsDocuments` (and the dispatch-point refactors) inline with their other work; existing Posts code paths get `collectionName = 'Posts'` defaulted everywhere a value is needed. No multi-PR ceremony required.

### Other concerns surfaced (lower priority but worth recording)

- **Sandbox-callback token scope.** Per-`(userId, projectId)` is too coarse — a compromised sandbox could edit any document in the project. Recommendation: scope per-conversation when dispatching a turn, with short expiry (≤30 min) refreshable via a separate endpoint that doesn't itself need the same token.
- **Sub-agent fan-out governor.** `POST /conversations` lets agents spawn siblings with no cap on depth or breadth. Add hard caps at the API layer from day one (e.g., `parentChainDepth ≤ 2`, `concurrentChildren ≤ 3`), plus a per-project concurrent-active-conversations ceiling and a daily cost ceiling that hard-stops dispatch.
- **Concurrent-conversations cap per sandbox.** Start at 5–10; tune empirically. Supervisor reports resource pressure via heartbeat; sandbox manager spins up additional sandboxes when a sandbox is full.
- **Edit serialization.** If T2/T3 see opaque 500s from concurrent agent edits each opening their own Hocuspocus session, the fix is a per-`(collectionName, documentId)` warm-session serializer in front of `withMainDocEditorSession()`. Defensive optimization; defer until we see the symptom.
- **Client-side IndexedDB cache keying.** `IndexeddbPersistence` (`collaboration.ts:13, 162, 203`) caches Yjs state locally keyed by docName. Our `research-doc-{id}` prefix keeps this safe by construction; worth noting if anyone ever proposes unifying the docName scheme later.
- **`HocuspocusProvider` global cache** (`collaboration.ts:161-162`) is keyed by docName too. Same safety logic.

## Open questions to nail before coding

1. **Long-lived SSE at Vercel's ingress.** Direct-to-sandbox is supported; what's undocumented is how long a single SSE connection can stay open at the proxy. Empirically validate held connections of 30+ min before trusting them; client reconnect logic should be in place from day one regardless.
2. **Behavior at the 5h cap mid-turn.** What's our policy if a Claude Code turn is still running when the sandbox is about to expire? `extendTimeout` to the cap, then graceful interrupt + persist + spawn-new-sandbox + resume? Worth designing the explicit handoff before we hit it in practice.
3. **Hocuspocus auth for ResearchDocuments.** The existing `HocuspocusAuth` resolver is hard-coded to `(postId, linkSharingKey)`. We need either a parallel resolver for ResearchDocuments or a generalized one taking `(collectionName, documentId, authPayload)`. Generalization is probably the right move long-term but adds risk to the Posts path; a parallel resolver is the lower-risk start.
4. **Token-scoped agent API auth.** The signed callback token issued to the sandbox needs a clear scope/expiry/rotation story. Probably HMAC over `(sandboxId, projectId, expiresAt)` with a short window and refresh from the supervisor. Distinct from the Posts API's link-sharing-key model.
5. **Title generation.** One-shot Claude call on conversation creation? User-only? Empty-then-prompt-on-second-turn? Cheap enough to defer; flag to confirm.
6. **Entrypoint kinds beyond v1.** The current set covers what's been discussed. As new entrypoints emerge (e.g., a "fire from a notebook cell," "fire from a citation hover"), they extend the discriminator. Worth keeping the kinds list in code reviewable as a single source — probably a Zod schema in `@/lib/collections/researchConversations/entrypoint.ts` — so it doesn't drift.
7. **15s sync timeout for agent edits.** `withMainDocEditorSession()` enforces a 15-second sync ceiling. Fine for atomic ops (insert block, replace anchor span). Larger transformations (e.g., agent restructures a whole document) will need decomposition. Worth a short pass on Claude Code prompt guidance to avoid emitting one giant edit op.
