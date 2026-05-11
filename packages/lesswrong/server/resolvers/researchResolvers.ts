import gql from "graphql-tag";
import { randomId } from "@/lib/random";
import { entrypointSchema, type Entrypoint } from "@/lib/collections/researchConversations/entrypoint";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { generateConversationTitle } from "@/server/research/titleGeneration";
import { signSupervisorToken } from "@/server/research/sandbox/supervisor/auth";
import { mintSandboxCallbackToken } from "../../../../app/api/research/agent/researchAgentAuth";
import {
  getOrCreateSandbox,
  type SandboxSessionRecord,
} from "@/server/research/sandbox/sandboxManager";
import { isPlainRecord } from "@/components/research/conversationEventFormat";

/**
 * GraphQL custom mutations + resolvers for research conversations.
 *
 * The "user-facing" surface (chat panel, AgentBlock, query modal, fork) all
 * routes through `fireResearchConversation` with different `entrypoint`
 * discriminator values. Once a conversation exists,
 * `continueResearchConversation` adds turns and `cancelResearchConversation`
 * aborts the in-flight one.
 *
 * Activity and transcript resolvers expose the data shapes T5 needs for the
 * sidebar/activity/chat panes.
 */

function parseEntrypoint(raw: unknown): Entrypoint {
  const result = entrypointSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid entrypoint: ${result.error.message}`);
  }
  return result.data;
}

async function assertProjectAccess(projectId: string, context: ResolverContext): Promise<void> {
  const { currentUser, ResearchProjects } = context;
  if (!currentUser) throw new Error("Not logged in");
  const project = await ResearchProjects.findOne({ _id: projectId });
  if (!project) throw new Error("Project not found");
  if (project.userId !== currentUser._id && !currentUser.isAdmin) {
    throw new Error("Forbidden");
  }
}

async function loadConversationOrThrow(conversationId: string, context: ResolverContext) {
  const { currentUser, ResearchConversations } = context;
  if (!currentUser) throw new Error("Not logged in");
  const conv = await ResearchConversations.findOne({ _id: conversationId });
  if (!conv) throw new Error("Conversation not found");
  if (conv.userId !== currentUser._id && !currentUser.isAdmin) {
    throw new Error("Forbidden");
  }
  return conv;
}

/**
 * POSTs to the supervisor's /dispatch endpoint with a fresh signed bearer.
 *
 * We don't await the supervisor's response on the GraphQL hot path — by
 * design the dispatch is a fire-and-forget, with persistence happening via
 * the supervisor's POST callbacks back to our backend. Wrapped in
 * `backgroundTask` by the caller so the serverless host doesn't tear down
 * before the dispatch completes.
 */
async function dispatchTurnViaSupervisor(args: {
  context: ResolverContext;
  record: SandboxSessionRecord;
  conversationId: string;
  projectId: string;
  userId: string;
  prompt: string;
  claudeSessionId?: string;
  bootstrapJsonl?: string[];
}): Promise<void> {
  const tokenExpiresAt = Date.now() + 30 * 60 * 1000;
  const bearer = signSupervisorToken(
    { sandboxId: args.record.vercelSandboxId, expiresAt: tokenExpiresAt, scope: args.conversationId },
    args.record.supervisorSecret,
  );
  // Agent-scoped sandbox-callback bearer for the in-sandbox `research-tool`
  // CLI. The supervisor's own `CALLBACK_TOKEN` is supervisor-scoped (used
  // for /events and /heartbeat), but the document/conversation endpoints
  // require an agent scope tied to *this* conversationId — minted here so
  // the HMAC secret stays on the backend.
  const agentBackendToken = mintSandboxCallbackToken({
    sandboxId: args.record.vercelSandboxId,
    conversationId: args.conversationId,
    projectId: args.projectId,
    userId: args.userId,
  });
  const response = await fetch(`${args.record.endpointUrl}/dispatch`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${bearer}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversationId: args.conversationId,
      prompt: args.prompt,
      claudeSessionId: args.claudeSessionId,
      bootstrapJsonl: args.bootstrapJsonl,
      agentBackendToken,
    }),
  });
  if (response.ok) return;

  const text = await response.text().catch(() => "");
  const vercelErr = response.headers.get("x-vercel-error");
  // eslint-disable-next-line no-console
  console.error(
    `[research] supervisor /dispatch failed: ${response.status}${vercelErr ? ` (${vercelErr})` : ""} ${text}`,
  );

  // Vercel proxy errors (SANDBOX_STOPPED, SANDBOX_NOT_LISTENING, etc.) mean the
  // sandbox is unreachable, not just that the supervisor said no. Retire the row
  // so `getOrCreateSandbox` re-provisions on the next request and `stream-info`
  // stops handing the dead URL to the page. The supervisor's own non-ok
  // responses (400/401/403/409) don't carry this header and leave the row alone.
  if (vercelErr) {
    await retireSandboxSession(args.context, args.record._id, vercelErr);
  }

  throw new Error(
    `supervisor /dispatch failed: ${response.status}${vercelErr ? ` (${vercelErr})` : ""}`,
  );
}

async function retireSandboxSession(
  context: ResolverContext,
  recordId: string,
  reason: string,
): Promise<void> {
  // eslint-disable-next-line no-console
  console.warn(`[research] retiring sandbox session ${recordId}: ${reason}`);
  await context.ResearchSandboxSessions.rawUpdateOne(
    { _id: recordId, status: { $ne: "stopped" } },
    { $set: { status: "stopped" } },
  ).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`[research] retire failed for ${recordId}:`, err);
  });
}

async function cancelTurnViaSupervisor(
  record: Pick<SandboxSessionRecord, "vercelSandboxId" | "endpointUrl" | "supervisorSecret">,
  conversationId: string,
): Promise<void> {
  const tokenExpiresAt = Date.now() + 30 * 60 * 1000;
  const bearer = signSupervisorToken(
    { sandboxId: record.vercelSandboxId, expiresAt: tokenExpiresAt, scope: conversationId },
    record.supervisorSecret,
  );
  const response = await fetch(`${record.endpointUrl}/cancel/${encodeURIComponent(conversationId)}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${bearer}` },
  });
  if (!response.ok && response.status !== 404) {
    // eslint-disable-next-line no-console
    console.error(`[research] supervisor /cancel failed: ${response.status}`);
  }
}

async function appendUserTurn(
  conversationId: string,
  prompt: string,
  context: ResolverContext,
): Promise<number> {
  const result = await context.repos.researchConversationEvents.persistEvent(
    conversationId,
    {
      claudeMessageUuid: null,
      kind: "user",
      payload: { type: "user", text: prompt },
    },
  );
  return result.seq;
}

/**
 * Reconstruct a Claude Code session JSONL for `--resume`. Required when
 * resuming a conversation in a fresh sandbox: the original session file
 * lives only in the sandbox that wrote it. We translate (a) backend
 * `appendUserTurn` events to Claude's user envelope, and (b) stream-json
 * events to the on-disk session-jsonl shape (rename `session_id`, add
 * `parentUuid` chain + `timestamp` + `userType`/`entrypoint`/`cwd`).
 * Drops `system`/`result`/`error` — those don't appear in real session files.
 */
export async function buildBootstrapJsonl(
  conversationId: string,
  claudeSessionId: string,
  context: ResolverContext,
): Promise<string[]> {
  const events = await context.repos.researchConversationEvents.getEventsForConversation(
    conversationId,
  );
  // Track chain heads per group: mainline events under MAINLINE_GROUP_KEY, and
  // each sub-agent's events keyed by the parent Task's tool_use id. Without
  // this split, a sidechain event would chain to whatever mainline event
  // happened to come before it in seq order, breaking Claude Code's chain
  // walk when it follows `parentUuid` within a sub-agent.
  const chainHeads = new Map<string, string | null>();
  const lines: string[] = [];
  for (const event of events) {
    if (!isPlainRecord(event.payload)) continue;
    const groupKey = chainGroupOf(event.payload);
    const prevUuid = chainHeads.get(groupKey) ?? null;
    const result = toClaudeSessionLine(event, claudeSessionId, prevUuid);
    if (!result) continue;
    lines.push(JSON.stringify(result.line));
    chainHeads.set(groupKey, result.uuid);
  }
  return lines;
}

const SANDBOX_CWD = "/vercel/sandbox";
const SESSION_JSONL_DROPPED_TYPES = new Set(["system", "result", "error"]);
const MAINLINE_GROUP_KEY = "__mainline__";

/**
 * Group an event into a chain bucket: mainline if its `parent_tool_use_id` is
 * absent/null, otherwise into the sub-agent chain rooted at that tool_use id.
 * Stream-json's `parent_tool_use_id` is set by Claude Code on every event a
 * spawned sub-agent (Task tool) emits, so it doubles as the sidechain marker.
 */
function chainGroupOf(payload: Record<string, unknown>): string {
  const ptu = payload.parent_tool_use_id;
  return typeof ptu === "string" ? ptu : MAINLINE_GROUP_KEY;
}

function toClaudeSessionLine(
  event: DbResearchConversationEvent,
  claudeSessionId: string,
  prevUuid: string | null,
): { line: unknown; uuid: string } | null {
  const payload = event.payload;
  if (!isPlainRecord(payload)) return null;
  const type = payload.type;
  if (typeof type !== "string") return null;
  if (SESSION_JSONL_DROPPED_TYPES.has(type)) return null;

  const timestamp = event.createdAt instanceof Date
    ? event.createdAt.toISOString()
    : String(event.createdAt);
  const isSidechain = typeof payload.parent_tool_use_id === "string";

  // Backend-shaped user turn from `appendUserTurn`: no `message`, just `text`.
  // Wrap in Claude's user envelope and stamp the on-disk metadata. These are
  // never sub-agent events (the supervisor doesn't synthesize backend user
  // turns inside sub-agents), so isSidechain is always false here.
  if (type === "user" && typeof payload.text === "string" && !("message" in payload)) {
    const uuid = event._id;
    return {
      line: {
        parentUuid: prevUuid,
        isSidechain: false,
        type: "user",
        message: { role: "user", content: payload.text },
        uuid,
        timestamp,
        userType: "external",
        entrypoint: "cli",
        cwd: SANDBOX_CWD,
        sessionId: claudeSessionId,
      },
      uuid,
    };
  }

  // Stream-json event (user/assistant with `message` + `uuid` + `session_id`).
  // Promote to session-jsonl shape: rename `session_id` → `sessionId`, add
  // chain + envelope fields, leave the rest (model, requestId, message
  // content, parent_tool_use_id, etc.) untouched.
  if (typeof payload.uuid === "string") {
    const uuid = payload.uuid;
    const { session_id: _droppedSessionId, ...rest } = payload;
    void _droppedSessionId;
    return {
      line: {
        ...rest,
        parentUuid: prevUuid,
        isSidechain,
        timestamp,
        userType: "external",
        entrypoint: "cli",
        cwd: SANDBOX_CWD,
        sessionId: claudeSessionId,
      },
      uuid,
    };
  }

  return null;
}

export const researchResolversTypeDefs = gql`
  input FireResearchConversationInput {
    projectId: String!
    entrypoint: JSON!
    prompt: String!
  }

  type ResearchConversationOutput {
    conversationId: String!
    data: ResearchConversation
  }

  extend type Mutation {
    fireResearchConversation(input: FireResearchConversationInput!): ResearchConversationOutput
    continueResearchConversation(conversationId: String!, prompt: String!): ResearchConversationOutput
    cancelResearchConversation(conversationId: String!): ResearchConversationOutput
  }

  extend type Query {
    researchConversationTranscript(conversationId: String!, since: Int, limit: Int): [ResearchConversationEvent!]!
  }
`;

export const researchResolversMutations = {
  async fireResearchConversation(
    _root: void,
    args: { input: { projectId: string; entrypoint: unknown; prompt: string } },
    context: ResolverContext,
  ) {
    const { currentUser, ResearchConversations } = context;
    if (!currentUser) throw new Error("Not logged in");
    const { projectId, entrypoint: rawEntrypoint, prompt } = args.input;
    if (!prompt) throw new Error("prompt required");

    await assertProjectAccess(projectId, context);
    const entrypoint = parseEntrypoint(rawEntrypoint);

    const _id = randomId();
    const now = new Date();
    await ResearchConversations.rawInsert({
      _id,
      userId: currentUser._id,
      projectId,
      entrypoint,
      title: null,
      claudeSessionId: null,
      lastActivityAt: now,
      createdAt: now,
    });
    await appendUserTurn(_id, prompt, context);

    backgroundTask((async () => {
      try {
        await dispatchToSandbox({
          context,
          conversationId: _id,
          projectId,
          userId: currentUser._id,
          prompt,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[research] fireResearchConversation dispatch failed", err);
      }
    })());

    backgroundTask((async () => {
      const title = await generateConversationTitle(prompt);
      if (title) {
        await ResearchConversations.rawUpdateOne({ _id }, { $set: { title } });
      }
    })());

    return { conversationId: _id, data: { _id } };
  },

  async continueResearchConversation(
    _root: void,
    args: { conversationId: string; prompt: string },
    context: ResolverContext,
  ) {
    const { ResearchConversations } = context;
    const conv = await loadConversationOrThrow(args.conversationId, context);

    // Build the bootstrap before appending the new user turn so it
    // represents history-up-to-now; Claude Code sees the new prompt only as
    // the live `-p` argument.
    const bootstrapJsonl = conv.claudeSessionId
      ? await buildBootstrapJsonl(conv._id, conv.claudeSessionId, context)
      : undefined;

    await appendUserTurn(conv._id, args.prompt, context);
    await ResearchConversations.rawUpdateOne({ _id: conv._id }, { $set: { lastActivityAt: new Date() } });

    backgroundTask((async () => {
      try {
        await dispatchToSandbox({
          context,
          conversationId: conv._id,
          projectId: conv.projectId,
          userId: conv.userId,
          prompt: args.prompt,
          claudeSessionId: conv.claudeSessionId ?? undefined,
          bootstrapJsonl,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[research] continueResearchConversation dispatch failed", err);
      }
    })());

    return { conversationId: conv._id, data: { _id: conv._id } };
  },

  async cancelResearchConversation(_root: void, args: { conversationId: string }, context: ResolverContext) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    const sessions = await context.ResearchSandboxSessions.find(
      { userId: conv.userId, projectId: conv.projectId, status: { $in: ["active", "provisioning"] } },
      { sort: { lastUsedAt: -1 } },
    ).fetch();
    for (const s of sessions) {
      try {
        await cancelTurnViaSupervisor(s, conv._id);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[research] cancel-via-supervisor failed", err);
      }
    }
    return { conversationId: conv._id, data: { _id: conv._id } };
  },
};

async function dispatchToSandbox(args: {
  context: ResolverContext;
  conversationId: string;
  projectId: string;
  userId: string;
  prompt: string;
  claudeSessionId?: string;
  bootstrapJsonl?: string[];
}): Promise<void> {
  const { ResearchSandboxSessions } = args.context;
  const record = await getOrCreateSandbox(args.userId, args.projectId, args.context);
  // Bump the sandbox's concurrency count immediately so a near-simultaneous
  // dispatch sees the new load and can spillover instead of piling onto a
  // sandbox that's about to hit the cap. The supervisor heartbeat overwrites
  // this with the authoritative `running` count every ~10s, so any drift from
  // a failed dispatch self-corrects on the next tick.
  await ResearchSandboxSessions.rawUpdateOne(
    { _id: record._id },
    { $inc: { concurrencyCount: 1 }, $set: { lastUsedAt: new Date() } },
  );
  try {
    await dispatchTurnViaSupervisor({
      context: args.context,
      record,
      conversationId: args.conversationId,
      projectId: args.projectId,
      userId: args.userId,
      prompt: args.prompt,
      claudeSessionId: args.claudeSessionId,
      bootstrapJsonl: args.bootstrapJsonl,
    });
  } catch (err) {
    // Roll back the reserve so the cap check stops over-counting until the
    // next heartbeat arrives. The decrement is best-effort — if it fails,
    // the next heartbeat will overwrite with the authoritative count anyway.
    await ResearchSandboxSessions.rawUpdateOne(
      { _id: record._id },
      { $inc: { concurrencyCount: -1 } },
    ).catch((rollbackErr) => {
      // eslint-disable-next-line no-console
      console.error("[research] concurrencyCount rollback failed", rollbackErr);
    });
    throw err;
  }
}

export const researchResolversQueries = {
  async researchConversationTranscript(
    _root: void,
    args: { conversationId: string; since?: number | null; limit?: number | null },
    context: ResolverContext,
  ) {
    await loadConversationOrThrow(args.conversationId, context);
    const { ResearchConversationEvents } = context;
    const selector: AnyBecauseHard = { conversationId: args.conversationId };
    if (typeof args.since === "number" && args.since >= 0) selector.seq = { $gt: args.since };
    const events = await ResearchConversationEvents.find(
      selector,
      { sort: { seq: 1 }, limit: args.limit ?? 200 },
    ).fetch();
    return events;
  },
};
