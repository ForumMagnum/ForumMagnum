import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { captureResearchAgentApiEvent } from "./captureResearchAgentAnalytics";
import { issueResearchDocumentHocuspocusToken } from "./researchHocuspocusToken";

/**
 * Sandbox-callback bearer token. Two scopes:
 *
 *   - `scope: "supervisor"` (sandbox-wide) — issued at sandbox provision time,
 *     used by the supervisor process to POST events for any conversation in
 *     the project, and to send heartbeats.
 *
 *   - `scope: "agent"` (conversation-scoped) — minted per-turn and given to the
 *     Claude Code subprocess so the in-sandbox `research-tool` CLI can call our
 *     document/conversation endpoints scoped to that one conversation.
 *
 * HMAC-signed (HS256 JWT) with `RESEARCH_SANDBOX_CALLBACK_SECRET`. Payload
 * carries:
 *   - scope          — "supervisor" | "agent"
 *   - sandboxId      — the Vercel Sandbox row this token was minted for
 *   - conversationId — required for `agent` scope; absent for `supervisor`
 *   - projectId      — denormalized so we don't need a DB hit to authorize
 *                      project-scoped operations
 *   - userId         — the user who owns the project
 *   - exp / iat      — standard JWT expiry / issued-at
 */
export interface SandboxCallbackTokenPayload {
  scope: "supervisor" | "agent";
  sandboxId: string;
  conversationId?: string;
  projectId: string;
  userId: string;
  iat: number;
  exp: number;
}

// Both tokens ride as spawn-time env in long-lived in-sandbox processes, so
// they must outlive any session that could hold them (Vercel's session cap is
// 24h); one that expires mid-session silently 401s the supervisor's heartbeats
// and event posts. The agent-scoped token authorizes document/conversation
// writes and is readable by model-controlled code, so it gets only the
// headroom the cap requires; the supervisor-scoped token gets a week of slack
// against future cap increases.
const SANDBOX_CALLBACK_TOKEN_MAX_TTL_SECONDS = 2 * 24 * 60 * 60;
const SUPERVISOR_TOKEN_MAX_TTL_SECONDS = 7 * 24 * 60 * 60;

export type SandboxCallbackValidationResult =
  | { kind: "valid"; payload: SandboxCallbackTokenPayload }
  | { kind: "missing" }
  | { kind: "malformed" }
  | { kind: "invalid_signature" }
  | { kind: "expired" };

function getSandboxCallbackSecret(): string {
  const secret = process.env.RESEARCH_SANDBOX_CALLBACK_SECRET;
  if (!secret) {
    throw new Error("RESEARCH_SANDBOX_CALLBACK_SECRET is not configured");
  }
  return secret;
}

function isSandboxCallbackTokenPayload(value: unknown): value is SandboxCallbackTokenPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.sandboxId !== "string") return false;
  if (typeof v.projectId !== "string") return false;
  if (typeof v.userId !== "string") return false;
  if (typeof v.iat !== "number") return false;
  if (typeof v.exp !== "number") return false;
  // Backwards-compat: tokens minted before the scope field existed are
  // treated as agent-scoped (they had a required conversationId).
  if (v.scope !== undefined && v.scope !== "supervisor" && v.scope !== "agent") return false;
  const scope = v.scope === "supervisor" ? "supervisor" : "agent";
  if (scope === "agent" && typeof v.conversationId !== "string") return false;
  return true;
}

/**
 * Verify a sandbox-callback bearer token. Returns a discriminated union so the
 * caller can emit precise analytics; messages back to the client are
 * intentionally collapsed in `unauthorizedResponse()` to avoid leaking which
 * specific failure mode happened.
 */
export function verifySandboxCallbackToken(rawToken: string | undefined): SandboxCallbackValidationResult {
  if (!rawToken) return { kind: "missing" };

  let decoded: unknown;
  try {
    decoded = jwt.verify(rawToken, getSandboxCallbackSecret(), {
      algorithms: ["HS256"],
      maxAge: SUPERVISOR_TOKEN_MAX_TTL_SECONDS,
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) return { kind: "expired" };
    if (error instanceof jwt.JsonWebTokenError) return { kind: "invalid_signature" };
    return { kind: "malformed" };
  }

  if (!isSandboxCallbackTokenPayload(decoded)) {
    return { kind: "malformed" };
  }
  return { kind: "valid", payload: decoded };
}

/**
 * Mint an agent-scoped sandbox-callback token: conversation-scoped, given to
 * the in-sandbox `research-tool` CLI so it can call our document/conversation
 * endpoints. Minted per-dispatch so the HMAC secret stays on the backend.
 */
export function mintSandboxCallbackToken({
  sandboxId,
  conversationId,
  projectId,
  userId,
  ttlSeconds,
}: {
  sandboxId: string;
  conversationId: string;
  projectId: string;
  userId: string;
  ttlSeconds?: number;
}): string {
  const ttl = Math.min(ttlSeconds ?? SANDBOX_CALLBACK_TOKEN_MAX_TTL_SECONDS, SANDBOX_CALLBACK_TOKEN_MAX_TTL_SECONDS);
  return jwt.sign(
    { scope: "agent", sandboxId, conversationId, projectId, userId },
    getSandboxCallbackSecret(),
    { algorithm: "HS256", expiresIn: ttl },
  );
}

/**
 * Mint a supervisor-scoped sandbox-callback token. Issued once at sandbox
 * provision time and given to the supervisor process via env. Used to POST
 * events for any conversation the supervisor is running, and to send
 * heartbeats. Sandbox-wide (no conversationId).
 */
export function mintSupervisorCallbackToken({
  sandboxId,
  projectId,
  userId,
  ttlSeconds,
}: {
  sandboxId: string;
  projectId: string;
  userId: string;
  ttlSeconds?: number;
}): string {
  const ttl = Math.min(ttlSeconds ?? SUPERVISOR_TOKEN_MAX_TTL_SECONDS, SUPERVISOR_TOKEN_MAX_TTL_SECONDS);
  return jwt.sign(
    { scope: "supervisor", sandboxId, projectId, userId },
    getSandboxCallbackSecret(),
    { algorithm: "HS256", expiresIn: ttl },
  );
}

export function extractBearerToken(req: NextRequest): string | undefined {
  const header = req.headers.get("authorization");
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1];
}

const UNAUTHORIZED_MESSAGE =
  "Unauthorized: missing or invalid sandbox callback token. The supervisor must include `Authorization: Bearer <token>` on every request.";

const FORBIDDEN_DOCUMENT_MESSAGE =
  "Forbidden: the requested document is not in the project this token authorizes.";

const FORBIDDEN_CONVERSATION_MESSAGE =
  "Forbidden: the requested conversation is not in the project this token authorizes.";

const FORBIDDEN_AGENT_SCOPE_MESSAGE =
  "Forbidden: this endpoint requires a conversation-scoped agent token.";

const UNSUPPORTED_EDITOR_MESSAGE =
  "This research document is not in the Lexical editor format and cannot be edited via the agent API.";

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: UNAUTHORIZED_MESSAGE }, { status: 401 });
}

export function forbiddenDocumentResponse(): NextResponse {
  return NextResponse.json({ error: FORBIDDEN_DOCUMENT_MESSAGE }, { status: 403 });
}

export function forbiddenConversationResponse(): NextResponse {
  return NextResponse.json({ error: FORBIDDEN_CONVERSATION_MESSAGE }, { status: 403 });
}

export function forbiddenAgentScopeResponse(): NextResponse {
  return NextResponse.json({ error: FORBIDDEN_AGENT_SCOPE_MESSAGE }, { status: 403 });
}

export function unsupportedEditorResponse(editorType: string): NextResponse {
  return NextResponse.json(
    { error: `${UNSUPPORTED_EDITOR_MESSAGE} (current editor type: ${editorType})` },
    { status: 400 },
  );
}

export function notFoundResponse(entity: string): NextResponse {
  return NextResponse.json({ error: `Not found: ${entity}` }, { status: 404 });
}

/**
 * Result of `authorizeAgentRequest()`: either a validated payload that callers
 * can use to look up project/conversation state, or an HTTP error response to
 * forward verbatim. Mirrors the shape of `authorizeAgentDraftAccess()` in the
 * Posts agent API so route handlers stay structurally identical.
 */
export type AuthorizeAgentRequestResult =
  | { kind: "ok"; payload: SandboxCallbackTokenPayload }
  | { kind: "errorResponse"; errorResponse: NextResponse };

/**
 * Top-level dispatcher. Validates the bearer token; on failure emits
 * an analytics event tagged with `route` and returns the matching HTTP error.
 * Endpoint-specific authorization (e.g. "this document is in the project this
 * token authorizes") happens after this returns, via the helpers below.
 */
export function authorizeAgentRequest({
  req,
  route,
}: {
  req: NextRequest;
  route: string;
}): AuthorizeAgentRequestResult {
  const rawToken = extractBearerToken(req);
  const verification = verifySandboxCallbackToken(rawToken);
  if (verification.kind !== "valid") {
    captureResearchAgentApiEvent({ route, status: "unauthorized", authFailure: verification.kind });
    return { kind: "errorResponse", errorResponse: unauthorizedResponse() };
  }
  return { kind: "ok", payload: verification.payload };
}

/**
 * After the bearer token validates, route handlers that operate on a
 * ResearchDocument must verify the document lives in the token's authorized
 * project. This helper does the lookup, returns either a ready-to-use
 * `{ document, hocuspocusToken }` for the Hocuspocus session, or an error
 * response.
 *
 * The Hocuspocus token issuance is intentionally co-located with the
 * project-membership check so callers can't accidentally issue a Hocuspocus
 * session for a doc outside the token's project.
 */
export async function authorizeAgentResearchDocumentAccess({
  route,
  documentId,
  payload,
  context,
}: {
  route: string;
  documentId: string;
  payload: SandboxCallbackTokenPayload;
  context: ResolverContext;
}): Promise<
  | { kind: "ok"; document: DbResearchDocument; hocuspocusToken: string }
  | { kind: "errorResponse"; errorResponse: NextResponse }
> {
  if (payload.scope !== "agent" || !payload.conversationId) {
    captureResearchAgentApiEvent({
      route,
      status: "forbidden",
      projectId: payload.projectId,
      userId: payload.userId,
      reason: "agent_scope_required",
    });
    return { kind: "errorResponse", errorResponse: forbiddenAgentScopeResponse() };
  }

  const document = await context.ResearchDocuments.findOne({ _id: documentId });
  if (!document) {
    captureResearchAgentApiEvent({
      route,
      status: "not_found",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
    });
    return { kind: "errorResponse", errorResponse: notFoundResponse("research document") };
  }

  if (document.projectId !== payload.projectId) {
    captureResearchAgentApiEvent({
      route,
      status: "forbidden",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      reason: "document_outside_project",
    });
    return { kind: "errorResponse", errorResponse: forbiddenDocumentResponse() };
  }

  const hocuspocusToken = await issueResearchDocumentHocuspocusToken({
    documentId,
    userId: payload.userId,
  });
  return { kind: "ok", document, hocuspocusToken };
}

/**
 * Mirror of `authorizeAgentResearchDocumentAccess` for endpoints that operate
 * on a ResearchConversation (events POST/GET, subagent spawn). Verifies the
 * conversation belongs to the token's authorized project.
 */
export async function authorizeAgentResearchConversationAccess({
  route,
  conversationId,
  payload,
  context,
}: {
  route: string;
  conversationId: string;
  payload: SandboxCallbackTokenPayload;
  context: ResolverContext;
}): Promise<
  | { kind: "ok"; conversation: DbResearchConversation }
  | { kind: "errorResponse"; errorResponse: NextResponse }
> {
  const conversation = await context.ResearchConversations.findOne({ _id: conversationId });
  if (!conversation) {
    captureResearchAgentApiEvent({
      route,
      status: "not_found",
      conversationId,
      projectId: payload.projectId,
    });
    return { kind: "errorResponse", errorResponse: notFoundResponse("research conversation") };
  }

  if (conversation.projectId !== payload.projectId) {
    captureResearchAgentApiEvent({
      route,
      status: "forbidden",
      conversationId,
      projectId: payload.projectId,
      reason: "conversation_outside_project",
    });
    return { kind: "errorResponse", errorResponse: forbiddenConversationResponse() };
  }

  return { kind: "ok", conversation };
}

/**
 * Project-scoped access check (e.g. project index endpoint). Verifies the
 * requested projectId matches the token's authorized project. Returns no
 * extra data — callers already have the projectId.
 *
 * Pass `requireAgentScope: true` for state-mutating endpoints; supervisor-scope
 * tokens are then rejected with `forbidden_agent_scope`. Read-only endpoints
 * leave it off so both scopes can call them.
 */
export function authorizeAgentResearchProjectAccess({
  route,
  projectId,
  payload,
  requireAgentScope,
}: {
  route: string;
  projectId: string;
  payload: SandboxCallbackTokenPayload;
  requireAgentScope?: boolean;
}): { kind: "ok" } | { kind: "errorResponse"; errorResponse: NextResponse } {
  if (requireAgentScope && payload.scope !== "agent") {
    captureResearchAgentApiEvent({
      route,
      status: "forbidden",
      projectId: payload.projectId,
      userId: payload.userId,
      reason: "agent_scope_required",
    });
    return { kind: "errorResponse", errorResponse: forbiddenAgentScopeResponse() };
  }
  if (projectId !== payload.projectId) {
    captureResearchAgentApiEvent({
      route,
      status: "forbidden",
      projectId,
      conversationId: payload.conversationId,
      reason: "project_mismatch",
    });
    return {
      kind: "errorResponse",
      errorResponse: NextResponse.json(
        { error: "Forbidden: the requested project does not match the token's authorized project." },
        { status: 403 },
      ),
    };
  }
  return { kind: "ok" };
}
