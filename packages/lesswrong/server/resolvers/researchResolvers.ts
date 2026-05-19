import gql from "graphql-tag";
import { randomId } from "@/lib/random";
import { type Entrypoint } from "@/lib/collections/researchConversations/newSchema";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { generateConversationTitle } from "@/server/research/titleGeneration";
import { signSupervisorToken } from "@/server/research/sandbox/supervisor/auth";
import { mintSandboxCallbackToken } from "../../../../app/api/research/agent/researchAgentAuth";
import {
  getOrCreateSandbox,
  getRunningSandbox,
  sandboxNameForConversation,
  supervisorUrlForSandbox,
  type ProvisionedSandbox,
} from "@/server/research/sandbox/sandboxManager";
import { isPlainRecord } from "@/components/research/conversationEventFormat";
import {
  buildSystemReminderWrap,
  deriveLastInjectedActiveDocumentId,
} from "@/server/research/systemReminder";

/**
 * GraphQL custom mutations + resolvers for research conversations.
 *
 * The user-facing surface (chat panel, AgentBlock, fork) all routes through
 * `fireResearchConversation` with different `entrypoint` discriminator values.
 * Once a conversation exists, `continueResearchConversation` adds turns and
 * `cancelResearchConversation` aborts the in-flight one.
 */

function buildEntrypoint(kind: "document" | "chat", activeDocumentId: string): Entrypoint {
  return kind === "document"
    ? { kind: "document", documentId: activeDocumentId }
    : { kind: "chat", activeDocumentId };
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

const SUPERVISOR_TOKEN_TTL_MS = 30 * 60 * 1000;

/** Fields needed to reach a conversation's supervisor and sign a bearer for it. */
type SupervisorTarget = Pick<
  ProvisionedSandbox,
  "conversationId" | "sandboxName" | "supervisorUrl" | "supervisorSecret"
>;

/** Sign a short-lived bearer the supervisor accepts for /dispatch and /cancel. */
function signSupervisorBearer(target: SupervisorTarget): string {
  return signSupervisorToken(
    {
      sandboxId: target.sandboxName,
      expiresAt: Date.now() + SUPERVISOR_TOKEN_TTL_MS,
      scope: target.conversationId,
    },
    target.supervisorSecret,
  );
}

/**
 * POSTs to the supervisor's /dispatch endpoint with a fresh signed bearer.
 *
 * The supervisor accepts the turn and starts Claude Code asynchronously,
 * streaming events back via its POST callbacks — so this POST returns quickly
 * even though the turn itself runs for a while. A non-ok response is a real
 * dispatch failure surfaced to the caller; there is no row to retire, since a
 * stopped or unreachable sandbox is simply resumed by the next turn.
 */
async function dispatchTurnViaSupervisor(args: {
  provisioned: ProvisionedSandbox;
  conversationId: string;
  projectId: string;
  userId: string;
  prompt: string;
  claudeSessionId?: string;
  bootstrapJsonl?: string[];
}): Promise<void> {
  const { provisioned } = args;
  const bearer = signSupervisorBearer(provisioned);
  // Agent-scoped sandbox-callback bearer for the in-sandbox `research-tool`
  // CLI — scoped to *this* conversationId. The supervisor's own
  // supervisor-scoped CALLBACK_TOKEN can't authorize the document/conversation
  // endpoints; this one can. Minted here so the HMAC secret stays on the backend.
  const agentBackendToken = mintSandboxCallbackToken({
    sandboxId: provisioned.sandboxName,
    conversationId: args.conversationId,
    projectId: args.projectId,
    userId: args.userId,
  });
  const response = await fetch(`${provisioned.supervisorUrl}/dispatch`, {
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
  throw new Error(
    `supervisor /dispatch failed: ${response.status}${vercelErr ? ` (${vercelErr})` : ""}`,
  );
}

async function cancelTurnViaSupervisor(target: SupervisorTarget): Promise<void> {
  const bearer = signSupervisorBearer(target);
  const response = await fetch(
    `${target.supervisorUrl}/cancel/${encodeURIComponent(target.conversationId)}`,
    { method: "POST", headers: { "Authorization": `Bearer ${bearer}` } },
  );
  if (!response.ok && response.status !== 404) {
    // eslint-disable-next-line no-console
    console.error(`[research] supervisor /cancel failed: ${response.status}`);
  }
}

/**
 * Build the user-turn text to persist + dispatch. On the first turn, or
 * whenever the user's currently-focused document differs from the one named
 * in the most recently injected `<system-reminder>` block, wrap the prompt
 * with a fresh reminder. Otherwise return the raw prompt.
 */
async function prepareTurnPrompt(args: {
  rawPrompt: string;
  projectId: string;
  activeDocumentId: string;
  entrypoint: Entrypoint;
  priorEvents: DbResearchConversationEvent[];
  context: ResolverContext;
}): Promise<string> {
  const { rawPrompt, projectId, activeDocumentId, entrypoint, priorEvents, context } = args;

  const lastInjected = deriveLastInjectedActiveDocumentId(priorEvents);
  if (lastInjected === activeDocumentId) return rawPrompt;

  const needsOrigin = entrypoint.kind === "document" && entrypoint.documentId !== activeDocumentId;
  const [activeDoc, originDoc] = await Promise.all([
    context.ResearchDocuments.findOne({ _id: activeDocumentId, projectId }),
    needsOrigin
      ? context.ResearchDocuments.findOne({ _id: entrypoint.documentId, projectId })
      : Promise.resolve(null),
  ]);
  if (!activeDoc) return rawPrompt;

  return buildSystemReminderWrap(
    {
      activeDocument: { id: activeDoc._id, title: activeDoc.title ?? "(untitled)" },
      originDocument: originDoc
        ? { id: originDoc._id, title: originDoc.title ?? "(untitled)" }
        : undefined,
    },
    rawPrompt,
  );
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
export function buildBootstrapJsonl(
  events: DbResearchConversationEvent[],
  claudeSessionId: string,
): string[] {
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
  enum ResearchEntrypointKind {
    document
    chat
  }

  input FireResearchConversationInput {
    projectId: String!
    kind: ResearchEntrypointKind!
    activeDocumentId: String!
    prompt: String!
  }

  type ResearchConversationOutput {
    conversationId: String!
    data: ResearchConversation
  }

  extend type Mutation {
    fireResearchConversation(input: FireResearchConversationInput!): ResearchConversationOutput
    continueResearchConversation(conversationId: String!, prompt: String!, activeDocumentId: String!): ResearchConversationOutput
    cancelResearchConversation(conversationId: String!): ResearchConversationOutput
  }

  extend type Query {
    researchConversationTranscript(conversationId: String!, since: Int, limit: Int): [ResearchConversationEvent!]!
  }
`;

export const researchResolversMutations = {
  async fireResearchConversation(
    _root: void,
    args: { input: { projectId: string; kind: "document" | "chat"; activeDocumentId: string; prompt: string } },
    context: ResolverContext,
  ) {
    const { currentUser, ResearchConversations } = context;
    if (!currentUser) throw new Error("Not logged in");
    const { projectId, kind, activeDocumentId, prompt } = args.input;
    if (!prompt) throw new Error("prompt required");

    await assertProjectAccess(projectId, context);
    const entrypoint = buildEntrypoint(kind, activeDocumentId);

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

    const turnPrompt = await prepareTurnPrompt({
      rawPrompt: prompt,
      projectId,
      activeDocumentId,
      entrypoint,
      priorEvents: [],
      context,
    });
    await appendUserTurn(_id, turnPrompt, context);

    // A provisioning failure throws from here; the conversation row and user
    // turn are already persisted, so the client can retry the turn with
    // `continueResearchConversation`.
    await dispatchToSandbox({
      context,
      conversationId: _id,
      projectId,
      userId: currentUser._id,
      prompt: turnPrompt,
    });

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
    args: { conversationId: string; prompt: string; activeDocumentId: string },
    context: ResolverContext,
  ) {
    const { ResearchConversations } = context;
    const conv = await loadConversationOrThrow(args.conversationId, context);

    // Fetch history once: used for both the Claude `--resume` bootstrap
    // (when a session id exists) and the system-reminder cadence check.
    // Read before appending the new user turn so both consumers see
    // history-up-to-now.
    const priorEvents = await context.ResearchConversationEvents.find(
      { conversationId: conv._id },
      { sort: { seq: 1 } },
    ).fetch();

    const turnPrompt = await prepareTurnPrompt({
      rawPrompt: args.prompt,
      projectId: conv.projectId,
      activeDocumentId: args.activeDocumentId,
      entrypoint: conv.entrypoint as Entrypoint,
      priorEvents,
      context,
    });

    await appendUserTurn(conv._id, turnPrompt, context);
    await ResearchConversations.rawUpdateOne({ _id: conv._id }, { $set: { lastActivityAt: new Date() } });

    await dispatchToSandbox({
      context,
      conversationId: conv._id,
      projectId: conv.projectId,
      userId: conv.userId,
      prompt: turnPrompt,
      resumeContext: conv.claudeSessionId
        ? { claudeSessionId: conv.claudeSessionId, priorEvents }
        : undefined,
    });

    return { conversationId: conv._id, data: { _id: conv._id } };
  },

  async cancelResearchConversation(_root: void, args: { conversationId: string }, context: ResolverContext) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    // Only a running sandbox can have a turn to cancel; never resume one to do it.
    const [sandbox, row] = await Promise.all([
      getRunningSandbox(conv._id),
      context.ResearchSandboxSessions.findOne({ conversationId: conv._id }),
    ]);
    if (sandbox && row) {
      try {
        await cancelTurnViaSupervisor({
          conversationId: conv._id,
          sandboxName: sandboxNameForConversation(conv._id),
          supervisorUrl: supervisorUrlForSandbox(sandbox),
          supervisorSecret: row.supervisorSecret,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[research] cancel-via-supervisor failed", err);
      }
    }
    return { conversationId: conv._id, data: { _id: conv._id } };
  },
};

/**
 * Provision (or resume) the conversation's persistent sandbox and dispatch one
 * turn to its supervisor. `resumeContext` is supplied when continuing an
 * existing conversation; it lets a rebuilt sandbox have its Claude session
 * reconstructed.
 */
async function dispatchToSandbox(args: {
  context: ResolverContext;
  conversationId: string;
  projectId: string;
  userId: string;
  prompt: string;
  resumeContext?: { claudeSessionId: string; priorEvents: DbResearchConversationEvent[] };
}): Promise<void> {
  const provisioned = await getOrCreateSandbox(args.conversationId, args.context);

  // Reconstruct the Claude session only when the sandbox was freshly built (a
  // rebuild after an expired snapshot). A warm resume still has the session
  // file on disk, so `claude --resume` reads it directly.
  let bootstrapJsonl: string[] | undefined;
  if (provisioned.wasFreshlyCreated && args.resumeContext) {
    bootstrapJsonl = buildBootstrapJsonl(
      args.resumeContext.priorEvents,
      args.resumeContext.claudeSessionId,
    );
  }

  await dispatchTurnViaSupervisor({
    provisioned,
    conversationId: args.conversationId,
    projectId: args.projectId,
    userId: args.userId,
    prompt: args.prompt,
    claudeSessionId: args.resumeContext?.claudeSessionId,
    bootstrapJsonl,
  });
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
