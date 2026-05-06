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
import { createConversationHub } from "./conversationHub";
import { createPostPersister } from "./postPersister";
import { startSupervisor, SupervisorDeps } from "./server";
import { startHeartbeat } from "./heartbeat";

interface SupervisorEnv {
  supervisorSecret: string;
  sandboxId: string;
  backendBaseUrl: string;
  port: number;
  userId: string;
  projectId: string;
  callbackToken: string;
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
    port: Number(process.env.SUPERVISOR_PORT ?? "3000"),
    userId: required("USER_ID"),
    projectId: required("PROJECT_ID"),
    callbackToken: required("CALLBACK_TOKEN"),
  };
}

export function bootSupervisor() {
  const env = readEnv();

  const postPersister = createPostPersister({
    backendBaseUrl: env.backendBaseUrl,
    authToken: env.callbackToken,
  });

  const hub = createConversationHub({ postPersister });

  const deps: SupervisorDeps = {
    env: {
      supervisorSecret: env.supervisorSecret,
      sandboxId: env.sandboxId,
      backendBaseUrl: env.backendBaseUrl,
      userId: env.userId,
      projectId: env.projectId,
    },
    dispatchTurn: (req) =>
      hub.dispatch(
        {
          conversationId: req.conversationId,
          prompt: req.prompt,
          claudeSessionId: req.claudeSessionId,
          bootstrapJsonl: req.bootstrapJsonl,
        },
        { CWD: "/vercel/sandbox" },
      ),
    cancelTurn: (id) => hub.cancel(id),
    subscribeSse: (id, sink, sinceSeq) => hub.subscribe(id, sink, sinceSeq),
    getStateSnapshot: () => hub.snapshot(),
  };

  const server = startSupervisor(deps, env.port);

  const heartbeat = startHeartbeat({
    sandboxId: env.sandboxId,
    backendBaseUrl: env.backendBaseUrl,
    authToken: env.callbackToken,
    getSnapshot: () => hub.snapshot(),
  });

  const shutdown = async () => {
    heartbeat.stop();
    server.close();
    await postPersister.drain();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

if (require.main === module) {
  bootSupervisor();
}
