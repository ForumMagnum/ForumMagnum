import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { randomId } from "@/lib/random";
import {
  authorizeAgentRequest,
  authorizeAgentResearchConversationAccess,
} from "../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../captureResearchAgentAnalytics";

const ROUTE = "conversations.spawn";

/**
 * Hard caps per the design doc's "Other concerns surfaced":
 *  - parentChainDepth ≤ 2: a subagent cannot itself spawn a subagent that
 *    spawns another. (depth 0 = top-level; the bearer-token's conversation
 *    must be at depth ≤ 1 to spawn a child.)
 *  - concurrentChildren ≤ 3: a parent cannot have more than 3 children
 *    actively spawning at once. (We count `subagent` rows whose
 *    `lastActivityAt` is within the last hour as "active"; a more precise
 *    check would consult the sandbox manager, but this approximation is
 *    sufficient as a fan-out governor.)
 */
const MAX_PARENT_CHAIN_DEPTH = 2;
const MAX_CONCURRENT_CHILDREN = 3;
const ACTIVE_CHILD_WINDOW_MS = 60 * 60 * 1000;

const spawnSubagentBodySchema = z.object({
  prompt: z.string().min(1).describe("The initial user-turn prompt for the new conversation"),
  title: z.string().optional().describe("Optional user-editable title for the new conversation"),
});

/**
 * Walk the parent chain backwards counting depth. Stops at the first
 * non-subagent entrypoint (chat/document/query_modal/fork all count as
 * top-level for this calculation; only `subagent` extends the chain).
 */
async function computeParentChainDepth(
  conversation: DbResearchConversation,
  context: ResolverContext,
): Promise<number> {
  let depth = 0;
  let current: DbResearchConversation | null = conversation;
  // Bound the walk regardless — defensive against pathological data.
  while (current && depth < MAX_PARENT_CHAIN_DEPTH + 2) {
    const entrypoint = current.entrypoint as { kind?: string; parentConversationId?: string } | null;
    if (entrypoint?.kind !== "subagent" || !entrypoint.parentConversationId) {
      return depth;
    }
    depth += 1;
    current = await context.ResearchConversations.findOne({ _id: entrypoint.parentConversationId });
  }
  return depth;
}

/**
 * POST `/api/research/agent/conversations`
 *
 * Spawn a sibling conversation as a sub-agent of the bearer-token's parent
 * conversation. The parent is implicit — it's `payload.conversationId` —
 * which means agents cannot spawn under arbitrary parents, only under their
 * own bearer-token-authorized conversation.
 *
 * Returns the new conversationId. The supervisor (T2) handles dispatch from
 * here: it picks up the new row via the `fireResearchConversation` GraphQL
 * mutation path or via a sandbox-manager-internal trigger.
 */
export async function POST(req: NextRequest) {
  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  if (payload.scope !== "agent" || !payload.conversationId) {
    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "forbidden",
      projectId: payload.projectId,
      userId: payload.userId,
      reason: "agent_scope_required",
    });
    return NextResponse.json(
      { error: "Forbidden: spawning a subagent requires a conversation-scoped agent token." },
      { status: 403 },
    );
  }

  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = spawnSubagentBodySchema.safeParse(body);
  if (!parseResult.success) {
    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "validation_error",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
    });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { prompt, title } = parseResult.data;

  try {
    // Verify the bearer-token's parent conversation exists and is in the
    // claimed project — we use it as the new conversation's parent.
    const convAuth = await authorizeAgentResearchConversationAccess({
      route: ROUTE,
      conversationId: payload.conversationId,
      payload,
      context,
    });
    if (convAuth.kind === "errorResponse") return convAuth.errorResponse;
    const { conversation: parent } = convAuth;

    const depth = await computeParentChainDepth(parent, context);
    if (depth >= MAX_PARENT_CHAIN_DEPTH) {
      captureResearchAgentApiEvent({
        route: ROUTE,
        status: "forbidden",
        conversationId: payload.conversationId,
        projectId: payload.projectId,
        reason: "parent_chain_depth_exceeded",
      });
      return NextResponse.json(
        {
          error: `Spawn rejected: parent chain depth ${depth} exceeds cap ${MAX_PARENT_CHAIN_DEPTH}.`,
        },
        { status: 403 },
      );
    }

    // Concurrent-children cap: count subagent children of this parent
    // active in the last hour. Approximate but cheap and prevents a single
    // turn from fanning out unboundedly.
    const activeSince = new Date(Date.now() - ACTIVE_CHILD_WINDOW_MS);
    const recentChildren = await context.ResearchConversations.find(
      {
        projectId: payload.projectId,
        // The entrypoint JSONB filter — parentConversationId equals our parent
        // and kind is subagent. Mongo-style selectors against JSONB are
        // translated by PgCollection.
        "entrypoint.kind": "subagent",
        "entrypoint.parentConversationId": payload.conversationId,
        lastActivityAt: { $gt: activeSince },
      },
      { limit: MAX_CONCURRENT_CHILDREN + 1 },
      { _id: 1 },
    ).fetch();
    if (recentChildren.length >= MAX_CONCURRENT_CHILDREN) {
      captureResearchAgentApiEvent({
        route: ROUTE,
        status: "forbidden",
        conversationId: payload.conversationId,
        projectId: payload.projectId,
        reason: "concurrent_children_cap",
      });
      return NextResponse.json(
        {
          error: `Spawn rejected: parent already has ${recentChildren.length} active children, cap is ${MAX_CONCURRENT_CHILDREN}.`,
        },
        { status: 429 },
      );
    }

    // Create the conversation row + seed the seq=0 user turn directly. This
    // mirrors the body of T1's `fireResearchConversation` GraphQL mutation
    // (researchResolvers.ts) but bypasses its `currentUser` requirement —
    // we're authenticated via the sandbox-callback bearer token, which
    // carries `userId` and has already passed the project-membership check
    // above. Doing the insert here keeps the auth model clean (one path per
    // auth shape) at the cost of duplicating ~10 lines.
    //
    // Sandbox dispatch is intentionally NOT triggered here. The supervisor
    // that holds the bearer token spawned a child Claude Code subprocess as
    // soon as `research-tool spawn` returned, and that subprocess will pick
    // up its first turn via the same /events POST flow as any other
    // conversation. If a future iteration needs explicit dispatch (e.g. a
    // user-initiated subagent from the UI), call into T1's
    // `dispatchToSandbox` once it's exported as a non-resolver helper.
    const conversationId = randomId();
    const now = new Date();
    await context.ResearchConversations.rawInsert({
      _id: conversationId,
      userId: payload.userId,
      projectId: payload.projectId,
      title: title ?? null,
      claudeSessionId: null,
      entrypoint: {
        kind: "subagent",
        parentConversationId: payload.conversationId,
      },
      lastActivityAt: now,
      createdAt: now,
    });
    await context.repos.researchConversationEvents.persistEvent(conversationId, {
      claudeMessageUuid: null,
      kind: "user",
      payload: { type: "user", text: prompt },
    });

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      operationResult: `spawned=${conversationId}`,
    });

    return NextResponse.json({
      ok: true,
      conversationId,
      parentConversationId: payload.conversationId,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(ROUTE, error, {
      conversationId: payload.conversationId,
      projectId: payload.projectId,
    });
    return NextResponse.json(
      {
        error: "Failed to spawn subagent conversation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
