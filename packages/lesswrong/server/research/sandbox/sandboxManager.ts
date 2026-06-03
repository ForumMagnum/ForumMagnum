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
 *
 * Filesystem layout (design "Sandbox filesystem layout"): the agent's working
 * directory is `/vercel/sandbox` (the cwd); the platform's own files live
 * *outside* it under the home dir, so the agent's cwd-scoped cleanup can't reach
 * them:
 *   - `~/.research/supervisor.js`, `~/.research/bin/research-tool` — platform
 *   - `~/.research/queue/` — the durable event queue (durable state)
 *   - `~/.claude/CLAUDE.md` — agent instructions (auto-loaded globally)
 *   - `~/.claude/projects/` — Claude Code's session files (agent memory)
 *
 * The platform files are **overlaid at every launch** from server-bundled
 * assets (never run from the snapshot), so a snapshot taken today still runs
 * today's platform code after future deploys.
 */
import { Sandbox, APIError } from "@vercel/sandbox";
import { randomId, randomSecret } from "@/lib/random";
import { sleep } from "@/lib/utils/asyncUtils";
import { mintSupervisorCallbackToken } from "../../../../../app/api/research/agent/researchAgentAuth";
import { decryptUserSecret } from "@/server/research/userSecretsCrypto";
import { getSiteUrlFromHeaders } from "@/server/utils/getSiteUrl";
import { getPlatformAssets } from "./platformAssets";
import {
  AGENT_CWD,
  CLAUDE_MD_PATH,
  PLATFORM_DIR,
  QUEUE_DIR,
  RESEARCH_TOOL_PATH,
  SANDBOX_HOME_DIR,
  SUPERVISOR_PATH,
} from "./sandboxLayout";

/** Port the in-sandbox supervisor's HTTP server listens on. */
const SUPERVISOR_PORT = 9280;

const AUTH_PROXY_PORT = 9281;

const DEV_PORT = 9282;

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

const DEFAULT_RUNTIME = "node24";

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
  devProxySecret: string | null;
  /**
   * True when this call freshly created the sandbox — either a brand-new
   * conversation or a rebuild after an expired snapshot. False for a warm
   * resume or a sandbox that was already running. The dispatch path uses this
   * to decide whether to ship a reconstructed Claude session.
   */
  wasFreshlyCreated: boolean;
  isFirstProvision: boolean;
}

interface SupervisorLaunchEnv {
  claudeToken: string;
  supervisorSecret: string;
  backendBaseUrl: string;
  userId: string;
  projectId: string;
  conversationId: string;
  sandboxName: string;
  callbackToken: string;
  devProxySecret: string;
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
 * Overlay the current platform files into the sandbox. Run on every fresh
 * provision and every resume, *before* launching the supervisor — so a snapshot
 * taken with old platform code runs today's code. Only writes new files; it
 * never removes old ones. The `{{RESEARCH_PROJECT_ID}}` placeholder in
 * `CLAUDE.md` is left intact here and filled by the supervisor at boot (after
 * this overlay, before any `claude` subprocess).
 *
 * The durable event queue under `~/.research/queue/` is **not** overlaid — it is
 * durable state, not code.
 */
async function overlayPlatformFiles(sandbox: Sandbox): Promise<void> {
  const assets = getPlatformAssets();
  await sandbox.writeFiles([
    { path: SUPERVISOR_PATH, content: assets.supervisorBundle },
    { path: RESEARCH_TOOL_PATH, content: assets.researchTool, mode: 0o755 },
    { path: CLAUDE_MD_PATH, content: assets.claudeMd },
  ]);
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
    // Pin HOME so the supervisor's `homedir()` resolves to the SAME directory
    // the backend overlays platform files into (SANDBOX_HOME_DIR). Without this,
    // if the runtime image's default home isn't `/root`, the supervisor would
    // read `~/.claude/CLAUDE.md` and derive the research-tool PATH from a
    // different home than the overlay wrote to. (If `/root` isn't writable the
    // overlay's `writeFiles` fails loudly — better than silent path divergence.)
    HOME: SANDBOX_HOME_DIR,
    CLAUDE_CODE_OAUTH_TOKEN: env.claudeToken,
    SUPERVISOR_SECRET: env.supervisorSecret,
    BACKEND_BASE_URL: env.backendBaseUrl,
    SUPERVISOR_PORT: String(SUPERVISOR_PORT),
    AUTH_PROXY_PORT: String(AUTH_PROXY_PORT),
    DEV_PORT: String(DEV_PORT),
    DEV_PROXY_SECRET: env.devProxySecret,
    USER_ID: env.userId,
    PROJECT_ID: env.projectId,
    CONVERSATION_ID: env.conversationId,
    SANDBOX_ID: env.sandboxName,
    CALLBACK_TOKEN: env.callbackToken,
    QUEUE_DIR,
    INIT_SCRIPT_PATH: `${AGENT_CWD}/init.sh`,
  };
  await sandbox.runCommand({
    cmd: "sh",
    args: [
      "-c",
      `nohup setsid node ${SUPERVISOR_PATH} > ${PLATFORM_DIR}/supervisor.log 2>&1 < /dev/null &`,
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

async function resolveClaudeCodeToken(
  userId: string,
  context: ResolverContext,
): Promise<string> {
  const user = await context.loaders.Users.load(userId);
  const stored = user?.claudeCodeOAuthTokenEncrypted ?? null;
  if (!stored) {
    throw new Error(
      `Cannot provision sandbox: user ${userId} has no Claude Code OAuth token. ` +
        `Set up your Claude Code token before starting a conversation.`,
    );
  }
  return decryptUserSecret(stored);
}

async function resolveSnapshotSource(
  conversation: DbResearchConversation,
  context: ResolverContext,
): Promise<{ snapshotId: string }> {
  if (conversation.baseEnvironmentId) {
    const environment = await context.ResearchEnvironments.findOne({
      _id: conversation.baseEnvironmentId,
    });
    if (!environment) {
      throw new Error(
        `getOrCreateSandbox: environment ${conversation.baseEnvironmentId} not found`,
      );
    }
    return { snapshotId: environment.vercelSnapshotId };
  }
  const baselineRuntime = conversation.runtime ?? DEFAULT_RUNTIME;
  const baseline = await context.SandboxBaselineSnapshots.findOne({ runtime: baselineRuntime });
  if (!baseline) {
    throw new Error(
      `[sandbox] No SandboxBaselineSnapshots row for runtime "${baselineRuntime}". ` +
        "Build one with `yarn research-supervisor-build && yarn research-sandbox-build-snapshot`.",
    );
  }
  return { snapshotId: baseline.vercelSnapshotId };
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
        isFirstProvision: false,
      };
    }
  }

  // The supervisor POSTs events/heartbeats from inside the sandbox back to our
  // backend, so it needs a publicly-reachable absolute URL pointing at *this*
  // deployment. In local dev the backend is only reachable through a tunnel
  // (RESEARCH_BACKEND_PUBLIC_URL, set by runDevWithResearchSandbox.sh, since the
  // configured siteUrl is localhost). Otherwise derive it from the firing
  // request's forwarded headers.
  const backendBaseUrl = process.env.RESEARCH_BACKEND_PUBLIC_URL ?? getSiteUrlFromHeaders(context.headers);

  // The token decrypt and the snapshot-source resolution are independent. The
  // supervisorSecret is generated once and reused for the conversation's life:
  // on a rebuild the row already exists, so its secret is kept rather than
  // minting one the backend's tokens wouldn't match.
  const [claudeToken, snapshotSource] = await Promise.all([
    resolveClaudeCodeToken(conversation.userId, context),
    resolveSnapshotSource(conversation, context),
  ]);
  const { snapshotId } = snapshotSource;
  const supervisorSecret = existingRow?.supervisorSecret ?? randomSecret();
  const devProxySecret = existingRow?.devProxySecret ?? randomSecret();
  if (existingRow && !existingRow.devProxySecret) {
    await ResearchSandboxSessions.rawUpdateOne(
      { _id: existingRow._id },
      { $set: { devProxySecret } },
    );
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
    conversationId,
    sandboxName,
    callbackToken,
    devProxySecret,
  };

  let wasFreshlyCreated = false;

  const onResume = async (sandbox: Sandbox) => {
    await overlayPlatformFiles(sandbox);
    await launchSupervisor(sandbox, launchEnv);
  };
  const onCreate = async (sandbox: Sandbox) => {
    wasFreshlyCreated = true;
    await overlayPlatformFiles(sandbox);
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
    ports: [SUPERVISOR_PORT, AUTH_PROXY_PORT],
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
    isFirstProvision: !existingRow,
  };
}

/**
 * Resolve the conversation's sandbox handle *without* provisioning or
 * resuming it. Returns `null` when the sandbox does not exist or is not
 * currently running. Used by read/observe paths (heartbeat, cancel) that must
 * not bring a sandbox up.
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
