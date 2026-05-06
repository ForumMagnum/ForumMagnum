/**
 * sandboxManager — provisions and tracks Vercel Sandboxes for research conversations.
 *
 * One sandbox per `(userId, projectId)`, with the supervisor process inside it
 * multiplexing multiple Claude Code subprocesses. Spillover: if every sandbox
 * for a `(user, project)` is at the per-sandbox concurrency cap, provision an
 * additional sandbox.
 *
 * See `research-tool-design.md` ("Sandbox lifecycle and conversation execution").
 *
 * The DB-write side of bookkeeping goes through `sandboxRepo` so it can be
 * wired to the real `ResearchSandboxSessions` collection once T1 ships it.
 * Until then, an in-memory implementation keeps the manager runnable in tests
 * and the supervisor smoke flow.
 */
import { Sandbox } from "@vercel/sandbox";
import { randomSecret } from "@/lib/random";
import { mintSupervisorCallbackToken } from "../../../../../app/api/research/agent/researchAgentAuth";

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

export interface SandboxRepo {
  findActiveByProject(userId: string, projectId: string): Promise<SandboxSessionRecord[]>;
  insert(record: Omit<SandboxSessionRecord, "_id">): Promise<SandboxSessionRecord>;
  setStatus(_id: string, status: SandboxSessionRecord["status"]): Promise<void>;
  setConcurrencyCount(_id: string, count: number): Promise<void>;
  touchLastUsedAt(_id: string): Promise<void>;
}

export interface SandboxManagerConfig {
  /**
   * Max concurrent claude-code subprocesses per sandbox before spillover.
   * Design says start at 5; tunable per-deploy.
   */
  perSandboxConcurrencyCap: number;
  /**
   * Sandbox `timeout` at create time (ms). Capped at 5h on Pro/Enterprise.
   */
  sandboxTimeoutMs: number;
  /**
   * Resolve the user's Claude Code OAuth token at sandbox-provision time.
   * Owned by T1's user/project model; injected here so this module stays
   * agnostic to where the token actually lives.
   */
  resolveClaudeCodeToken: (userId: string, projectId: string) => Promise<string>;
  /**
   * Public base URL of the ForumMagnum backend the supervisor will POST to.
   * Surfaces here so the supervisor doesn't have to hardcode it.
   */
  backendBaseUrl: string;
  /**
   * Optional source mounted into the sandbox at create time. Most callers
   * will pass `"none"` (default) and rely on the supervisor being installed
   * lazily by `provisionNewSandbox`. Pass `"snapshot"` (or set the
   * `RESEARCH_SANDBOX_SNAPSHOT_ID` env var) to skip the npm-install hot path
   * — the snapshot should have `@anthropic-ai/claude-code` already installed.
   */
  supervisorSource:
    | { type: "git"; url: string; revision?: string }
    | { type: "tarball"; url: string }
    | { type: "snapshot"; snapshotId: string }
    | { type: "none" };
}

export const DEFAULT_PER_SANDBOX_CAP = 5;
export const DEFAULT_SANDBOX_TIMEOUT_MS = 60 * 60 * 1000;
export const SUPERVISOR_PORT = 3000;

/**
 * Live in-memory handles to the Vercel Sandbox SDK objects, keyed by our DB
 * record `_id`. The manager is a singleton; restarts re-provision on demand.
 */
const liveSandboxes = new Map<string, Sandbox>();

export interface GetOrCreateSandboxResult {
  record: SandboxSessionRecord;
  sandbox: Sandbox;
  /** True if this call provisioned a new sandbox (vs. picking an existing). */
  wasCreated: boolean;
}

export async function getOrCreateSandbox(
  userId: string,
  projectId: string,
  repo: SandboxRepo,
  config: SandboxManagerConfig,
): Promise<GetOrCreateSandboxResult> {
  const existing = await repo.findActiveByProject(userId, projectId);
  const candidates = existing.filter((r) => r.concurrencyCount < config.perSandboxConcurrencyCap);
  for (const candidate of candidates) {
    const sandbox = await tryReuseSandbox(candidate, repo);
    if (sandbox) {
      await repo.touchLastUsedAt(candidate._id);
      return { record: candidate, sandbox, wasCreated: false };
    }
    // If the candidate's Vercel-side sandbox is gone (stopped, failed, or
    // never existed), tryReuseSandbox already marked our row stopped. Fall
    // through to either the next candidate or fresh provisioning.
  }
  return await provisionNewSandbox(userId, projectId, repo, config);
}

/**
 * Returns a live Sandbox handle for `record` if the underlying Vercel sandbox
 * is still running, or `null` if the sandbox is gone (in which case the row
 * is marked `stopped` so future calls don't re-pick it). This keeps DB state
 * self-healing after manual cleanups (`yarn research-sandbox-cleanup --all`)
 * or implicit timeouts.
 */
async function tryReuseSandbox(
  record: SandboxSessionRecord,
  repo: SandboxRepo,
): Promise<Sandbox | null> {
  try {
    const sandbox = await ensureLiveHandle(record);
    if (sandbox.status !== "running") {
      liveSandboxes.delete(record._id);
      await repo.setStatus(record._id, "stopped");
      return null;
    }
    return sandbox;
  } catch (err) {
    // Sandbox.get throws if the sandbox no longer exists. Mark our row
    // stopped so we don't try again.
    liveSandboxes.delete(record._id);
    await repo.setStatus(record._id, "stopped");
    // eslint-disable-next-line no-console
    console.warn(`[sandbox] dropping stale record ${record._id} (${record.vercelSandboxId}): ${(err as Error).message}`);
    return null;
  }
}

async function ensureLiveHandle(record: SandboxSessionRecord): Promise<Sandbox> {
  const cached = liveSandboxes.get(record._id);
  if (cached) return cached;
  const sandbox = await Sandbox.get({ sandboxId: record.vercelSandboxId });
  liveSandboxes.set(record._id, sandbox);
  return sandbox;
}

async function provisionNewSandbox(
  userId: string,
  projectId: string,
  repo: SandboxRepo,
  config: SandboxManagerConfig,
): Promise<GetOrCreateSandboxResult> {
  const supervisorSecret = randomSecret();
  const claudeToken = await config.resolveClaudeCodeToken(userId, projectId);

  // We require a pre-built snapshot containing claude-code + the supervisor
  // bundle + research-tool CLI. There is no install/upload fallback at
  // runtime — that path would do build-time work in the request hot path.
  // Build the snapshot via:
  //   yarn research-supervisor-build && yarn research-sandbox-build-snapshot
  const snapshotId = config.supervisorSource.type === "snapshot"
    ? config.supervisorSource.snapshotId
    : process.env.RESEARCH_SANDBOX_SNAPSHOT_ID;
  if (!snapshotId) {
    throw new Error(
      "[sandbox] No snapshot configured. Set RESEARCH_SANDBOX_SNAPSHOT_ID in your env after building one with " +
      "`yarn research-supervisor-build && yarn research-sandbox-build-snapshot`. " +
      "Runtime sandbox provisioning never bundles or installs anything.",
    );
  }

  // env passed at create-time becomes the default env for every runCommand
  // invocation in this sandbox. The supervisor invocation downstream
  // inherits these without having to repeat them.
  const sharedEnv: Record<string, string> = {
    CLAUDE_CODE_OAUTH_TOKEN: claudeToken,
    SUPERVISOR_SECRET: supervisorSecret,
    BACKEND_BASE_URL: config.backendBaseUrl,
    SUPERVISOR_PORT: String(SUPERVISOR_PORT),
    USER_ID: userId,
    PROJECT_ID: projectId,
  };

  const sandbox = await Sandbox.create({
    ports: [SUPERVISOR_PORT],
    timeout: config.sandboxTimeoutMs,
    resources: { vcpus: 2 },
    env: sharedEnv,
    source: { type: "snapshot", snapshotId },
  });
  const endpointUrl = sandbox.domain(SUPERVISOR_PORT);

  // Mint the supervisor's callback bearer once at provision time. Sandbox-
  // wide and ≤6h lifetime so the supervisor doesn't need to refresh during
  // a normal session. (Sandbox itself caps at the Vercel timeout, currently
  // 1h via DEFAULT_SANDBOX_TIMEOUT_MS.)
  const callbackToken = mintSupervisorCallbackToken({
    sandboxId: sandbox.sandboxId,
    projectId,
    userId,
    ttlSeconds: Math.ceil(config.sandboxTimeoutMs / 1000) + 600, // sandbox lifetime + 10 min buffer
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

  const now = new Date();
  const record = await repo.insert({
    userId,
    projectId,
    vercelSandboxId: sandbox.sandboxId,
    endpointUrl,
    supervisorSecret,
    status: "active",
    concurrencyCount: 0,
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + config.sandboxTimeoutMs),
  });
  liveSandboxes.set(record._id, sandbox);
  return { record, sandbox, wasCreated: true };
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
 * Mark a conversation as starting on the given sandbox (increments concurrency).
 * Caller is responsible for pairing with `releaseConversationSlot` on completion.
 */
export async function reserveConversationSlot(
  record: SandboxSessionRecord,
  repo: SandboxRepo,
): Promise<void> {
  await repo.setConcurrencyCount(record._id, record.concurrencyCount + 1);
  await repo.touchLastUsedAt(record._id);
}

export async function releaseConversationSlot(
  record: SandboxSessionRecord,
  repo: SandboxRepo,
): Promise<void> {
  const next = Math.max(0, record.concurrencyCount - 1);
  await repo.setConcurrencyCount(record._id, next);
}

/**
 * Stop a sandbox and clear its in-memory handle. Idempotent.
 */
export async function stopSandbox(
  record: SandboxSessionRecord,
  repo: SandboxRepo,
): Promise<void> {
  const live = liveSandboxes.get(record._id);
  if (live) {
    try {
      await live.stop({ blocking: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[sandboxManager] stop failed for ${record._id}:`, err);
    }
    liveSandboxes.delete(record._id);
  }
  await repo.setStatus(record._id, "stopped");
}

/**
 * In-memory fallback repo. Useful for unit tests and smoke flows before
 * `ResearchSandboxSessions` is wired up. Not exported as the default — a real
 * caller in production must pass the DB-backed repo.
 */
export function createInMemorySandboxRepo(): SandboxRepo {
  const records = new Map<string, SandboxSessionRecord>();
  return {
    async findActiveByProject(userId, projectId) {
      return [...records.values()].filter(
        (r) =>
          r.userId === userId &&
          r.projectId === projectId &&
          (r.status === "active" || r.status === "provisioning"),
      );
    },
    async insert(record) {
      const _id = `mem_${records.size}_${Date.now()}`;
      const full: SandboxSessionRecord = { _id, ...record };
      records.set(_id, full);
      return full;
    },
    async setStatus(_id, status) {
      const r = records.get(_id);
      if (r) r.status = status;
    },
    async setConcurrencyCount(_id, count) {
      const r = records.get(_id);
      if (r) r.concurrencyCount = count;
    },
    async touchLastUsedAt(_id) {
      const r = records.get(_id);
      if (r) r.lastUsedAt = new Date();
    },
  };
}
