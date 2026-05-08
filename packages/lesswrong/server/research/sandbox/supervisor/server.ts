/**
 * Supervisor HTTP server. Runs inside the sandbox.
 *
 * Endpoints:
 *   POST /dispatch              — start (or resume) a Claude Code turn
 *   GET  /sse/:conversationId   — SSE stream of JSONL events for that turn
 *   POST /cancel/:conversationId — abort the in-flight turn
 *   GET  /status                — heartbeat: per-conversation states + pressure
 *
 * All endpoints validate an HMAC-signed bearer in `Authorization: Bearer ...`
 * (or, for SSE only, `?token=...` on the query). The shared secret comes from
 * the `SUPERVISOR_SECRET` env var injected at sandbox-create time.
 *
 * This module exports `startSupervisor(deps)` rather than calling `listen()`
 * at import time so the dispatch / cancel handlers can be injected from the
 * subprocess-runner module (#19) without circular imports.
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
  /**
   * Start (or resume) a turn. Implementation lives in #19.
   * Resolves once the turn is fully streamed/persisted.
   */
  dispatchTurn(req: DispatchRequest): Promise<{ accepted: boolean; reason?: string }>;
  /** Cancel the in-flight turn for a conversation. */
  cancelTurn(conversationId: string): Promise<void>;
  /**
   * Subscribe an SSE writer to live events for a conversation. If `sinceSeq`
   * is provided, replay any buffered events with seq > sinceSeq before tailing.
   */
  subscribeSse(conversationId: string, sink: SseSink, sinceSeq?: number): SseUnsubscribe;
  /** Snapshot of per-conversation state for /status. */
  getStateSnapshot(): {
    conversations: ConversationState[];
    concurrencyCount: number;
  };
}

export interface DispatchRequest {
  conversationId: string;
  prompt: string;
  /** If set, --resume <claudeSessionId>. */
  claudeSessionId?: string;
  /** Synthesized JSONL lines to seed the session dir before --resume (#21). */
  bootstrapJsonl?: string[];
  /** References attached as part of the user turn (file paths, doc handles, etc.). */
  references?: unknown[];
  /**
   * Agent-scoped sandbox-callback bearer minted by the backend per dispatch
   * (≤30min TTL). The supervisor passes this — not its own supervisor-scoped
   * `CALLBACK_TOKEN` — to the Claude Code subprocess as
   * `RESEARCH_BACKEND_TOKEN`, so `research-tool` calls hit endpoints that
   * require an agent scope (e.g. `documents/:id` GET, edit-doc).
   */
  agentBackendToken?: string;
}

export type SseSink = (event: { event?: string; data: string; id?: string }) => void;
export type SseUnsubscribe = () => void;

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
  // signed token (carried as a query param on SSE, as a Bearer header on
  // POSTs). Any browser-origin can connect to the SSE stream as long as it
  // has a valid token. Keeping this open simplifies dev (localhost:3000) and
  // prod (the deployed app) without an allowlist.
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

  const sseMatch = path.match(/^\/sse\/([^/]+)$/);
  if (sseMatch && method === "GET") {
    const conversationId = sseMatch[1];
    if (!supervisorTokenCanAccessConversation(validation.payload, conversationId)) {
      return json(res, 403, { error: "forbidden", reason: "conversation scope mismatch" });
    }
    // Resume position is taken from the SSE protocol's `Last-Event-ID`
    // header, which EventSource sets automatically on reconnect using the
    // most recent `id:` value it received. The id is the supervisor's local
    // buffer seq — opaque to the client, used only here for replay.
    const lastEventId = req.headers["last-event-id"];
    const lastEventIdNum = typeof lastEventId === "string" ? Number(lastEventId) : NaN;
    const sinceSeq = Number.isFinite(lastEventIdNum) ? lastEventIdNum : undefined;
    return handleSse(req, res, conversationId, deps, sinceSeq);
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

function handleSse(
  req: IncomingMessage,
  res: ServerResponse,
  conversationId: string,
  deps: SupervisorDeps,
  sinceSeq?: number,
) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const sink: SseSink = (event) => {
    if (res.writableEnded) return;
    if (event.id !== undefined) res.write(`id: ${event.id}\n`);
    if (event.event) res.write(`event: ${event.event}\n`);
    for (const line of event.data.split("\n")) {
      res.write(`data: ${line}\n`);
    }
    res.write("\n");
  };

  const heartbeat = setInterval(() => {
    if (res.writableEnded) return;
    res.write(": heartbeat\n\n");
  }, 15_000);

  const unsubscribe = deps.subscribeSse(conversationId, sink, sinceSeq);

  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe();
    if (!res.writableEnded) res.end();
  };
  req.on("close", cleanup);
  req.on("error", cleanup);
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
  if (Array.isArray(body.bootstrapJsonl)) {
    out.bootstrapJsonl = body.bootstrapJsonl.filter((s): s is string => typeof s === "string");
  }
  if (Array.isArray(body.references)) out.references = body.references;
  if (typeof body.agentBackendToken === "string") out.agentBackendToken = body.agentBackendToken;
  return out;
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
