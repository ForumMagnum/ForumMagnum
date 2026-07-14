import gql from "graphql-tag";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { generateConversationTitle } from "@/server/research/titleGeneration";
import { DEVAUTH_SCOPE, signSupervisorToken } from "@/server/research/sandbox/supervisor/auth";
import { mintSandboxCallbackToken } from "../../../../app/api/research/agent/researchAgentAuth";
import {
  devProxyUrlForSandbox,
  getOrCreateSandbox,
  getRunningSandbox,
  sandboxNameForConversation,
  SandboxWarmingError,
  SESSION_TIMEOUT_MS,
  stageClaudeSessionFile,
  supervisorUrlForSandbox,
  type ProvisionedSandbox,
} from "@/server/research/sandbox/sandboxManager";
import { SESSION_FILE_MISSING_REASON } from "@/server/research/sandbox/supervisor/sessionBootstrap";
import { listSandboxDirectory, SANDBOX_DEFAULT_DIR } from "@/server/research/sandbox/listSandboxDirectory";
import { readSandboxTextFile } from "@/server/research/sandbox/readSandboxTextFile";
import { getSandboxResourceStats } from "@/server/research/sandbox/sandboxResourceStats";
import { GraphQLError } from "graphql";
import { isPlainRecord } from "@/components/research/conversationEventFormat";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import {
  buildBootstrapJsonl,
  claudeSessionIdForConversation,
} from "@/server/research/sessionReconstruction";
import {
  buildSystemReminderWrap,
  deriveLastInjectedActiveDocumentId,
} from "@/server/research/systemReminder";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { createResearchDocument } from "@/server/collections/researchDocuments/mutations";
import { encryptUserSecret } from "@/server/research/userSecretsCrypto";
import { buildEnvironmentSnapshot } from "@/server/research/sandbox/saveEnvironment";
import { randomId } from "@/lib/random";
import { Snapshot } from "@vercel/sandbox";
import { isPostgresUniqueViolation } from "@/server/utils/postgresErrors";

/**
 * GraphQL custom mutations + resolvers for research conversations.
 *
 * The user-facing surface (chat panel, AgentBlock) routes through
 * `fireResearchConversation`; once a conversation exists,
 * `continueResearchConversation` adds turns and `cancelResearchConversation`
 * aborts the in-flight one.
 */

async function loadConversationOrThrow(conversationId: string, context: ResolverContext) {
  const { currentUser, ResearchConversations } = context;
  if (!userIsAdmin(currentUser)) throw new Error("Forbidden");
  const conv = await ResearchConversations.findOne({ _id: conversationId });
  if (!conv) throw new Error("Conversation not found");
  return conv;
}

const SUPERVISOR_TOKEN_TTL_MS = 30 * 60 * 1000;

/** Lifetime of a dev-preview token. Long enough not to interrupt a work session. */
const DEV_PREVIEW_TOKEN_TTL_MS = 4 * 60 * 60 * 1000;

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
 * Thrown when the supervisor rejects a dispatch because the session has
 * history but its file is not on the sandbox's disk. The dispatch path
 * reacts by staging a reconstruction and retrying.
 */
class SessionFileMissingError extends Error {
  constructor() {
    super("supervisor /dispatch rejected: session file missing");
    this.name = "SessionFileMissingError";
  }
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
  claudeSessionId: string;
  sessionHasHistory: boolean;
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
      sessionHasHistory: args.sessionHasHistory,
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
  if (response.status === 409 && text.includes(SESSION_FILE_MISSING_REASON)) {
    throw new SessionFileMissingError();
  }
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

async function answerQuestionViaSupervisor(
  target: SupervisorTarget,
  toolUseId: string,
  answers: Record<string, string>,
): Promise<{ ok: boolean; expired: boolean }> {
  const bearer = signSupervisorBearer(target);
  const response = await fetch(
    `${target.supervisorUrl}/answer/${encodeURIComponent(target.conversationId)}`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${bearer}`, "Content-Type": "application/json" },
      body: JSON.stringify({ toolUseId, answers }),
    },
  );
  if (response.ok) return { ok: true, expired: false };
  if (response.status === 409) return { ok: false, expired: true };
  const text = await response.text().catch(() => "");
  throw new Error(`supervisor /answer failed: ${response.status} ${text}`);
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
  conversationId: string;
  activeDocumentId: string;
  entrypointKind: string;
  entrypointDocumentId: string;
  priorEvents: DbResearchConversationEvent[];
  context: ResolverContext;
}): Promise<string> {
  const {
    rawPrompt,
    projectId,
    conversationId,
    activeDocumentId,
    entrypointKind,
    entrypointDocumentId,
    priorEvents,
    context,
  } = args;

  const lastInjected = deriveLastInjectedActiveDocumentId(priorEvents);
  if (lastInjected === activeDocumentId) return rawPrompt;

  const needsOrigin = entrypointKind === "document" && entrypointDocumentId !== activeDocumentId;
  const [activeDoc, originDoc] = await Promise.all([
    context.ResearchDocuments.findOne({ _id: activeDocumentId, projectId }),
    needsOrigin
      ? context.ResearchDocuments.findOne({ _id: entrypointDocumentId, projectId })
      : Promise.resolve(null),
  ]);
  if (!activeDoc) return rawPrompt;

  return buildSystemReminderWrap(
    {
      activeDocument: { id: activeDoc._id, title: activeDoc.title ?? "(untitled)" },
      conversationId,
      originDocument: originDoc
        ? { id: originDoc._id, title: originDoc.title ?? "(untitled)" }
        : undefined,
    },
    rawPrompt,
  );
}

export const researchResolversTypeDefs = gql`
  enum ResearchEntrypointKind {
    document
    chat
  }

  input FireResearchConversationInput {
    # Client-generated conversation id, used as the new row's primary key. The
    # client writes its own document-side reference (an AgentBlock for
    # /query, the chat-pane URL for the chat composer) BEFORE awaiting this
    # mutation, so a refresh mid-flight leaves the doc and the server-side
    # conversation bound to the same id.
    conversationId: String!
    projectId: String!
    kind: ResearchEntrypointKind!
    activeDocumentId: String!
    # The user's input as HTML; the server converts to markdown via the same
    # Lexical -> HTML -> Turndown pipeline that backs fetch-doc, so mentions,
    # lists, and formatting survive into the agent's conversation context.
    promptHtml: String!
    baseEnvironmentId: String
    runtime: String
  }

  type ResearchConversationOutput {
    conversationId: String!
    data: ResearchConversation
  }

  type DevPreviewUrlOutput {
    url: String!
  }

  type SetClaudeCodeOAuthTokenOutput {
    success: Boolean!
  }

  type SaveResearchEnvironmentOutput {
    data: ResearchEnvironment
  }

  type EnsureResearchScratchDocumentOutput {
    documentId: String!
  }

  type ReorderResearchDocumentsOutput {
    success: Boolean!
  }

  type RestartResearchSandboxOutput {
    running: Boolean!
  }

  type MarkResearchConversationReadOutput {
    ok: Boolean!
  }

  type AnswerResearchQuestionOutput {
    ok: Boolean!
    # True when no matching pending question was found (sandbox restarted, or
    # already answered) — the client should stop showing the prompt as actionable.
    expired: Boolean!
  }

  extend type Mutation {
    fireResearchConversation(input: FireResearchConversationInput!): ResearchConversationOutput
    continueResearchConversation(conversationId: String!, promptHtml: String!, activeDocumentId: String!): ResearchConversationOutput
    cancelResearchConversation(conversationId: String!): ResearchConversationOutput
    # Resolve a pending AskUserQuestion. answersJson is a JSON object mapping each
    # question's text to the chosen answer string (multi-select comma-joined).
    answerResearchConversationQuestion(conversationId: String!, toolUseId: String!, answersJson: String!): AnswerResearchQuestionOutput
    mintDevPreviewUrl(conversationId: String!): DevPreviewUrlOutput
    setClaudeCodeOAuthToken(token: String!): SetClaudeCodeOAuthTokenOutput
    saveResearchEnvironment(conversationId: String!, withConversation: Boolean!): SaveResearchEnvironmentOutput
    ensureResearchScratchDocument(projectId: String!): EnsureResearchScratchDocumentOutput
    reorderResearchDocuments(projectId: String!, orderedIds: [String!]!): ReorderResearchDocumentsOutput
    # Stamp the conversation read (clears the sidebar's unread indicator).
    # Takes no timestamp: the server clock is authoritative, so a skewed
    # client clock can't produce a stamp that trails lastActivityAt.
    markResearchConversationRead(conversationId: String!): MarkResearchConversationReadOutput
    # Resume a stopped sandbox without dispatching a turn or minting a preview
    # URL. Rejects with SANDBOX_WARMING while the resume is in flight.
    restartResearchSandbox(conversationId: String!): RestartResearchSandboxOutput
  }

  # Lightweight per-conversation status for the sidebar's activity/unread
  # indicators — polled, so it carries only what the indicators need.
  type ResearchConversationSidebarStatus {
    conversationId: String!
    turnActive: Boolean!
    lastActivityAt: Date
    lastReadAt: Date
  }

  type ResearchSandboxDirEntry {
    name: String!
    # "directory" | "file" | "symlink" | "other"
    kind: String!
    size: Float
  }

  type ResearchSandboxDirListing {
    # Absolute path that was listed (the workspace-relative root is "").
    path: String!
    # Null when the sandbox isn't currently running (it only lives around a
    # turn); the client shows a "start a turn to browse files" empty state.
    running: Boolean!
    entries: [ResearchSandboxDirEntry!]!
  }

  type ResearchSandboxFileContents {
    path: String!
    # False when the sandbox isn't running (viewer shows an empty state).
    running: Boolean!
    content: String!
    # content is only the leading bytes of a larger file.
    truncated: Boolean!
    # The file looks binary; content is empty and the viewer says so.
    binary: Boolean!
    # Full on-disk byte size.
    size: Float!
  }

  type ResearchSandboxStats {
    # False when the sandbox isn't running (the footer hides its meters).
    running: Boolean!
    # 0–100, or null if unreadable. Bytes for the memory/disk pairs.
    cpuPct: Float
    memUsed: Float
    memTotal: Float
    diskUsed: Float
    diskTotal: Float
    # When not running: last activity + the idle session timeout — the moment
    # the sandbox actually stopped (stop time isn't tracked directly), clamped
    # to now. Null while running.
    hibernatingSince: Date
  }

  extend type Query {
    researchConversationTranscript(conversationId: String!, before: Int, limit: Int): [ResearchConversationEvent!]!
    researchConversationSidebarStatuses(projectId: String!): [ResearchConversationSidebarStatus!]!
    researchSandboxDirectory(conversationId: String!, path: String): ResearchSandboxDirListing!
    researchSandboxFile(conversationId: String!, path: String!): ResearchSandboxFileContents!
    researchSandboxStats(conversationId: String!): ResearchSandboxStats!
    # Cheap liveness check (no resume side effects, unlike mintDevPreviewUrl).
    researchSandboxRunning(conversationId: String!): Boolean!
  }
`;

export const researchResolversMutations = {
  async fireResearchConversation(
    _root: void,
    args: {
      input: {
        conversationId: string;
        projectId: string;
        kind: "document" | "chat";
        activeDocumentId: string;
        promptHtml: string;
        baseEnvironmentId?: string | null;
        runtime?: string | null;
      };
    },
    context: ResolverContext,
  ) {
    const { currentUser, ResearchConversations } = context;
    if (!userIsAdmin(currentUser)) throw new Error("Forbidden");
    const { conversationId, projectId, kind, activeDocumentId, promptHtml } = args.input;
    const baseEnvironmentId = args.input.baseEnvironmentId ?? null;
    const runtime = args.input.runtime ?? null;
    const prompt = htmlToMarkdown(promptHtml).trim();
    if (!prompt) throw new Error("prompt required");

    if (!!baseEnvironmentId === !!runtime) {
      throw new Error(
        "Exactly one of baseEnvironmentId or runtime must be set when firing a conversation.",
      );
    }
    let environment: DbResearchEnvironment | null = null;
    if (baseEnvironmentId) {
      environment = await context.ResearchEnvironments.findOne({ _id: baseEnvironmentId });
      if (!environment || environment.projectId !== projectId) {
        throw new Error(`Environment ${baseEnvironmentId} not found`);
      }
    }

    const _id = conversationId;

    // An environment fork reuses the source conversation's session id when it
    // can be recovered: the env snapshot's disk carries the source session
    // file, so `--resume` under that id restores the branch history at full
    // fidelity. (The id lives in the event payload's `session_id`, not the
    // source conversation's `claudeSessionId` field — that field may lag.)
    // Everything else — including a fork whose source id can't be recovered —
    // gets the conversation's own deterministic session id.
    const sourceEvent = environment?.sourceEventId
      ? await context.ResearchConversationEvents.findOne({ _id: environment.sourceEventId })
      : null;
    const sourceSessionId = sourceEvent ? sessionIdFromPayload(sourceEvent.payload) : null;
    const claudeSessionId = sourceSessionId ?? claudeSessionIdForConversation(_id);

    const now = new Date();
    try {
      await ResearchConversations.rawInsert({
        _id,
        userId: currentUser._id,
        projectId,
        entrypointKind: kind,
        entrypointDocumentId: activeDocumentId,
        baseEnvironmentId,
        runtime,
        title: null,
        icon: null,
        claudeSessionId,
        presentationHtml: null,
        archived: false,
        lastActivityAt: now,
        lastReadAt: now,
        createdAt: now,
      });
    } catch (err) {
      if (isPostgresUniqueViolation(err)) {
        throw new Error(`Conversation id ${_id} is already in use`);
      }
      throw err;
    }

    let bootstrapEvents: DbResearchConversationEvent[] | undefined;
    if (sourceEvent) {
      await context.repos.researchConversationEvents.backfillFromBranch({
        sourceConversationId: sourceEvent.conversationId,
        targetConversationId: _id,
        targetUserId: currentUser._id,
        targetProjectId: projectId,
        branchSeq: sourceEvent.seq,
      });
      if (!sourceSessionId) {
        // No session file to resume on the snapshot — synthesize one from the
        // backfilled branch events so the fork still starts with its history.
        bootstrapEvents = await context.ResearchConversationEvents.find(
          { conversationId: _id },
          { sort: { seq: 1 } },
        ).fetch();
      }
    }

    const turnPrompt = await prepareTurnPrompt({
      rawPrompt: prompt,
      projectId,
      conversationId,
      activeDocumentId,
      entrypointKind: kind,
      entrypointDocumentId: activeDocumentId,
      priorEvents: [],
      context,
    });

    // The supervisor is the single writer of events: it records the user turn
    // itself at dispatch time (from the prompt) and ships it through the durable
    // queue, so the backend does not persist the user turn directly. A pre-launch
    // failure (provisioning/launch, before the supervisor accepts the dispatch)
    // therefore leaves a conversation row with no user event — acceptable only
    // because the client keeps the prompt and re-sends (it rethrows on dispatch
    // failure).
    await dispatchToSandbox({
      context,
      conversationId: _id,
      projectId,
      userId: currentUser._id,
      prompt: turnPrompt,
      claudeSessionId,
      // A fork that recovered its source session resumes the session file on
      // the env snapshot; everything else is a brand-new session (a fork
      // without a recoverable source id resumes via the synthesized bootstrap
      // instead, which dispatchToSandbox writes and accounts for).
      sessionHasHistory: !!sourceSessionId,
      bootstrapEvents,
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
    args: { conversationId: string; promptHtml: string; activeDocumentId: string },
    context: ResolverContext,
  ) {
    const { ResearchConversations } = context;
    const conv = await loadConversationOrThrow(args.conversationId, context);
    const prompt = htmlToMarkdown(args.promptHtml).trim();
    if (!prompt) throw new Error("prompt required");

    // Fetch history once: used for both the Claude `--resume` bootstrap
    // and the system-reminder cadence check. Read before appending the new
    // user turn so both consumers see history-up-to-now.
    const priorEvents = await context.ResearchConversationEvents.find(
      { conversationId: conv._id },
      { sort: { seq: 1 } },
    ).fetch();

    const turnPrompt = await prepareTurnPrompt({
      rawPrompt: prompt,
      projectId: conv.projectId,
      conversationId: conv._id,
      activeDocumentId: args.activeDocumentId,
      entrypointKind: conv.entrypointKind,
      entrypointDocumentId: conv.entrypointDocumentId,
      priorEvents,
      context,
    });

    // Legacy conversations (created before deterministic session ids) whose
    // first-event capture never landed get a derived id now, persisted so
    // later turns agree on it. Their derived id has no session file anywhere,
    // so the bootstrap must run even on a warm sandbox.
    const claudeSessionId = conv.claudeSessionId ?? claudeSessionIdForConversation(conv._id);
    if (!conv.claudeSessionId) {
      await ResearchConversations.rawUpdateOne({ _id: conv._id }, { $set: { claudeSessionId } });
    }

    await dispatchToSandbox({
      context,
      conversationId: conv._id,
      projectId: conv.projectId,
      userId: conv.userId,
      prompt: turnPrompt,
      claudeSessionId,
      // "THIS session has run before" = some persisted event carries this
      // exact session id (claude-emitted; supervisor-synthesized events have
      // none). Matching the dispatched id — not just any session_id — matters
      // for forks: their backfilled branch events carry the SOURCE
      // conversation's session id, which must not make a fork whose own
      // session never started claim history (--resume of a nonexistent
      // session hard-fails). A conversation whose first turn never reached
      // claude, or whose legacy id was just derived, correctly reads false —
      // the shipped bootstrap is what makes those resumable.
      sessionHasHistory: priorEvents.some(
        (e) => sessionIdFromPayload(e.payload) === claudeSessionId,
      ),
      bootstrapEvents: priorEvents,
      bootstrapEvenIfWarm: !conv.claudeSessionId,
    });

    // Only after a successful dispatch, so a failed turn leaves no advanced timestamp.
    await ResearchConversations.rawUpdateOne({ _id: conv._id }, { $set: { lastActivityAt: new Date() } });

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

  async answerResearchConversationQuestion(
    _root: void,
    args: { conversationId: string; toolUseId: string; answersJson: string },
    context: ResolverContext,
  ) {
    const conv = await loadConversationOrThrow(args.conversationId, context);

    let answers: Record<string, string>;
    try {
      const parsed: unknown = JSON.parse(args.answersJson);
      if (!isPlainRecord(parsed) || !Object.values(parsed).every((v) => typeof v === "string")) {
        throw new Error("answersJson must be a JSON object of string values");
      }
      answers = parsed as Record<string, string>;
    } catch (err) {
      throw new Error(`Invalid answersJson: ${(err as Error).message}`);
    }

    const [sandbox, row] = await Promise.all([
      getRunningSandbox(conv._id),
      context.ResearchSandboxSessions.findOne({ conversationId: conv._id }),
    ]);
    if (!sandbox || !row) {
      return { ok: false, expired: true };
    }

    const result = await answerQuestionViaSupervisor(
      {
        conversationId: conv._id,
        sandboxName: sandboxNameForConversation(conv._id),
        supervisorUrl: supervisorUrlForSandbox(sandbox),
        supervisorSecret: row.supervisorSecret,
      },
      args.toolUseId,
      answers,
    );
    return { ok: result.ok, expired: result.expired };
  },

  /**
   * Mint a fresh, per-session dev-server preview URL for a coding conversation.
   * Resumes the sandbox if stopped (the relaunched supervisor restarts the dev
   * server), signs an HMAC dev-access token, and returns the auth-proxy URL.
   */
  async mintDevPreviewUrl(_root: void, args: { conversationId: string }, context: ResolverContext) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    const provisioned = await provisionSandboxOrWarming(conv._id, context);
    if (!provisioned.devProxySecret) {
      throw new Error("The sandbox was provisioned without a dev proxy secret.");
    }
    const token = signSupervisorToken(
      {
        sandboxId: provisioned.sandboxName,
        expiresAt: Date.now() + DEV_PREVIEW_TOKEN_TTL_MS,
        scope: DEVAUTH_SCOPE,
      },
      provisioned.devProxySecret,
    );
    const url = `${devProxyUrlForSandbox(provisioned.sandbox)}/_devauth/${encodeURIComponent(token)}`;
    return { url };
  },

  async restartResearchSandbox(_root: void, args: { conversationId: string }, context: ResolverContext) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    await provisionSandboxOrWarming(conv._id, context);
    return { running: true };
  },

  async markResearchConversationRead(_root: void, args: { conversationId: string }, context: ResolverContext) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    // Owner-only: the unread indicator is the owner's read state; another
    // admin opening the conversation must not clear it for them.
    if (conv.userId !== context.currentUser?._id) {
      throw new Error("Only the conversation's owner can mark it read");
    }
    await context.ResearchConversations.rawUpdateOne(
      { _id: conv._id },
      { $set: { lastReadAt: new Date() } },
    );
    return { ok: true };
  },

  async setClaudeCodeOAuthToken(_root: void, args: { token: string }, context: ResolverContext) {
    const { currentUser, Users } = context;
    if (!userIsAdmin(currentUser)) throw new Error("Forbidden");
    const token = args.token.trim();
    if (!token) throw new Error("token required");
    await Users.rawUpdateOne(
      { _id: currentUser._id },
      { $set: { claudeCodeOAuthTokenEncrypted: encryptUserSecret(token) } },
    );
    return { success: true };
  },

  async saveResearchEnvironment(
    _root: void,
    args: { conversationId: string; withConversation: boolean },
    context: ResolverContext,
  ) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    const session = await context.ResearchSandboxSessions.findOne({ conversationId: conv._id });
    if (!session) {
      throw new Error("This conversation has no sandbox yet — start a turn before saving an environment.");
    }

    const built = await buildEnvironmentSnapshot({
      conversationId: conv._id,
      withConversation: args.withConversation,
      conversationTitle: conv.title ?? null,
      supervisorSecret: session.supervisorSecret,
      context,
    });

    const _id = randomId();
    try {
      await context.ResearchEnvironments.rawInsert({
        _id,
        userId: conv.userId,
        projectId: conv.projectId,
        label: built.label,
        vercelSnapshotId: built.vercelSnapshotId,
        sourceEventId: built.sourceEventId,
        archived: false,
        createdAt: new Date(),
      });
    } catch (err) {
      await Snapshot.get({ snapshotId: built.vercelSnapshotId })
        .then((s) => s.delete())
        .catch(() => {});
      throw err;
    }

    const created = await context.ResearchEnvironments.findOne({ _id });
    const filtered = await accessFilterSingle(context.currentUser, "ResearchEnvironments", created, context);
    return { data: filtered };
  },

  async ensureResearchScratchDocument(
    _root: void,
    args: { projectId: string },
    context: ResolverContext,
  ) {
    const { currentUser, ResearchProjects, ResearchDocuments } = context;
    if (!userIsAdmin(currentUser)) throw new Error("Forbidden");
    const project = await ResearchProjects.findOne({ _id: args.projectId });
    if (!project) throw new Error("Project not found");

    const settings = isPlainRecord(project.settings) ? project.settings : {};
    const existingId = typeof settings.scratchDocumentId === "string" ? settings.scratchDocumentId : null;
    if (existingId) {
      const existing = await ResearchDocuments.findOne({ _id: existingId, projectId: project._id });
      if (existing) return { documentId: existing._id };
    }

    const created = await createResearchDocument(
      { data: { projectId: project._id, title: SCRATCH_DOCUMENT_TITLE } },
      context,
    );
    await ResearchProjects.rawUpdateOne(
      { _id: project._id },
      { $set: { settings: { ...settings, scratchDocumentId: created._id } } },
    );
    return { documentId: created._id };
  },

  async reorderResearchDocuments(
    _root: void,
    args: { projectId: string; orderedIds: string[] },
    context: ResolverContext,
  ) {
    const { currentUser } = context;
    if (!userIsAdmin(currentUser)) throw new Error("Forbidden");
    await context.repos.researchDocuments.reorderDocuments(
      args.projectId,
      currentUser._id,
      args.orderedIds,
    );
    return { success: true };
  },
};

const SCRATCH_DOCUMENT_TITLE = "Scratch";

function sessionIdFromPayload(payload: unknown): string | null {
  if (!isPlainRecord(payload)) return null;
  return typeof payload.session_id === "string" ? payload.session_id : null;
}

/**
 * Provision (or resume) a conversation's sandbox, translating a transient
 * "supervisor not ready yet" into a retryable `SANDBOX_WARMING` GraphQL error
 * the client surfaces softly (and which is kept out of Sentry). Used by every
 * resolver that brings a sandbox up.
 */
async function provisionSandboxOrWarming(
  conversationId: string,
  context: ResolverContext,
): Promise<ProvisionedSandbox> {
  try {
    return await getOrCreateSandbox(conversationId, context);
  } catch (err) {
    if (err instanceof SandboxWarmingError) {
      throw new GraphQLError(
        "The sandbox is still starting up. Please try again in a moment.",
        { extensions: { code: "SANDBOX_WARMING", noSentryCapture: true } },
      );
    }
    throw err;
  }
}

/**
 * Provision (or resume) the conversation's persistent sandbox and dispatch one
 * turn to its supervisor.
 *
 * `bootstrapEvents` is the conversation's persisted history, from which the
 * Claude session file can be reconstructed when it isn't on the sandbox's
 * disk. The reconstruction is staged through the sandbox filesystem API —
 * never the dispatch body, which is capped far below a long conversation's
 * JSONL size — and the supervisor installs it at spawn time under its
 * per-conversation lock. Staging happens in two cases:
 *  - proactively, when this call freshly built the sandbox (a rebuild after an
 *    expired snapshot, or a fork whose source session couldn't be recovered),
 *    or when `bootstrapEvenIfWarm` says the session id was just derived and so
 *    can't have a file anywhere;
 *  - reactively, when the supervisor rejects the dispatch because a session
 *    with history has no file on disk (the sandbox was rebuilt by a caller
 *    that stages no bootstrap). Events are fetched here if the caller didn't
 *    supply them, and the dispatch is retried once.
 */
async function dispatchToSandbox(args: {
  context: ResolverContext;
  conversationId: string;
  projectId: string;
  userId: string;
  prompt: string;
  claudeSessionId: string;
  /**
   * Whether a Claude session for this conversation has ever actually run —
   * forwarded to the supervisor, which uses it to pick `--resume` vs
   * `--session-id`.
   */
  sessionHasHistory: boolean;
  bootstrapEvents?: DbResearchConversationEvent[];
  bootstrapEvenIfWarm?: boolean;
}): Promise<void> {
  const provisioned = await provisionSandboxOrWarming(args.conversationId, args.context);

  const shipBootstrap = provisioned.wasFreshlyCreated || args.bootstrapEvenIfWarm;
  let stagedBootstrap = false;
  if (shipBootstrap && args.bootstrapEvents?.length) {
    const lines = buildBootstrapJsonl(args.bootstrapEvents, args.claudeSessionId);
    if (lines.length > 0) {
      await stageClaudeSessionFile(provisioned.sandbox, args.claudeSessionId, lines);
      stagedBootstrap = true;
    }
  }

  const dispatchArgs = {
    provisioned,
    conversationId: args.conversationId,
    projectId: args.projectId,
    userId: args.userId,
    prompt: args.prompt,
    claudeSessionId: args.claudeSessionId,
    sessionHasHistory: args.sessionHasHistory || stagedBootstrap,
  };

  try {
    await dispatchTurnViaSupervisor(dispatchArgs);
  } catch (err) {
    if (!(err instanceof SessionFileMissingError)) throw err;
    const events = args.bootstrapEvents?.length
      ? args.bootstrapEvents
      : await args.context.ResearchConversationEvents.find(
          { conversationId: args.conversationId },
          { sort: { seq: 1 } },
        ).fetch();
    const lines = buildBootstrapJsonl(events, args.claudeSessionId);
    if (lines.length === 0) throw err;
    await stageClaudeSessionFile(provisioned.sandbox, args.claudeSessionId, lines);
    await dispatchTurnViaSupervisor(dispatchArgs);
  }
}

export const researchResolversQueries = {
  async researchConversationTranscript(
    _root: void,
    args: { conversationId: string; before?: number | null; limit?: number | null },
    context: ResolverContext,
  ) {
    await loadConversationOrThrow(args.conversationId, context);
    const { ResearchConversationEvents } = context;
    // Page backward from the end (or from `before`, exclusive) so opening a long
    // conversation loads only its most recent window; older history is paged in
    // on scroll-up with successively smaller `before` cursors. We fetch
    // newest-first to apply the limit to the tail, then return ascending for
    // display.
    const selector = {
      conversationId: args.conversationId,
      ...(args.before != null ? { seq: { $lt: args.before } } : {}),
    };
    const events = await ResearchConversationEvents.find(
      selector,
      { sort: { seq: -1 }, limit: args.limit ?? 200 },
    ).fetch();
    return events.reverse();
  },

  async researchConversationSidebarStatuses(
    _root: void,
    args: { projectId: string },
    context: ResolverContext,
  ) {
    const { currentUser, ResearchConversations } = context;
    if (!userIsAdmin(currentUser)) throw new Error("Forbidden");
    const conversations = await ResearchConversations.find(
      { projectId: args.projectId, userId: currentUser._id },
      { limit: 500 },
      { _id: 1, lastActivityAt: 1, lastReadAt: 1 },
    ).fetch();
    const activeIds = new Set(
      await context.repos.researchConversationEvents.conversationsWithIncompleteTurns(
        conversations.map((c) => c._id),
      ),
    );
    return conversations.map((c) => ({
      conversationId: c._id,
      turnActive: activeIds.has(c._id),
      lastActivityAt: c.lastActivityAt,
      lastReadAt: c.lastReadAt ?? null,
    }));
  },

  async researchSandboxDirectory(
    _root: void,
    args: { conversationId: string; path?: string | null },
    context: ResolverContext,
  ) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    const sandbox = await getRunningSandbox(conv._id);
    if (!sandbox) {
      return { path: args.path ?? SANDBOX_DEFAULT_DIR, running: false, entries: [] };
    }
    const path = args.path?.trim() || SANDBOX_DEFAULT_DIR;
    const entries = await listSandboxDirectory(sandbox, path);
    return { path, running: true, entries };
  },

  async researchSandboxFile(
    _root: void,
    args: { conversationId: string; path: string },
    context: ResolverContext,
  ) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    const sandbox = await getRunningSandbox(conv._id);
    if (!sandbox) {
      return { path: args.path, running: false, content: "", truncated: false, binary: false, size: 0 };
    }
    const file = await readSandboxTextFile(sandbox, args.path);
    return { path: args.path, running: true, ...file };
  },

  async researchSandboxStats(
    _root: void,
    args: { conversationId: string },
    context: ResolverContext,
  ) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    const sandbox = await getRunningSandbox(conv._id);
    if (!sandbox) {
      const hibernatingSince = conv.lastActivityAt
        ? new Date(Math.min(conv.lastActivityAt.getTime() + SESSION_TIMEOUT_MS, Date.now()))
        : null;
      return {
        running: false,
        cpuPct: null,
        memUsed: null,
        memTotal: null,
        diskUsed: null,
        diskTotal: null,
        hibernatingSince,
      };
    }
    const stats = await getSandboxResourceStats(sandbox);
    return { running: true, ...stats, hibernatingSince: null };
  },

  async researchSandboxRunning(
    _root: void,
    args: { conversationId: string },
    context: ResolverContext,
  ) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    return (await getRunningSandbox(conv._id)) !== null;
  },
};
