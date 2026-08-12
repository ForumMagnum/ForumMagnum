/**
 * Supervisor entrypoint. This module is the program that runs **inside** the
 * sandbox — the backend overlays the bundled supervisor at `~/.research/supervisor.js`
 * at every launch and starts it with `node ~/.research/supervisor.js`.
 *
 * Wires together:
 *  - HTTP server  (`./server.ts`) — auth-gated endpoints
 *  - Conversation hub (`./conversationHub.ts`) — per-conversation Claude runner
 *  - Post persister (`./postPersister.ts`) — durable per-event POSTs with retry
 *  - Heartbeat (`./heartbeat.ts`) — periodic /sandboxes/:id/heartbeat
 *  - Auth-proxy (`./authProxy.ts`) — always-on, fronts the dev server
 *
 * Required env (injected by sandboxManager at launch):
 *  - SUPERVISOR_SECRET    — HMAC key for inbound auth
 *  - SANDBOX_ID           — Vercel Sandbox id
 *  - BACKEND_BASE_URL     — origin to POST to (events, heartbeats)
 *  - SUPERVISOR_PORT      — port to listen on (9280)
 *  - AUTH_PROXY_PORT      — auth-proxy public port (9281)
 *  - DEV_PROXY_SECRET     — HMAC key for dev-preview tokens
 *  - USER_ID, PROJECT_ID  — for context / heartbeat metadata
 *  - CONVERSATION_ID      — this sandbox's conversation (scopes queue recovery)
 *  - CALLBACK_TOKEN       — JWT minted by the backend, sent as Bearer on supervisor → backend POSTs
 *  - CLAUDE_CODE_OAUTH_TOKEN — passed through to claude subprocesses
 *  - QUEUE_DIR            — durable event-queue directory (~/.research/queue)
 *  - INIT_SCRIPT_PATH     — per-boot script path (/vercel/sandbox/init.sh)
 */
import * as fs from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";
import { spawn } from "node:child_process";
import type { Server } from "node:http";
import { createConversationHub, enqueueSyntheticInterruptedResult } from "./conversationHub";
import { createPostPersister, PostPersister } from "./postPersister";
import { startSupervisor, SupervisorDeps } from "./server";
import { startHeartbeat } from "./heartbeat";
import { createDevServerManager, startDevControlServer, DEV_CONTROL_PORT } from "./devServerManager";
import { buildScriptBootEnv, researchBinPath } from "./devServer";
import { startAuthProxy } from "./authProxy";
import { AGENT_CWD } from "../sandboxLayout";

// init.sh runs non-blocking (it doesn't gate boot or the agent's turn), so this
// is only a hung-process reaper, not a latency budget. Allow several minutes so a
// legitimate per-boot dependency reconcile (`npm install` after a pull whose
// lockfile changed) can finish — the dev-server start comes after it.
const INIT_SCRIPT_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Per-conversation context appended to Claude Code's default system prompt
 * (`--append-system-prompt`) at process spawn. This replaces the old scheme of
 * substituting `{{...}}` placeholders into the overlaid CLAUDE.md at boot:
 * the values are per-conversation constants known from env, and keeping them
 * out of the on-disk file means a re-launch can never observe a stale fill.
 * The static agent instructions still ship as CLAUDE.md and are auto-loaded.
 */
function buildAppendSystemPrompt(env: { projectId: string; conversationId: string }): string {
  return [
    `You are working in research project \`${env.projectId}\`. All`,
    `\`research-tool\` calls are scoped to this project automatically (the`,
    `bearer token pins it server-side, so cross-project requests are`,
    `rejected). You can't pivot to a different project from this sandbox.`,
    ``,
    `Your current conversation id is \`${env.conversationId}\`. If fetched`,
    `document markdown, a \`fetch-conversation\` result, an \`@[conv:...]\``,
    `mention, or an \`%%% agent-block conversationId="..." %%%\` placeholder`,
    `refers to this same id, treat it as this conversation, including text you`,
    `may have written earlier in the same task. Do not mistake it for an`,
    `independent prior/sibling conversation.`,
  ].join("\n");
}

interface SupervisorEnv {
  supervisorSecret: string;
  sandboxId: string;
  backendBaseUrl: string;
  port: number;
  authProxyPort: number;
  devProxySecret: string;
  userId: string;
  projectId: string;
  conversationId: string;
  callbackToken: string;
  queueDir: string;
  initScriptPath: string;
}

function readEnv(): SupervisorEnv {
  const required = (k: string): string => {
    const v = process.env[k];
    if (!v) throw new Error(`supervisor: missing required env ${k}`);
    return v;
  };
  return {
    supervisorSecret: required("SUPERVISOR_SECRET"),
    sandboxId: required("SANDBOX_ID"),
    backendBaseUrl: required("BACKEND_BASE_URL"),
    port: Number(process.env.SUPERVISOR_PORT ?? "9280"),
    authProxyPort: Number(process.env.AUTH_PROXY_PORT ?? "9281"),
    devProxySecret: required("DEV_PROXY_SECRET"),
    userId: required("USER_ID"),
    projectId: required("PROJECT_ID"),
    conversationId: required("CONVERSATION_ID"),
    callbackToken: required("CALLBACK_TOKEN"),
    queueDir: process.env.QUEUE_DIR || path.join(homedir(), ".research", "queue"),
    initScriptPath: process.env.INIT_SCRIPT_PATH || `${AGENT_CWD}/init.sh`,
  };
}

function runInitScript(
  env: SupervisorEnv,
  surfaceSystem: (text: string) => void,
  onComplete: () => void,
): void {
  let completed = false;
  const finish = () => {
    if (completed) return;
    completed = true;
    onComplete();
  };
  if (!fs.existsSync(env.initScriptPath)) {
    finish();
    return;
  }
  const initEnv: NodeJS.ProcessEnv = buildScriptBootEnv();
  const child = spawn("sh", [env.initScriptPath], {
    cwd: AGENT_CWD,
    env: initEnv,
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
    if (stderr.length > 16_000) stderr = stderr.slice(-16_000);
  });
  const timer = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.warn(`[supervisor] init.sh timed out after ${INIT_SCRIPT_TIMEOUT_MS}ms; continuing`);
    child.kill("SIGTERM");
  }, INIT_SCRIPT_TIMEOUT_MS);
  timer.unref();
  child.on("error", (err) => {
    clearTimeout(timer);
    surfaceSystem(`init.sh failed to start: ${err.message}`);
    finish();
  });
  child.on("close", (code, signal) => {
    clearTimeout(timer);
    // Surface a system event only on a genuine failure (non-zero exit or a
    // timeout kill). `init.sh` runs on *every* resume and benign steps (git pull
    // progress, dep/deprecation warnings) write to stderr without failing —
    // surfacing those would spam the transcript on every boot. Include the
    // stderr tail when we do surface, since that's where the cause is.
    if (code !== 0 || signal) {
      const trimmed = stderr.trim();
      surfaceSystem(
        `init.sh ${signal ? `killed (${signal})` : `exited (code ${code})`}` +
          (trimmed ? `\n${trimmed}` : ""),
      );
    }
    finish();
  });
}

async function selfHealDanglingTurn(
  env: SupervisorEnv,
  postPersister: PostPersister,
  isTurnRunning: () => boolean,
): Promise<void> {
  try {
    const url = `${env.backendBaseUrl}/api/research/agent/conversations/${encodeURIComponent(
      env.conversationId,
    )}/transcript?danglingCheck=1`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${env.callbackToken}` } });
    if (!res.ok) return;
    const body = (await res.json()) as { incompleteTurn?: unknown };
    if (body.incompleteTurn !== true) return;
    // Re-check AFTER the (async) fetch: if a turn is now actually running in this
    // supervisor, the "incomplete" turn is the live just-dispatched one, not an
    // orphan — emitting a synthetic terminal would falsely close it. Skip.
    if (isTurnRunning()) return;
    enqueueSyntheticInterruptedResult(
      postPersister,
      env.conversationId,
      "Turn interrupted by a sandbox restart.",
      Date.now(),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[supervisor] dangling-turn self-heal failed: ${(err as Error).message}`);
  }
}

export async function bootSupervisor() {
  const env = readEnv();
  const appendSystemPrompt = buildAppendSystemPrompt({
    projectId: env.projectId,
    conversationId: env.conversationId,
  });

  const postPersister = createPostPersister({
    backendBaseUrl: env.backendBaseUrl,
    authToken: env.callbackToken,
    conversationId: env.conversationId,
    queueDir: env.queueDir,
  });

  const hub = createConversationHub({ postPersister });

  // Resume shipping any events a prior session durably queued but never got an
  // ack for. Scoped to this sandbox's own conversation, so a forked child can't
  // re-ship the source conversation's inherited queue files.
  postPersister.recover();

  const surfaceSystem = (text: string) => {
    postPersister.enqueue(env.conversationId, {
      rawJsonl: JSON.stringify({ type: "system", subtype: "supervisor", text }),
      kind: "system",
      claudeMessageUuid: null,
      supervisorEmittedAt: new Date().toISOString(),
    });
  };

  const deps: SupervisorDeps = {
    env: {
      supervisorSecret: env.supervisorSecret,
      sandboxId: env.sandboxId,
      backendBaseUrl: env.backendBaseUrl,
      userId: env.userId,
      projectId: env.projectId,
    },
    dispatchTurn: (req) => {
      if (!req.agentBackendToken) {
        // Hard error rather than silently falling back to the supervisor
        // token: that would 403 on every document/conversation endpoint
        // (which require an agent-scoped bearer) and we'd just re-create
        // the very bug this field exists to fix.
        throw new Error(
          "supervisor: dispatch missing required agentBackendToken; backend must mint one per dispatch",
        );
      }
      return hub.dispatch(
        {
          conversationId: req.conversationId,
          prompt: req.prompt,
          claudeSessionId: req.claudeSessionId,
          sessionHasHistory: req.sessionHasHistory,
        },
        {
          // The cwd the claude subprocess starts in — also the cwd the
          // session-bootstrap JSONL path is derived from, so `--resume` finds
          // the synthesized history on a fresh sandbox.
          cwd: AGENT_CWD,
          appendSystemPrompt,
          // Spawn-time env for the long-lived claude process. The agent token
          // is minted per dispatch but only the one in effect at spawn is
          // visible to the process; that's safe because its TTL (48h) exceeds
          // the sandbox session lifetime cap (24h), so a spawn-time token
          // always outlives the process that received it.
          env: {
            // Put `~/.research/bin` (where the overlay drops the research-tool
            // binary) ahead of the system PATH so the agent can invoke
            // `research-tool ...` directly from Bash.
            PATH: researchBinPath(),
            // research-tool's required env. The token is the *agent-scoped*
            // sandbox-callback bearer the backend mints per dispatch.
            RESEARCH_BACKEND_BASE_URL: env.backendBaseUrl,
            RESEARCH_BACKEND_TOKEN: req.agentBackendToken,
            RESEARCH_PROJECT_ID: env.projectId,
            RESEARCH_CONVERSATION_ID: req.conversationId,
            // Lets `research-tool dev …` reach the local dev-server controller.
            RESEARCH_DEV_CONTROL_URL: `http://127.0.0.1:${DEV_CONTROL_PORT}`,
          },
        },
      );
    },
    cancelTurn: (id) => hub.cancel(id),
    answerQuestion: (id, toolUseId, answers) => hub.answerQuestion(id, toolUseId, answers),
    getStateSnapshot: () => {
      const snap = hub.snapshot();
      return {
        conversations: snap.conversations,
        concurrencyCount: snap.concurrencyCount,
        // Includes pending background tasks, matching the heartbeat: the
        // /status consumer that matters is saveEnvironment's quiesce gate,
        // and snapshotting stops the sandbox — which would kill a pending
        // task and its promised re-invocation.
        turnRunning: hub.hasPendingWork(),
        pendingEvents: postPersister.pendingCount(),
      };
    },
  };

  const server = startSupervisor(deps, env.port);

  // The supervisor owns the dev server: it runs the agent's `dev-server.sh`,
  // restarts it on exit, and exposes start/stop/restart. The always-on
  // auth-proxy fronts it and probes the fixed dev port per request; proxied
  // requests bump `lastDevActivityAt` so dev-server use counts as activity for
  // the idle policy.
  let lastDevActivityAt = 0;
  const devServer = createDevServerManager(surfaceSystem);
  const authProxy: Server = startAuthProxy({
    port: env.authProxyPort,
    proxySecret: env.devProxySecret,
    sandboxId: env.sandboxId,
    devServer,
    onActivity: () => { lastDevActivityAt = Date.now(); },
  });
  const devControl: Server = startDevControlServer(devServer);

  // Run per-boot setup to completion, then bring the dev server up. (A fresh
  // environment has the server in `dev-server.sh`; an older one may still start
  // it from `init.sh`, in which case `dev-server.sh` is absent and the manager
  // stays idle.)
  runInitScript(env, surfaceSystem, () => devServer.start());

  selfHealDanglingTurn(env, postPersister, () =>
    hub.snapshot().conversations.some((c) => c.status === "running"),
  ).catch(() => {});

  const heartbeat = startHeartbeat({
    sandboxId: env.sandboxId,
    backendBaseUrl: env.backendBaseUrl,
    authToken: env.callbackToken,
    // Includes pending background tasks, not just running turns: a finished
    // task re-invokes the agent inside the long-lived claude process, so the
    // sandbox must not idle-stop (or roll) out from under it.
    getTurnRunning: () => hub.hasPendingWork(),
    getLastDevActivityAt: () => lastDevActivityAt,
  });

  const shutdown = async () => {
    heartbeat.stop();
    server.close();
    authProxy.close();
    devControl.close();
    devServer.stop();
    // Stop the long-lived claude process(es) first: a kill mid-turn enqueues a
    // synthetic terminal `result` (see the hub's onExit), which the drain below
    // then ships — so a turn cut short by sandbox stop isn't left dangling.
    await hub.shutdown();
    await postPersister.drain();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

if (require.main === module) {
  bootSupervisor().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[supervisor] boot failed", err);
    process.exit(1);
  });
}
