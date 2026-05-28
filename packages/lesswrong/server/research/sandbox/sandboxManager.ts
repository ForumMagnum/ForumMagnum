/**
 * sandboxManager — provisions and resumes the persistent Vercel Sandbox that
 * backs a research conversation.
 *
 * Each conversation owns exactly one persistent sandbox, named
 * `research-{conversationId}`. A persistent sandbox auto-snapshots its
 * filesystem when it stops and restores it on the next run, so the agent's
 * working files and Claude Code session files survive across stops.
 *
 * `getOrCreateSandbox` is the single entry point. It is lazy (called on a
 * conversation's first turn and every later turn), idempotent, and resolves
 * only once the in-sandbox supervisor process is confirmed up.
 */
import { Sandbox, APIError } from "@vercel/sandbox";
import { randomId, randomSecret } from "@/lib/random";
import { sleep } from "@/lib/utils/asyncUtils";
import { mintSupervisorCallbackToken } from "../../../../../app/api/research/agent/researchAgentAuth";
import { decryptUserSecret } from "@/server/research/userSecretsCrypto";
import { CLAUDE_CODE_OAUTH_TOKEN_SECRET } from "@/lib/collections/userSecrets/userSecretNames";
import {
  collectRepoEnvSecrets,
  resolveCodingSnapshot,
  runCodingFirstProvision,
  type CodingSnapshotPlan,
} from "./codingWorkspace";
import { REPO_DIR, repoCommandCwd } from "./repoSandboxSync";
import { repoScopeOf } from "@/lib/research/repoUrl";

/** Port the in-sandbox supervisor's HTTP server listens on. */
const SUPERVISOR_PORT = 3000;

/**
 * Port the in-sandbox auth-proxy listens on — the public entry point for a
 * coding conversation's dev server. Exposed only for sandboxes that run one.
 */
const AUTH_PROXY_PORT = 3001;

/**
 * Per-session Vercel `timeout`. This is the idle dead-man's switch: activity
 * re-arms it; its lapse stops the session and auto-snapshots. 30 min.
 */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/** Retention for the per-session auto-snapshots Vercel garbage-collects. */
export const SNAPSHOT_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Keep only the most recent auto-snapshot per conversation sandbox. A resume
 * only ever boots from the sandbox's current snapshot, so older ones are dead
 * weight — and a coding conversation's snapshot carries the whole installed
 * repo (multiple GB), so without this cap a week of idle-stops piles up enough
 * snapshot storage to push the team over its quota. Range is 1-10.
 */
const KEEP_LAST_SNAPSHOTS_COUNT = 1;

const SANDBOX_NAME_PREFIX = "research-";

/** The persistent sandbox name for a conversation. Stable across sessions. */
export function sandboxNameForConversation(conversationId: string): string {
  return `${SANDBOX_NAME_PREFIX}${conversationId}`;
}

/** Inverse of `sandboxNameForConversation`; `null` if the name isn't ours. */
export function conversationIdFromSandboxName(name: string): string | null {
  return name.startsWith(SANDBOX_NAME_PREFIX)
    ? name.slice(SANDBOX_NAME_PREFIX.length)
    : null;
}

/** The supervisor's public URL for a sandbox's current session. */
export function supervisorUrlForSandbox(sandbox: Sandbox): string {
  return sandbox.domain(SUPERVISOR_PORT);
}

/** The auth-proxy's public URL for a sandbox's current session. */
export function devProxyUrlForSandbox(sandbox: Sandbox): string {
  return sandbox.domain(AUTH_PROXY_PORT);
}

/**
 * A conversation's sandbox, resolved live and ready to dispatch to. Nothing
 * here is persisted — the public URL changes every session, so it is always
 * derived fresh from the handle.
 */
export interface ProvisionedSandbox {
  conversationId: string;
  /** The Vercel sandbox name (`research-{conversationId}`). */
  sandboxName: string;
  /** Live handle for the current session. */
  sandbox: Sandbox;
  /** `https://sb-<id>.vercel.run` — the supervisor's public URL this session. */
  supervisorUrl: string;
  /** Per-sandbox HMAC key, from the `ResearchSandboxSessions` row. */
  supervisorSecret: string;
  /**
   * Per-sandbox HMAC key for dev-preview tokens; non-null only for a coding
   * conversation whose repo defines a dev server. `mintDevPreviewUrl` signs
   * with it.
   */
  devProxySecret: string | null;
  /**
   * True when this call freshly created the sandbox — either a brand-new
   * conversation or a rebuild after an expired snapshot. False for a warm
   * resume or a sandbox that was already running. The dispatch path uses this
   * to decide whether to ship a reconstructed Claude session.
   */
  wasFreshlyCreated: boolean;
}

/** The dev-server half of the launch env — set only for a coding conversation
 *  whose repo defines a `devCommand`. The port is chosen by the supervisor at
 *  runtime; it is not stored or shipped from the backend. */
interface DevServerLaunchEnv {
  command: string;
  /** Working directory for the dev command — `dirname(lockfilePath)` in the clone. */
  cwd: string;
  /** Per-sandbox HMAC key for dev-preview tokens. */
  proxySecret: string;
  /** The repo's secrets, applied to the dev server's environment. */
  repoEnv: Record<string, string>;
}

interface SupervisorLaunchEnv {
  claudeToken: string;
  supervisorSecret: string;
  backendBaseUrl: string;
  userId: string;
  projectId: string;
  sandboxName: string;
  callbackToken: string;
  /** Agent working directory — the repo root for a coding conversation. */
  workspaceDir: string;
  /** Present iff this is a coding conversation with a dev server. */
  devServer: DevServerLaunchEnv | null;
}

function isNotFoundError(err: unknown): boolean {
  return err instanceof APIError && err.response.status === 404;
}

interface ApiErrorJson {
  error?: { code?: string };
}
function asApiErrorJson(value: unknown): ApiErrorJson | null {
  return typeof value === "object" && value !== null ? (value as ApiErrorJson) : null;
}
function isSnapshotNotFoundError(err: unknown): boolean {
  if (!(err instanceof APIError) || err.response.status !== 410) return false;
  return asApiErrorJson(err.json)?.error?.code === "snapshot_not_found";
}

/**
 * Launch the supervisor process inside the sandbox and wait for it to bind.
 *
 * Run on every fresh provision and every resume. Persistent sandboxes restore
 * the *filesystem* but not running processes or process env, so the supervisor
 * must be relaunched — and given its full env — every session. We wrap in
 * `nohup setsid … &` so the process outlives the `runCommand` RPC channel.
 */
async function launchSupervisor(sandbox: Sandbox, env: SupervisorLaunchEnv): Promise<void> {
  const supervisorEnv: Record<string, string> = {
    CLAUDE_CODE_OAUTH_TOKEN: env.claudeToken,
    SUPERVISOR_SECRET: env.supervisorSecret,
    BACKEND_BASE_URL: env.backendBaseUrl,
    SUPERVISOR_PORT: String(SUPERVISOR_PORT),
    USER_ID: env.userId,
    PROJECT_ID: env.projectId,
    SANDBOX_ID: env.sandboxName,
    CALLBACK_TOKEN: env.callbackToken,
    WORKSPACE_DIR: env.workspaceDir,
  };
  if (env.devServer) {
    supervisorEnv.DEV_COMMAND = env.devServer.command;
    supervisorEnv.DEV_CWD = env.devServer.cwd;
    supervisorEnv.DEV_PROXY_SECRET = env.devServer.proxySecret;
    supervisorEnv.AUTH_PROXY_PORT = String(AUTH_PROXY_PORT);
    supervisorEnv.DEV_ENV_JSON = JSON.stringify(env.devServer.repoEnv);
  }
  await sandbox.runCommand({
    cmd: "sh",
    args: [
      "-c",
      "nohup setsid node /vercel/sandbox/supervisor.js > /vercel/sandbox/supervisor.log 2>&1 < /dev/null &",
    ],
    env: supervisorEnv,
  });
  await waitForSupervisorReady(supervisorUrlForSandbox(sandbox));
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
    await sleep(500);
  }
  throw new Error(
    `supervisor not ready within 30s: ${(lastErr as Error)?.message ?? "unknown"}`,
  );
}

/**
 * Resolve the user's Claude Code OAuth token from their `UserSecrets` rows.
 * The token is user-scoped — a global `UserSecrets` row, not per-project. If it
 * is unset we fail loudly rather than falling back to a process env var:
 * silently charging a shared backend token is a footgun in a multi-user
 * deployment.
 */
async function resolveClaudeCodeToken(
  userId: string,
  context: ResolverContext,
): Promise<string> {
  const row = await context.UserSecrets.findOne({
    userId,
    name: CLAUDE_CODE_OAUTH_TOKEN_SECRET,
    repoScope: null,
  });
  if (!row) {
    throw new Error(
      `Cannot provision sandbox: user ${userId} has no ${CLAUDE_CODE_OAUTH_TOKEN_SECRET} secret. ` +
        `Set up your Claude Code token before starting a conversation.`,
    );
  }
  return decryptUserSecret(row.encryptedValue);
}

interface CodingProvision {
  workspaceRepo: DbWorkspaceRepo;
  plan: CodingSnapshotPlan;
}

/**
 * Resolve the snapshot a conversation's sandbox is created from. A coding
 * conversation (one with a `workspaceRepoId`) sources from its repo's
 * install-cache snapshot — repo and dependencies baked in. An ordinary
 * conversation sources from the default runtime's baseline snapshot
 * (claude-code + supervisor + research-tool), built offline by `buildResearchSandboxSnapshot`.
 */
async function resolveSnapshotSource(
  conversation: DbResearchConversation,
  context: ResolverContext,
): Promise<{ snapshotId: string; codingProvision: CodingProvision | null }> {
  if (conversation.workspaceRepoId) {
    const workspaceRepo = await context.WorkspaceRepos.findOne({
      _id: conversation.workspaceRepoId,
    });
    if (!workspaceRepo) {
      throw new Error(
        `getOrCreateSandbox: workspace repo ${conversation.workspaceRepoId} not found`,
      );
    }
    const plan = await resolveCodingSnapshot(context, workspaceRepo);
    return { snapshotId: plan.snapshotId, codingProvision: { workspaceRepo, plan } };
  }
  const baselineRuntime = process.env.RESEARCH_DEFAULT_RUNTIME ?? "node24";
  const baseline = await context.SandboxBaselineSnapshots.findOne({ runtime: baselineRuntime });
  if (!baseline) {
    throw new Error(
      `[sandbox] No SandboxBaselineSnapshots row for runtime "${baselineRuntime}". ` +
        "Build one with `yarn research-supervisor-build && yarn research-sandbox-build-snapshot`.",
    );
  }
  return { snapshotId: baseline.vercelSnapshotId, codingProvision: null };
}

/**
 * Resolve (provisioning lazily on first use) the persistent sandbox for a
 * conversation, with its supervisor confirmed up. Safe to call on every turn.
 */
export async function getOrCreateSandbox(
  conversationId: string,
  context: ResolverContext,
): Promise<ProvisionedSandbox> {
  const { ResearchSandboxSessions, ResearchConversations } = context;

  const conversation = await ResearchConversations.findOne({ _id: conversationId });
  if (!conversation) {
    throw new Error(`getOrCreateSandbox: conversation ${conversationId} not found`);
  }

  const sandboxName = sandboxNameForConversation(conversationId);
  const existingRow = await ResearchSandboxSessions.findOne({ conversationId });

  // Fast path: the sandbox is already running mid-conversation — the common
  // case on every turn after the first. Nothing needs launching, so skip the
  // snapshot-source resolution (a GitHub round-trip for a coding repo) and the
  // secret decryption that the create/resume paths below need.
  if (existingRow) {
    const running = await getRunningSandbox(conversationId);
    if (running) {
      return {
        conversationId,
        sandboxName,
        sandbox: running,
        supervisorUrl: supervisorUrlForSandbox(running),
        supervisorSecret: existingRow.supervisorSecret,
        devProxySecret: existingRow.devProxySecret,
        wasFreshlyCreated: false,
      };
    }
  }

  // The supervisor POSTs events/heartbeats here. Localhost won't reach a dev
  // machine from inside a sandbox — point this at a tunnel for local dev.
  const backendBaseUrl =
    process.env.RESEARCH_BACKEND_PUBLIC_URL ??
    process.env.VERCEL_BRANCH_URL ??
    "http://localhost:3000";

  // The token decrypt and the snapshot-source resolution are independent. The
  // supervisorSecret is generated once and reused for the conversation's life:
  // on a rebuild the row already exists, so its secret is kept rather than
  // minting one the backend's tokens wouldn't match.
  const [claudeToken, snapshotSource] = await Promise.all([
    resolveClaudeCodeToken(conversation.userId, context),
    resolveSnapshotSource(conversation, context),
  ]);
  const { snapshotId, codingProvision } = snapshotSource;
  const supervisorSecret = existingRow?.supervisorSecret ?? randomSecret();

  // Coding conversations run the agent in the repo clone; ordinary ones in the
  // sandbox root.
  const workspaceRepo = codingProvision?.workspaceRepo ?? null;
  const workspaceDir = codingProvision ? REPO_DIR : "/vercel/sandbox";

  // A coding repo with a `devCommand` additionally runs a dev server +
  // auth-proxy: that needs a per-sandbox HMAC secret and the repo's secrets as
  // the dev server's environment. The supervisor picks the dev server's
  // localhost port at runtime, so the backend ships no port.
  let devServerEnv: DevServerLaunchEnv | null = null;
  let devProxySecret: string | null = null;
  if (workspaceRepo && workspaceRepo.devCommand) {
    devProxySecret = existingRow?.devProxySecret ?? randomSecret();
    // Backfill the secret onto a session row that predates it, so a resume's
    // token signing matches the secret the supervisor is launched with.
    if (existingRow && !existingRow.devProxySecret) {
      await ResearchSandboxSessions.rawUpdateOne(
        { _id: existingRow._id },
        { $set: { devProxySecret } },
      );
    }
    const repoScope = repoScopeOf({
      host: workspaceRepo.host,
      owner: workspaceRepo.owner,
      name: workspaceRepo.name,
    });
    devServerEnv = {
      command: workspaceRepo.devCommand,
      cwd: repoCommandCwd(workspaceRepo.lockfilePath),
      proxySecret: devProxySecret,
      repoEnv: await collectRepoEnvSecrets(context, conversation.userId, repoScope),
    };
  }

  const callbackToken = mintSupervisorCallbackToken({
    sandboxId: sandboxName,
    projectId: conversation.projectId,
    userId: conversation.userId,
  });

  const launchEnv: SupervisorLaunchEnv = {
    claudeToken,
    supervisorSecret,
    backendBaseUrl,
    userId: conversation.userId,
    projectId: conversation.projectId,
    sandboxName,
    callbackToken,
    workspaceDir,
    devServer: devServerEnv,
  };

  let wasFreshlyCreated = false;

  const onResume = async (sandbox: Sandbox) => {
    await launchSupervisor(sandbox, launchEnv);
  };
  const onCreate = async (sandbox: Sandbox) => {
    wasFreshlyCreated = true;
    // For a coding conversation, bring the repo to HEAD, reconcile dependencies
    // if the install cache was stale, and run `prepareCommand` — once, here. A
    // later resume restores this from the auto-snapshot and does not repeat it.
    if (codingProvision) {
      await runCodingFirstProvision(sandbox, {
        workspaceRepo: codingProvision.workspaceRepo,
        token: codingProvision.plan.token,
        isStale: codingProvision.plan.isStale,
      });
    }
    await launchSupervisor(sandbox, launchEnv);
    // Insert the row only for a brand-new conversation. A rebuild (expired
    // snapshot) re-enters this path with the row already present.
    if (!existingRow) {
      await ResearchSandboxSessions.rawInsert({
        _id: randomId(),
        conversationId,
        supervisorSecret,
        devProxySecret,
        createdAt: new Date(),
      });
    }
  };

  // `getOrCreate` covers all three branches: resume an existing sandbox,
  // create a fresh one when none exists, and rebuild (delete + create) when
  // the existing sandbox's snapshot has expired. `source` is consumed only on
  // the create path — `Sandbox.get` ignores it — so a warm resume can't
  // clobber the snapshot we're trying to recover from. `resume: true` is
  // passed explicitly because the SDK omits the `resume` query param entirely
  // when it's left undefined, and the backend in that case hands back a
  // stopped-session handle rather than starting a new session.
  const sandbox = await Sandbox.getOrCreate({
    name: sandboxName,
    // The SDK types `getOrCreate`'s `source` as git/tarball only, but at
    // runtime it forwards `source` to `Sandbox.create` unchanged, which does
    // accept a snapshot source. Cast until the SDK widens the type.
    source: { type: "snapshot", snapshotId } as unknown as NonNullable<Parameters<typeof Sandbox.getOrCreate>[0]>["source"],
    // A dev-server sandbox exposes the auth-proxy port as well.
    ports: devServerEnv ? [SUPERVISOR_PORT, AUTH_PROXY_PORT] : [SUPERVISOR_PORT],
    timeout: SESSION_TIMEOUT_MS,
    resources: { vcpus: 2 },
    persistent: true,
    snapshotExpiration: SNAPSHOT_EXPIRATION_MS,
    keepLastSnapshots: { count: KEEP_LAST_SNAPSHOTS_COUNT },
    resume: true,
    onCreate,
    onResume,
  });

  return {
    conversationId,
    sandboxName,
    sandbox,
    supervisorUrl: supervisorUrlForSandbox(sandbox),
    supervisorSecret,
    devProxySecret,
    wasFreshlyCreated,
  };
}

/**
 * Resolve the conversation's sandbox handle *without* provisioning or
 * resuming it. Returns `null` when the sandbox does not exist or is not
 * currently running. Used by read/observe paths (heartbeat, stream-info,
 * cancel) that must not bring a sandbox up.
 */
export async function getRunningSandbox(conversationId: string): Promise<Sandbox | null> {
  const name = sandboxNameForConversation(conversationId);
  try {
    const sandbox = await Sandbox.get({ name, resume: false });
    return sandbox.status === "running" ? sandbox : null;
  } catch (err) {
    if (isNotFoundError(err) || isSnapshotNotFoundError(err)) return null;
    throw err;
  }
}

/** Re-arm the idle switch when this little of the session timeout remains. */
const SESSION_REARM_THRESHOLD_MS = 25 * 60 * 1000;
/** Roll (stop, to be resumed by the next turn) once a session reaches this age. */
const SESSION_ROLL_AGE_MS = 4.5 * 60 * 60 * 1000;

/**
 * Apply the idle/roll policy to a running sandbox, given whether a turn is
 * currently in progress. Driven by the supervisor's heartbeat.
 *
 * - While a turn runs, re-arm the Vercel session timeout once its remaining
 *   window gets short, so an active conversation is never idle-stopped.
 * - Between turns, once the session nears Vercel's 5h hard cap, stop it; the
 *   next turn resumes it into a fresh session. A roll is never done mid-turn —
 *   `stop()` would kill the running `claude` process.
 * - An idle session (no turns) is left alone: its timeout lapses and Vercel
 *   idle-stops + auto-snapshots it.
 */
export async function maintainSandboxTimeout(
  sandbox: Sandbox,
  opts: { turnRunning: boolean },
): Promise<void> {
  const session = sandbox.currentSession();
  if (opts.turnRunning) {
    const remainingMs = session.createdAt.getTime() + session.timeout - Date.now();
    if (remainingMs < SESSION_REARM_THRESHOLD_MS) {
      await sandbox
        .extendTimeout(Math.max(60_000, SESSION_TIMEOUT_MS - remainingMs))
        .catch((err: unknown) => {
          // eslint-disable-next-line no-console
          console.warn(`[sandbox] extendTimeout failed: ${(err as Error).message}`);
        });
    }
    return;
  }
  const startedAt = session.startedAt ?? session.createdAt;
  if (Date.now() - startedAt.getTime() > SESSION_ROLL_AGE_MS) {
    // eslint-disable-next-line no-console
    console.log(`[sandbox] rolling ${sandbox.name} — session near the 5h cap`);
    await sandbox.stop().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(`[sandbox] roll stop failed: ${(err as Error).message}`);
    });
  }
}
