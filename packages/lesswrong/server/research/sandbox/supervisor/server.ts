/**
 * Supervisor HTTP server. Runs inside the sandbox.
 *
 * Endpoints:
 *   POST /dispatch              — start (or resume) a Claude Code turn
 *   POST /cancel/:conversationId — abort the in-flight turn
 *   POST /answer/:conversationId — resolve a pending AskUserQuestion
 *   GET  /status                — heartbeat: per-conversation states + pressure
 *
 * The supervisor runs turns and ships their events to the backend; clients read
 * events from the backend, not from here.
 *
 * All endpoints validate an HMAC-signed bearer in `Authorization: Bearer ...`.
 * The shared secret comes from the `SUPERVISOR_SECRET` env var injected at
 * sandbox-create time.
 *
 * This module exports `startSupervisor(deps)` rather than calling `listen()`
 * at import time so the dispatch / cancel handlers can be injected by the
 * caller without circular imports.
 */
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import {
  extractBearer,
  supervisorTokenCanAccessConversation,
  validateSupervisorToken,
  ValidationResult,
} from "./auth";

export interface ConversationState {
  conversationId: string;
  status: "idle" | "running" | "completed" | "errored" | "cancelled";
  startedAt?: number;
  endedAt?: number;
  bytesEmitted?: number;
}

export interface SupervisorDeps {
  /** Required env: SUPERVISOR_SECRET (HMAC), SANDBOX_ID, BACKEND_BASE_URL, USER_ID, PROJECT_ID. */
  env: {
    supervisorSecret: string;
    sandboxId: string;
    backendBaseUrl: string;
    userId: string;
    projectId: string;
  };
  /** Start (or resume) a turn. Resolves once the turn is accepted/started, not when it completes. */
  dispatchTurn(req: DispatchRequest): Promise<{ accepted: boolean; reason?: string }>;
  /** Cancel the in-flight turn for a conversation. */
  cancelTurn(conversationId: string): Promise<void>;
  answerQuestion(
    conversationId: string,
    toolUseId: string,
    answers: Record<string, string>,
  ): { ok: boolean; reason?: string };
  /** Snapshot of per-conversation state for /status. */
  getStateSnapshot(): {
    conversations: ConversationState[];
    concurrencyCount: number;
    turnRunning: boolean;
    pendingEvents: number;
  };
}

export interface DispatchRequest {
  conversationId: string;
  prompt: string;
  /** The Claude session this conversation owns. */
  claudeSessionId?: string;
  /**
   * True when a Claude session for this conversation already exists
   * (backend-derived from persisted events). Picks `--resume` over
   * `--session-id` at spawn; see DispatchInput.sessionHasHistory.
   */
  sessionHasHistory?: boolean;
  /** References attached as part of the user turn (file paths, doc handles, etc.). */
  references?: unknown[];
  /**
   * Agent-scoped sandbox-callback bearer minted by the backend per dispatch
   * (6h TTL — deliberately longer than the 5h sandbox session cap, so the
   * token a long-lived claude process received at spawn always outlives it).
   * The supervisor passes this — not its own supervisor-scoped
   * `CALLBACK_TOKEN` — to the Claude Code subprocess as
   * `RESEARCH_BACKEND_TOKEN`, so `research-tool` calls hit endpoints that
   * require an agent scope (e.g. `documents/:id` GET, edit-doc).
   */
  agentBackendToken?: string;
}

export function startSupervisor(deps: SupervisorDeps, port: number) {
  const { supervisorSecret } = deps.env;

  const server = createServer((req, res) => {
    void handleRequest(req, res, deps, supervisorSecret).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[supervisor] handler threw", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "internal" }));
      } else {
        res.end();
      }
    });
  });

  server.listen(port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`[supervisor] listening on :${port}`);
  });

  return server;
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  deps: SupervisorDeps,
  secret: string,
) {
  const url = new URL(req.url ?? "/", "http://internal");
  const path = url.pathname;
  const method = req.method ?? "GET";

  // Permissive CORS — the supervisor URL is public and the only auth is the
  // signed Bearer token. Callers are our own backend (dispatch/cancel/status),
  // not browsers; keeping this open avoids an allowlist across dev and prod.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Health check open: gives the host a way to verify the supervisor is up
  // before minting a token. Returns trivially {ok:true} — no sandbox state.
  if (path === "/health" && method === "GET") {
    return json(res, 200, { ok: true });
  }

  const validation = checkAuth(req, secret, deps.env.sandboxId);
  if (!validation.ok) {
    return json(res, 401, { error: "unauthorized", reason: validation.reason });
  }

  if (path === "/status" && method === "GET") {
    return json(res, 200, deps.getStateSnapshot());
  }

  if (path === "/dispatch" && method === "POST") {
    const body = await readJsonBodyOrRespond(req, res, "/dispatch");
    if (!body) return;
    const dispatchReq = parseDispatchRequest(body);
    if (!dispatchReq) {
      return json(res, 400, { error: "missing conversationId or prompt" });
    }
    if (!supervisorTokenCanAccessConversation(validation.payload, dispatchReq.conversationId)) {
      return json(res, 403, { error: "forbidden", reason: "conversation scope mismatch" });
    }
    const result = await deps.dispatchTurn(dispatchReq);
    return json(res, result.accepted ? 202 : 409, result);
  }

  const cancelMatch = path.match(/^\/cancel\/([^/]+)$/);
  if (cancelMatch && method === "POST") {
    const conversationId = cancelMatch[1];
    if (!supervisorTokenCanAccessConversation(validation.payload, conversationId)) {
      return json(res, 403, { error: "forbidden", reason: "conversation scope mismatch" });
    }
    await deps.cancelTurn(conversationId);
    return json(res, 204, undefined);
  }

  const answerMatch = path.match(/^\/answer\/([^/]+)$/);
  if (answerMatch && method === "POST") {
    const conversationId = answerMatch[1];
    if (!supervisorTokenCanAccessConversation(validation.payload, conversationId)) {
      return json(res, 403, { error: "forbidden", reason: "conversation scope mismatch" });
    }
    const body = await readJsonBodyOrRespond(req, res, "/answer");
    if (!body) return;
    const answerReq = parseAnswerRequest(body);
    if (!answerReq) {
      return json(res, 400, { error: "missing toolUseId or answers" });
    }
    const result = deps.answerQuestion(conversationId, answerReq.toolUseId, answerReq.answers);
    return json(res, result.ok ? 202 : 409, result);
  }

  return json(res, 404, { error: "not found", path });
}

function checkAuth(req: IncomingMessage, secret: string, sandboxId: string): ValidationResult {
  const token = extractBearer({
    headers: req.headers as Record<string, string | string[] | undefined>,
    url: req.url,
  });
  const result = validateSupervisorToken(token, secret);
  if (!result.ok) return result;
  if (result.payload.sandboxId !== sandboxId) {
    return { ok: false, reason: "sandboxId mismatch" };
  }
  return result;
}

function parseDispatchRequest(body: Record<string, unknown>): DispatchRequest | null {
  if (typeof body.conversationId !== "string" || typeof body.prompt !== "string") {
    return null;
  }
  const out: DispatchRequest = {
    conversationId: body.conversationId,
    prompt: body.prompt,
  };
  if (typeof body.claudeSessionId === "string") out.claudeSessionId = body.claudeSessionId;
  if (typeof body.sessionHasHistory === "boolean") out.sessionHasHistory = body.sessionHasHistory;
  if (Array.isArray(body.references)) out.references = body.references;
  if (typeof body.agentBackendToken === "string") out.agentBackendToken = body.agentBackendToken;
  return out;
}

function parseAnswerRequest(
  body: Record<string, unknown>,
): { toolUseId: string; answers: Record<string, string> } | null {
  if (typeof body.toolUseId !== "string") return null;
  const answers = body.answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers as Record<string, unknown>)) {
    if (typeof v !== "string") return null;
    out[k] = v;
  }
  return { toolUseId: body.toolUseId, answers: out };
}

/**
 * Sanity cap on request bodies, not a sizing constraint: every caller is our
 * own authenticated backend, so this only guards against buffering a runaway
 * body in memory.
 */
const MAX_BODY_BYTES = 20_000_000;

class PayloadTooLargeError extends Error {
  constructor(receivedBytes: number) {
    super(`payload too large (${receivedBytes} bytes, cap ${MAX_BODY_BYTES})`);
    this.name = "PayloadTooLargeError";
  }
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  let overCap = false;
  // An over-cap body is drained rather than aborted: throwing out of the
  // async iterator destroys the request (and with it the socket), so the 413
  // would reach the caller as a connection reset instead of a status.
  for await (const chunk of req) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    total += buf.length;
    if (!overCap && total > MAX_BODY_BYTES) {
      overCap = true;
      chunks.length = 0;
    }
    if (!overCap) chunks.push(buf);
  }
  if (overCap) throw new PayloadTooLargeError(total);
  const text = Buffer.concat(chunks).toString("utf8");
  return text.length === 0 ? {} : JSON.parse(text);
}

/**
 * Read and parse the JSON body, or answer the request with the right error
 * status and return null: 413 for an over-cap body, 400 for unparseable JSON
 * or JSON that isn't an object. Rejections are logged — a silently swallowed
 * 4xx here is invisible from outside the sandbox and very hard to debug.
 */
async function readJsonBodyOrRespond(
  req: IncomingMessage,
  res: ServerResponse,
  route: string,
): Promise<Record<string, unknown> | null> {
  let parsed: unknown;
  try {
    parsed = await readJsonBody(req);
  } catch (err) {
    const tooLarge = err instanceof PayloadTooLargeError;
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`[supervisor] ${route} body rejected: ${message}`);
    json(res, tooLarge ? 413 : 400, { error: tooLarge ? "payload too large" : "bad json" });
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    // eslint-disable-next-line no-console
    console.error(`[supervisor] ${route} body rejected: not a JSON object`);
    json(res, 400, { error: "bad json" });
    return null;
  }
  return parsed as Record<string, unknown>;
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  if (body === undefined) {
    res.end();
    return;
  }
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
