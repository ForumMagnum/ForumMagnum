/**
 * Supervisor entrypoint. This module is the program that runs **inside** the
 * sandbox — sandboxManager copies the supervisor source in (via `sandbox.writeFiles`
 * or a git source) and starts it with `node /vercel/sandbox/supervisor.js`.
 *
 * Wires together:
 *  - HTTP server  (`./server.ts`) — auth-gated endpoints
 *  - Conversation hub (`./conversationHub.ts`) — runner + SSE fanout + buffer
 *  - Post persister (`./postPersister.ts`) — batched POSTs with retry
 *  - Heartbeat (`./heartbeat.ts`) — periodic /sandboxes/:id/heartbeat
 *
 * Required env (injected by sandboxManager at create time):
 *  - SUPERVISOR_SECRET    — HMAC key for inbound auth
 *  - SANDBOX_ID           — Vercel Sandbox id
 *  - BACKEND_BASE_URL     — origin to POST to (events, heartbeats)
 *  - SUPERVISOR_PORT      — port to listen on (default 3000)
 *  - USER_ID, PROJECT_ID  — for context / heartbeat metadata
 *  - CALLBACK_TOKEN       — JWT minted by the backend (T3's mintSandboxCallbackToken),
 *                           sent as Bearer on supervisor → backend POSTs
 *  - CLAUDE_CODE_OAUTH_TOKEN — passed through to claude subprocesses
 */
import * as fs from "node:fs";
import { createConversationHub } from "./conversationHub";
import { createPostPersister } from "./postPersister";
import { startSupervisor, SupervisorDeps } from "./server";
import { startHeartbeat } from "./heartbeat";
import { createHealthTracker } from "./healthTracker";
import { startDevServer, DevServerHandle } from "./devServer";
import { startAuthProxy } from "./authProxy";

const CLAUDE_MD_PATH = "/vercel/sandbox/CLAUDE.md";

/** Where the in-sandbox agent runs `claude` — the repo root for a coding conversation. */
const DEFAULT_WORKSPACE_DIR = "/vercel/sandbox";

/**
 * Substitute the `{{RESEARCH_PROJECT_ID}}` placeholder (and any other
 * provisioning-time placeholders we add later) in the agent's CLAUDE.md so
 * Claude Code's auto-loaded system prompt knows what project the agent is
 * scoped to. The shipped file in the snapshot has the literal placeholder;
 * we rewrite it once at supervisor boot, before any `claude` subprocess
 * starts. Best-effort: a missing or unwritable file just logs and
 * continues — the agent loses the project-id hint but otherwise works.
 */
function fillClaudeMdTemplate(env: { projectId: string }): void {
  try {
    const template = fs.readFileSync(CLAUDE_MD_PATH, "utf8");
    const filled = template.replace(/\{\{RESEARCH_PROJECT_ID\}\}/g, env.projectId);
    if (filled !== template) {
      fs.writeFileSync(CLAUDE_MD_PATH, filled, "utf8");
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[supervisor] could not fill CLAUDE.md template: ${(err as Error).message}`);
  }
}

/**
 * The dev-server half of the env, present only for a coding conversation whose
 * repo defines a `devCommand`. All-or-nothing: the dev server + auth-proxy
 * start only when every field is set.
 */
interface DevServerEnv {
  command: string;
  port: number;
  cwd: string;
  proxySecret: string;
  authProxyPort: number;
  /** The repo's `.env` values, injected by the backend at launch (§3.6). */
  extraEnv: Record<string, string>;
}

interface SupervisorEnv {
  supervisorSecret: string;
  sandboxId: string;
  backendBaseUrl: string;
  port: number;
  userId: string;
  projectId: string;
  callbackToken: string;
  /** Agent working directory — the repo root for a coding conversation. */
  workspaceDir: string;
  /** Present iff this is a coding conversation with a dev server. */
  devServer: DevServerEnv | null;
}

/** Parse `DEV_ENV_JSON` (a JSON object of repo `.env` values) defensively. */
function readDevExtraEnv(): Record<string, string> {
  const raw = process.env.DEV_ENV_JSON;
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    // eslint-disable-next-line no-console
    console.warn("[supervisor] DEV_ENV_JSON was not valid JSON — ignoring");
    return {};
  }
}

/** Read the optional dev-server env; null unless every required field is set. */
function readDevServerEnv(workspaceDir: string): DevServerEnv | null {
  const command = process.env.DEV_COMMAND;
  const port = Number(process.env.DEV_PORT);
  const proxySecret = process.env.DEV_PROXY_SECRET;
  const authProxyPort = Number(process.env.AUTH_PROXY_PORT);
  if (!command || !proxySecret || !Number.isFinite(port) || !Number.isFinite(authProxyPort)) {
    return null;
  }
  return {
    command,
    port,
    cwd: process.env.DEV_CWD || workspaceDir,
    proxySecret,
    authProxyPort,
    extraEnv: readDevExtraEnv(),
  };
}

function readEnv(): SupervisorEnv {
  const required = (k: string): string => {
    const v = process.env[k];
    if (!v) throw new Error(`supervisor: missing required env ${k}`);
    return v;
  };
  const workspaceDir = process.env.WORKSPACE_DIR || DEFAULT_WORKSPACE_DIR;
  return {
    supervisorSecret: required("SUPERVISOR_SECRET"),
    sandboxId: required("SANDBOX_ID"),
    backendBaseUrl: required("BACKEND_BASE_URL"),
    port: Number(process.env.SUPERVISOR_PORT ?? "3000"),
    userId: required("USER_ID"),
    projectId: required("PROJECT_ID"),
    callbackToken: required("CALLBACK_TOKEN"),
    workspaceDir,
    devServer: readDevServerEnv(workspaceDir),
  };
}

export function bootSupervisor() {
  const env = readEnv();
  fillClaudeMdTemplate({ projectId: env.projectId });

  const healthTracker = createHealthTracker();

  const postPersister = createPostPersister({
    backendBaseUrl: env.backendBaseUrl,
    authToken: env.callbackToken,
    healthTracker,
  });

  const hub = createConversationHub({ postPersister, healthTracker });

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
          bootstrapJsonl: req.bootstrapJsonl,
        },
        {
          // The repo root for a coding conversation, `/vercel/sandbox` otherwise.
          CWD: env.workspaceDir,
          // Put `/vercel/sandbox/bin` (where buildResearchSandboxSnapshot drops the
          // research-tool binary) ahead of the system PATH so the agent can
          // invoke `research-tool ...` directly from Bash. We can't install
          // to /usr/local/bin from the snapshot builder (no root on tarball
          // extract), so this is how the binary becomes "on PATH".
          PATH: `/vercel/sandbox/bin:${process.env.PATH ?? ""}`,
          // research-tool's required env. The token is the *agent-scoped*
          // sandbox-callback bearer the backend mints per dispatch — the
          // supervisor's own CALLBACK_TOKEN would 403 on every document /
          // conversation endpoint (those require an agent scope tied to the
          // current conversationId).
          RESEARCH_BACKEND_BASE_URL: env.backendBaseUrl,
          RESEARCH_BACKEND_TOKEN: req.agentBackendToken,
          RESEARCH_PROJECT_ID: env.projectId,
        },
      );
    },
    cancelTurn: (id) => hub.cancel(id),
    subscribeSse: (id, sink, sinceSeq) => hub.subscribe(id, sink, sinceSeq),
    getStateSnapshot: () => hub.snapshot(),
  };

  const server = startSupervisor(deps, env.port);

  // Coding conversations with a `devCommand`: spawn the dev server and the
  // auth-proxy that gates public access to it. Proxied requests bump
  // `lastDevActivityAt` so dev-server use counts as activity for the idle
  // policy even when there is no chat traffic.
  let devServer: DevServerHandle | null = null;
  let authProxy: ReturnType<typeof startAuthProxy> | null = null;
  let lastDevActivityAt = 0;
  if (env.devServer) {
    const dev = env.devServer;
    devServer = startDevServer({
      command: dev.command,
      port: dev.port,
      cwd: dev.cwd,
      env: dev.extraEnv,
    });
    authProxy = startAuthProxy({
      port: dev.authProxyPort,
      devPort: dev.port,
      proxySecret: dev.proxySecret,
      sandboxId: env.sandboxId,
      devServer,
      onActivity: () => { lastDevActivityAt = Date.now(); },
    });
  }

  const heartbeat = startHeartbeat({
    sandboxId: env.sandboxId,
    backendBaseUrl: env.backendBaseUrl,
    authToken: env.callbackToken,
    getSnapshot: () => hub.snapshot(),
    getLastDevActivityAt: () => lastDevActivityAt,
    healthTracker,
  });

  const shutdown = async () => {
    heartbeat.stop();
    server.close();
    authProxy?.close();
    devServer?.stop();
    await postPersister.drain();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

if (require.main === module) {
  bootSupervisor();
}
