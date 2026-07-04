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
  /** Synthesized JSONL lines to seed the session dir before --resume. */
  bootstrapJsonl?: string[];
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
    const body = await readJsonBody(req).catch((e) => ({ __err: e }));
    if ("__err" in body) {
      return json(res, 400, { error: "bad json" });
    }
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
    const body = await readJsonBody(req).catch((e) => ({ __err: e }));
    if ("__err" in body) {
      return json(res, 400, { error: "bad json" });
    }
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
  if (Array.isArray(body.bootstrapJsonl)) {
    out.bootstrapJsonl = body.bootstrapJsonl.filter((s): s is string => typeof s === "string");
  }
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

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    if (chunks.reduce((n, c) => n + c.length, 0) > 1_000_000) {
      throw new Error("payload too large");
    }
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text.length === 0 ? {} : JSON.parse(text);
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
