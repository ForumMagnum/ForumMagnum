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
  supervisorUrlForSandbox,
  type ProvisionedSandbox,
} from "@/server/research/sandbox/sandboxManager";
import { GraphQLError } from "graphql";
import { isPlainRecord } from "@/components/research/conversationEventFormat";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { buildBootstrapJsonl } from "@/server/research/sessionReconstruction";
import {
  buildSystemReminderWrap,
  deriveLastInjectedActiveDocumentId,
} from "@/server/research/systemReminder";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
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
  entrypointKind: string;
  entrypointDocumentId: string;
  priorEvents: DbResearchConversationEvent[];
  context: ResolverContext;
}): Promise<string> {
  const { rawPrompt, projectId, activeDocumentId, entrypointKind, entrypointDocumentId, priorEvents, context } = args;

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

  extend type Mutation {
    fireResearchConversation(input: FireResearchConversationInput!): ResearchConversationOutput
    continueResearchConversation(conversationId: String!, promptHtml: String!, activeDocumentId: String!): ResearchConversationOutput
    cancelResearchConversation(conversationId: String!): ResearchConversationOutput
    mintDevPreviewUrl(conversationId: String!): DevPreviewUrlOutput
    setClaudeCodeOAuthToken(token: String!): SetClaudeCodeOAuthTokenOutput
    saveResearchEnvironment(conversationId: String!, withConversation: Boolean!): SaveResearchEnvironmentOutput
  }

  extend type Query {
    researchConversationTranscript(conversationId: String!, since: Int, limit: Int): [ResearchConversationEvent!]!
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
      if (!environment || environment.userId !== currentUser._id || environment.projectId !== projectId) {
        throw new Error(`Environment ${baseEnvironmentId} not found`);
      }
    }

    const _id = conversationId;
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
        claudeSessionId: null,
        lastActivityAt: now,
        createdAt: now,
      });
    } catch (err) {
      if (isPostgresUniqueViolation(err)) {
        throw new Error(`Conversation id ${_id} is already in use`);
      }
      throw err;
    }

    let firstTurnSessionOnDisk: { claudeSessionId: string } | undefined;
    if (environment?.sourceEventId) {
      const sourceEvent = await context.ResearchConversationEvents.findOne({
        _id: environment.sourceEventId,
      });
      if (sourceEvent) {
        await context.repos.researchConversationEvents.backfillFromBranch({
          sourceConversationId: sourceEvent.conversationId,
          targetConversationId: _id,
          targetUserId: currentUser._id,
          targetProjectId: projectId,
          branchSeq: sourceEvent.seq,
        });
        // The session id lives in the event payload (`session_id`), not the
        // source conversation's `claudeSessionId` field — that field is captured
        // async and may be stale if the env was saved right after a result.
        const sessionId = sessionIdFromPayload(sourceEvent.payload);
        if (sessionId) {
          await ResearchConversations.rawUpdateOne({ _id }, { $set: { claudeSessionId: sessionId } });
          firstTurnSessionOnDisk = { claudeSessionId: sessionId };
        }
      }
    }

    const turnPrompt = await prepareTurnPrompt({
      rawPrompt: prompt,
      projectId,
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
      sessionOnDisk: firstTurnSessionOnDisk,
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
    // (when a session id exists) and the system-reminder cadence check.
    // Read before appending the new user turn so both consumers see
    // history-up-to-now.
    const priorEvents = await context.ResearchConversationEvents.find(
      { conversationId: conv._id },
      { sort: { seq: 1 } },
    ).fetch();

    const turnPrompt = await prepareTurnPrompt({
      rawPrompt: prompt,
      projectId: conv.projectId,
      activeDocumentId: args.activeDocumentId,
      entrypointKind: conv.entrypointKind,
      entrypointDocumentId: conv.entrypointDocumentId,
      priorEvents,
      context,
    });

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
};

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
  sessionOnDisk?: { claudeSessionId: string };
}): Promise<void> {
  const provisioned = await provisionSandboxOrWarming(args.conversationId, args.context);

  if (args.sessionOnDisk && provisioned.isFirstProvision) {
    await dispatchTurnViaSupervisor({
      provisioned,
      conversationId: args.conversationId,
      projectId: args.projectId,
      userId: args.userId,
      prompt: args.prompt,
      claudeSessionId: args.sessionOnDisk.claudeSessionId,
      bootstrapJsonl: undefined,
    });
    return;
  }

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
    const selector = {
      conversationId: args.conversationId,
      ...(args.since ? { seq: { $gt: args.since } } : {}),
    };
    const events = await ResearchConversationEvents.find(
      selector,
      { sort: { seq: 1 }, limit: args.limit ?? 5000 },
    ).fetch();
    return events;
  },
};
