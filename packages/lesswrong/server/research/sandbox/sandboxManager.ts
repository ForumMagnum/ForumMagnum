/**
 * sandboxManager — provisions and tracks Vercel Sandboxes for research conversations.
 *
 * One sandbox per `(userId, projectId)`, with the supervisor process inside it
 * multiplexing multiple Claude Code subprocesses. Spillover: if every sandbox
 * for a `(user, project)` is at the per-sandbox concurrency cap, provision an
 * additional sandbox.
 *
 * See `research-tool-design.md` ("Sandbox lifecycle and conversation execution").
 */
import { Sandbox } from "@vercel/sandbox";
import { randomId, randomSecret } from "@/lib/random";
import { mintSupervisorCallbackToken } from "../../../../../app/api/research/agent/researchAgentAuth";
import { decryptClaudeCodeTokenRef } from "@/server/research/claudeCodeTokens";

export interface SandboxSessionRecord {
  _id: string;
  userId: string;
  projectId: string;
  vercelSandboxId: string;
  endpointUrl: string;
  supervisorSecret: string;
  status: "provisioning" | "active" | "idle" | "stopped";
  concurrencyCount: number;
  lastUsedAt: Date;
  expiresAt: Date;
}

/** Max concurrent claude-code subprocesses per sandbox before spillover. */
export const PER_SANDBOX_CONCURRENCY_CAP = 5;
/** Sandbox `timeout` at create time (ms). Capped at 5h on Pro/Enterprise. */
export const SANDBOX_TIMEOUT_MS = 60 * 60 * 1000;
export const SUPERVISOR_PORT = 3000;

export async function getOrCreateSandbox(
  userId: string,
  projectId: string,
  context: ResolverContext,
): Promise<SandboxSessionRecord> {
  const { ResearchSandboxSessions } = context;
  const existing = await ResearchSandboxSessions.find(
    { userId, projectId, status: { $in: ["active", "provisioning"] } },
    { sort: { lastUsedAt: -1 } },
  ).fetch();
  const candidates = existing.filter(
    (r) => (r.concurrencyCount ?? 0) < PER_SANDBOX_CONCURRENCY_CAP,
  );
  for (const candidate of candidates) {
    const record = toSandboxSessionRecord(candidate);
    const sandbox = await tryReuseSandbox(record, context);
    if (sandbox) {
      await ResearchSandboxSessions.rawUpdateOne(
        { _id: record._id },
        { $set: { lastUsedAt: new Date() } },
      );
      return record;
    }
    // If the candidate's Vercel-side sandbox is gone (stopped, failed, or
    // never existed), tryReuseSandbox already marked our row stopped. Fall
    // through to either the next candidate or fresh provisioning.
  }
  return await provisionNewSandbox(userId, projectId, context);
}

function toSandboxSessionRecord(r: DbResearchSandboxSession): SandboxSessionRecord {
  return {
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
  };
}

/**
 * Returns a live Sandbox handle for `record` if the underlying Vercel sandbox
 * is still running, or `null` if the sandbox is gone (in which case the row
 * is marked `stopped` so future calls don't re-pick it). Always re-fetches
 * via `Sandbox.get` rather than reading a cached handle: the SDK's `.status`
 * is a frozen getter set at construction time, so a sandbox that died
 * externally (timeout, manual stop, Vercel-side cleanup) is invisible to a
 * cached handle. The Vercel Functions ↔ Sandboxes round-trip is intra-DC, so
 * the cost is small relative to the dispatch path it's gating.
 */
async function tryReuseSandbox(
  record: SandboxSessionRecord,
  context: ResolverContext,
): Promise<Sandbox | null> {
  try {
    const sandbox = await Sandbox.get({ sandboxId: record.vercelSandboxId });
    if (sandbox.status !== "running") {
      await context.ResearchSandboxSessions.rawUpdateOne(
        { _id: record._id },
        { $set: { status: "stopped" } },
      );
      return null;
    }
    return sandbox;
  } catch (err) {
    // Sandbox.get throws if the sandbox no longer exists. Mark our row
    // stopped so we don't try again.
    await context.ResearchSandboxSessions.rawUpdateOne(
      { _id: record._id },
      { $set: { status: "stopped" } },
    );
    // eslint-disable-next-line no-console
    console.warn(
      `[sandbox] dropping stale record ${record._id} (${record.vercelSandboxId}): ${(err as Error).message}`,
    );
    return null;
  }
}

async function provisionNewSandbox(
  userId: string,
  projectId: string,
  context: ResolverContext,
): Promise<SandboxSessionRecord> {
  const supervisorSecret = randomSecret();
  const claudeToken = await resolveClaudeCodeToken(projectId, context);

  // We require a pre-built snapshot containing claude-code + the supervisor
  // bundle + research-tool CLI. There is no install/upload fallback at
  // runtime — that path would do build-time work in the request hot path.
  // Build the snapshot via:
  //   yarn research-supervisor-build && yarn research-sandbox-build-snapshot
  const snapshotId = process.env.RESEARCH_SANDBOX_SNAPSHOT_ID;
  if (!snapshotId) {
    throw new Error(
      "[sandbox] No snapshot configured. Set RESEARCH_SANDBOX_SNAPSHOT_ID in your env after building one with " +
      "`yarn research-supervisor-build && yarn research-sandbox-build-snapshot`. " +
      "Runtime sandbox provisioning never bundles or installs anything.",
    );
  }

  // The supervisor (running inside a Vercel Sandbox) POSTs persistence events
  // and heartbeats here. Localhost won't reach a dev machine from inside the
  // sandbox — point this at a tunnel (ngrok/Cloudflare) for local dev, or the
  // deployed app's URL in prod. Falls back to NEXT_PUBLIC_BASE_URL → localhost
  // so the page at least loads, but persistence/heartbeats will silently fail
  // without a reachable URL.
  const backendBaseUrl = process.env.RESEARCH_BACKEND_PUBLIC_URL
    ?? process.env.NEXT_PUBLIC_BASE_URL
    ?? "http://localhost:3000";

  // env passed at create-time becomes the default env for every runCommand
  // invocation in this sandbox. The supervisor invocation downstream
  // inherits these without having to repeat them.
  const sharedEnv: Record<string, string> = {
    CLAUDE_CODE_OAUTH_TOKEN: claudeToken,
    SUPERVISOR_SECRET: supervisorSecret,
    BACKEND_BASE_URL: backendBaseUrl,
    SUPERVISOR_PORT: String(SUPERVISOR_PORT),
    USER_ID: userId,
    PROJECT_ID: projectId,
  };

  const sandbox = await Sandbox.create({
    ports: [SUPERVISOR_PORT],
    timeout: SANDBOX_TIMEOUT_MS,
    resources: { vcpus: 2 },
    env: sharedEnv,
    source: { type: "snapshot", snapshotId },
  });
  const endpointUrl = sandbox.domain(SUPERVISOR_PORT);

  // Mint the supervisor's callback bearer once at provision time. Sandbox-
  // wide and ≤6h lifetime so the supervisor doesn't need to refresh during
  // a normal session. (Sandbox itself caps at the Vercel timeout, currently
  // 1h via SANDBOX_TIMEOUT_MS.)
  const callbackToken = mintSupervisorCallbackToken({
    sandboxId: sandbox.sandboxId,
    projectId,
    userId,
    ttlSeconds: Math.ceil(SANDBOX_TIMEOUT_MS / 1000) + 600, // sandbox lifetime + 10 min buffer
  });

  // Start the supervisor in the background. The supervisor.js file is
  // already on disk in the snapshot. We wrap with nohup + setsid + stdout
  // redirect because `runCommand({detached:true})` alone doesn't fully
  // dissociate the child from the runCommand RPC channel — when the channel
  // closes, the child receives SIGHUP and exits. Logs land in
  // /vercel/sandbox/supervisor.log for post-hoc inspection.
  await sandbox.runCommand({
    cmd: "sh",
    args: [
      "-c",
      "nohup setsid node /vercel/sandbox/supervisor.js > /vercel/sandbox/supervisor.log 2>&1 < /dev/null &",
    ],
    env: {
      CALLBACK_TOKEN: callbackToken,
      SANDBOX_ID: sandbox.sandboxId,
    },
  });

  // Best-effort wait for the supervisor to bind its port. We poll /health
  // rather than blocking on a fixed sleep — typically ready in <2s.
  await waitForSupervisorReady(endpointUrl).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`[sandbox] ${sandbox.sandboxId} supervisor health check failed: ${err.message}`);
    // We still register the sandbox; first dispatch will retry/fail loudly.
  });

  const _id = randomId();
  const now = new Date();
  const record: SandboxSessionRecord = {
    _id,
    userId,
    projectId,
    vercelSandboxId: sandbox.sandboxId,
    endpointUrl,
    supervisorSecret,
    status: "active",
    concurrencyCount: 0,
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + SANDBOX_TIMEOUT_MS),
  };
  await context.ResearchSandboxSessions.rawInsert({
    ...record,
    createdAt: now,
  });
  return record;
}

/**
 * Pulls the user's Claude Code OAuth token from `ResearchProjects.claudeCodeTokenRef`.
 *
 * New writes store encrypted token refs. Plaintext refs from earlier prototype
 * rows are still accepted so existing dev projects do not need a migration
 * before they can be opened.
 *
 * Architecturally this token belongs on the `User` row long-term (1:N
 * user-to-project), but we're keeping it on the project for now because the
 * column is already there and the prototype is single-user.
 *
 * If the column is unset, we fail loudly rather than falling back to a process
 * env var: silently using a shared backend-deploy token instead of the user's
 * personal one would charge the wrong account and is a footgun in a multi-user
 * deployment.
 */
async function resolveClaudeCodeToken(projectId: string, context: ResolverContext): Promise<string> {
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
  return decryptClaudeCodeTokenRef(ref);
}

async function waitForSupervisorReady(endpointUrl: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  let lastErr: unknown = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${endpointUrl}/health`);
      if (res.ok) return;
      lastErr = new Error(`status ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`supervisor not ready within 30s: ${(lastErr as Error)?.message ?? "unknown"}`);
}

/**
 * Stop a sandbox and mark its row stopped. Idempotent — `Sandbox.get` failure
 * (sandbox already gone) is treated the same as a successful stop, since the
 * end state we want — row marked stopped, sandbox not running — is reached
 * either way.
 */
export async function stopSandbox(
  record: SandboxSessionRecord,
  context: ResolverContext,
): Promise<void> {
  try {
    const sandbox = await Sandbox.get({ sandboxId: record.vercelSandboxId });
    await sandbox.stop({ blocking: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[sandboxManager] stop best-effort for ${record._id}: ${(err as Error).message}`);
  }
  await context.ResearchSandboxSessions.rawUpdateOne(
    { _id: record._id },
    { $set: { status: "stopped" } },
  );
}
