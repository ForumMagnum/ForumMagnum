import gql from "graphql-tag";
import { randomId } from "@/lib/random";
import { entrypointSchema, type Entrypoint } from "@/lib/collections/researchConversations/entrypoint";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { signSupervisorToken } from "@/server/research/sandbox/supervisor/auth";
import {
  getOrCreateSandbox,
  type SandboxRepo,
  type SandboxSessionRecord,
  DEFAULT_PER_SANDBOX_CAP,
  DEFAULT_SANDBOX_TIMEOUT_MS,
} from "@/server/research/sandbox/sandboxManager";

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

interface FireConversationInput {
  projectId: string;
  entrypoint: unknown;
  prompt: string;
}

interface ContinueArgs {
  conversationId: string;
  prompt: string;
}

interface CancelArgs {
  conversationId: string;
}

interface ActivityArgs {
  projectId: string;
  since?: Date | null;
}

interface TranscriptArgs {
  conversationId: string;
  since?: number | null;
  limit?: number | null;
}

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
 * Best-effort dispatch of a turn to the project's sandbox supervisor.
 *
 * The actual sandbox manager wiring (resolveClaudeCodeToken, supervisorSource,
 * BACKEND_BASE_URL) is project-/deploy-specific; this helper takes those as
 * env-resolved values and POSTs to the supervisor's /dispatch endpoint with a
 * fresh signed bearer.
 *
 * We don't await the supervisor's response on the GraphQL hot path — by
 * design the dispatch is a fire-and-forget, with persistence happening via
 * the supervisor's POST callbacks back to our backend. Wrapped in
 * `backgroundTask` by the caller so the serverless host doesn't tear down
 * before the dispatch completes.
 */
async function dispatchTurnViaSupervisor(args: {
  record: SandboxSessionRecord;
  conversationId: string;
  prompt: string;
  claudeSessionId?: string;
}): Promise<void> {
  const tokenExpiresAt = Date.now() + 30 * 60 * 1000;
  const bearer = signSupervisorToken(
    { sandboxId: args.record.vercelSandboxId, expiresAt: tokenExpiresAt, scope: args.conversationId },
    args.record.supervisorSecret,
  );
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
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.error(`[research] supervisor /dispatch failed: ${response.status} ${text}`);
  }
}

async function cancelTurnViaSupervisor(record: SandboxSessionRecord, conversationId: string): Promise<void> {
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

/**
 * DB-backed adapter from `ResearchSandboxSessions` to the `SandboxRepo`
 * interface that `sandboxManager` consumes. Kept inline because it's only
 * used in this resolver module today.
 */
function makeDbSandboxRepo(context: ResolverContext): SandboxRepo {
  const { ResearchSandboxSessions } = context;
  return {
    async findActiveByProject(userId, projectId) {
      const rows = await ResearchSandboxSessions.find(
        { userId, projectId, status: { $in: ["active", "provisioning"] } },
        { sort: { lastUsedAt: -1 } },
      ).fetch();
      return rows.map((r) => ({
        _id: r._id,
        userId: r.userId,
        projectId: r.projectId,
        vercelSandboxId: r.vercelSandboxId,
        endpointUrl: r.endpointUrl,
        supervisorSecret: r.supervisorSecret,
        status: r.status as SandboxSessionRecord["status"],
        concurrencyCount: r.concurrencyCount ?? 0,
        lastUsedAt: r.lastUsedAt,
        expiresAt: r.expiresAt ?? new Date(0),
      }));
    },
    async insert(record) {
      const _id = randomId();
      await ResearchSandboxSessions.rawInsert({
        _id,
        userId: record.userId,
        projectId: record.projectId,
        vercelSandboxId: record.vercelSandboxId,
        endpointUrl: record.endpointUrl,
        supervisorSecret: record.supervisorSecret,
        status: record.status,
        concurrencyCount: record.concurrencyCount,
        lastUsedAt: record.lastUsedAt,
        expiresAt: record.expiresAt,
        createdAt: new Date(),
      });
      return { _id, ...record };
    },
    async setStatus(_id, status) {
      await ResearchSandboxSessions.rawUpdateOne({ _id }, { $set: { status } });
    },
    async setConcurrencyCount(_id, count) {
      await ResearchSandboxSessions.rawUpdateOne({ _id }, { $set: { concurrencyCount: count } });
    },
    async touchLastUsedAt(_id) {
      await ResearchSandboxSessions.rawUpdateOne({ _id }, { $set: { lastUsedAt: new Date() } });
    },
  };
}

async function appendUserTurn(
  conversationId: string,
  prompt: string,
  context: ResolverContext,
): Promise<number> {
  const { ResearchConversationEvents } = context;
  const events = await ResearchConversationEvents.find(
    { conversationId },
    { sort: { seq: -1 }, limit: 1 },
  ).fetch();
  const nextSeq = (events[0]?.seq ?? -1) + 1;
  await ResearchConversationEvents.rawInsert({
    _id: randomId(),
    conversationId,
    seq: nextSeq,
    kind: "user",
    claudeMessageUuid: null,
    payload: { type: "user", text: prompt },
    createdAt: new Date(),
  });
  return nextSeq;
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

  type ResearchProjectActivityEntry {
    kind: String!
    timestamp: Date!
    conversationId: String
    documentId: String
    title: String
    summary: String
  }

  extend type Mutation {
    fireResearchConversation(input: FireResearchConversationInput!): ResearchConversationOutput
    continueResearchConversation(conversationId: String!, prompt: String!): ResearchConversationOutput
    cancelResearchConversation(conversationId: String!): ResearchConversationOutput
  }

  extend type Query {
    researchProjectActivity(projectId: String!, since: Date): [ResearchProjectActivityEntry!]!
    researchConversationTranscript(conversationId: String!, since: Int, limit: Int): [ResearchConversationEvent!]!
  }
`;

export const researchResolversMutations = {
  async fireResearchConversation(_root: void, args: { input: FireConversationInput }, context: ResolverContext) {
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

    return { conversationId: _id, data: { _id } };
  },

  async continueResearchConversation(_root: void, args: ContinueArgs, context: ResolverContext) {
    const { ResearchConversations } = context;
    const conv = await loadConversationOrThrow(args.conversationId, context);
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
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[research] continueResearchConversation dispatch failed", err);
      }
    })());

    return { conversationId: conv._id, data: { _id: conv._id } };
  },

  async cancelResearchConversation(_root: void, args: CancelArgs, context: ResolverContext) {
    const conv = await loadConversationOrThrow(args.conversationId, context);
    const repo = makeDbSandboxRepo(context);
    const sessions = await repo.findActiveByProject(conv.userId, conv.projectId);
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
}): Promise<void> {
  const repo = makeDbSandboxRepo(args.context);
  const config = {
    perSandboxConcurrencyCap: DEFAULT_PER_SANDBOX_CAP,
    sandboxTimeoutMs: DEFAULT_SANDBOX_TIMEOUT_MS,
    resolveClaudeCodeToken: makeClaudeCodeTokenResolver(args.context),
    // The supervisor (running inside a Vercel Sandbox) POSTs persistence
    // events and heartbeats here. Localhost won't reach a dev machine from
    // inside the sandbox — point this at a tunnel (ngrok/Cloudflare) for
    // local dev, or the deployed app's URL in prod. Falls back to
    // NEXT_PUBLIC_BASE_URL → localhost so the page at least loads, but
    // persistence/heartbeats will silently fail without a reachable URL.
    backendBaseUrl: process.env.RESEARCH_BACKEND_PUBLIC_URL
      ?? process.env.NEXT_PUBLIC_BASE_URL
      ?? "http://localhost:3000",
    supervisorSource: { type: "none" as const },
  };
  const { record } = await getOrCreateSandbox(args.userId, args.projectId, repo, config);
  await dispatchTurnViaSupervisor({
    record,
    conversationId: args.conversationId,
    prompt: args.prompt,
    claudeSessionId: args.claudeSessionId,
  });
}

/**
 * Returns a resolver that pulls the user's Claude Code OAuth token from the
 * `ResearchProjects.claudeCodeTokenRef` column on the project being acted on.
 *
 * For the prototype the column stores the literal token value; a TODO in the
 * schema flags that this should be encrypted-at-rest before any production use.
 * Architecturally this token belongs on the `User` row long-term (1:N
 * user-to-project), but we're keeping it on the project for now because the
 * column is already there and the prototype is single-user.
 *
 * If the column is unset, we fail loudly rather than falling back to a process
 * env var: silently using a shared backend-deploy token instead of the user's
 * personal one would charge the wrong account and is a footgun in a multi-user
 * deployment.
 */
function makeClaudeCodeTokenResolver(context: ResolverContext) {
  return async (_userId: string, projectId: string): Promise<string> => {
    const project = await context.ResearchProjects.findOne({ _id: projectId });
    if (!project) {
      throw new Error(`Cannot resolve Claude Code token: project ${projectId} not found`);
    }
    const ref = project.claudeCodeTokenRef;
    if (!ref || ref.length === 0) {
      throw new Error(
        `Cannot provision sandbox for project ${projectId}: claudeCodeTokenRef is unset. ` +
          `Set up your Claude Code token on the project before starting a conversation.`,
      );
    }
    return ref;
  };
}

export const researchResolversQueries = {
  async researchProjectActivity(_root: void, args: ActivityArgs, context: ResolverContext) {
    await assertProjectAccess(args.projectId, context);
    const { ResearchConversations } = context;
    const since = args.since ?? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const convs = await ResearchConversations.find(
      { projectId: args.projectId, lastActivityAt: { $gt: since } },
      { sort: { lastActivityAt: -1 }, limit: 100 },
    ).fetch();
    return convs.map((c) => ({
      kind: "conversation_event" as const,
      timestamp: c.lastActivityAt,
      conversationId: c._id,
      documentId: null,
      title: c.title ?? null,
      summary: null,
    }));
  },

  async researchConversationTranscript(_root: void, args: TranscriptArgs, context: ResolverContext) {
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
