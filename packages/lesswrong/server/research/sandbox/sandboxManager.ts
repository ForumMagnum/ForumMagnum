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
import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";
import { getPlatformAssets } from "./platformAssets";
import { SESSION_STAGING_SUFFIX } from "./supervisor/sessionBootstrap";
import {
  AGENT_CWD,
  CLAUDE_MD_PATH,
  PINNED_CLAUDE_CODE_VERSION,
  PLATFORM_DIR,
  QUEUE_DIR,
  RESEARCH_TOOL_PATH,
  SANDBOX_HOME_DIR,
  SUPERVISOR_PATH,
} from "./sandboxLayout";

/** Port the in-sandbox supervisor's HTTP server listens on. */
const SUPERVISOR_PORT = 9280;

const AUTH_PROXY_PORT = 9281;

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

/**
 * Absolute in-sandbox path of a conversation's Claude Code session JSONL:
 * `<home>/.claude/projects/<encoded-cwd>/<sessionId>.jsonl`, where the encoded
 * cwd is the agent cwd with `/` replaced by `-`. Must stay in agreement with
 * the supervisor's `sessionJsonlPath` (supervisor/sessionBootstrap.ts), which
 * computes the same path from inside the sandbox.
 */
export function claudeSessionJsonlPath(claudeSessionId: string): string {
  const encodedCwd = AGENT_CWD.replace(/\//g, "-");
  return `${SANDBOX_HOME_DIR}/.claude/projects/${encodedCwd}/${claudeSessionId}.jsonl`;
}

/**
 * Stage a reconstructed Claude session file into the sandbox through the
 * Sandbox filesystem API — never the supervisor's HTTP interface, whose body
 * cap a long conversation's JSONL can exceed. `writeFiles` creates parent
 * directories as needed. The write lands at a staging path rather than the
 * session path itself: this API can't serialize with the supervisor's claude
 * process lifecycle, so the supervisor installs the staged file at spawn
 * time, under its per-conversation lock (`installStagedSessionJsonl`).
 */
export async function stageClaudeSessionFile(
  sandbox: Sandbox,
  claudeSessionId: string,
  jsonlLines: string[],
): Promise<void> {
  const body = jsonlLines.join("\n") + "\n";
  await sandbox.writeFiles([
    { path: claudeSessionJsonlPath(claudeSessionId) + SESSION_STAGING_SUFFIX, content: body },
  ]);
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
 * never removes old ones. `CLAUDE.md` is static; per-conversation context
 * (project/conversation ids) reaches the agent via `--append-system-prompt`
 * at claude-process spawn instead.
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
 * Bring the sandbox's Claude Code install to the pinned version. Run on every
 * launch (provision and resume), after the platform-file overlay and before
 * the supervisor starts, so the supervisor's claude subprocess can never run
 * a version older than the model/protocol it expects. Snapshots freeze the
 * CLI at their build time and have no other upgrade affordance — without this,
 * every pre-existing conversation sandbox and saved environment would be
 * stuck on whatever version its baseline was built with.
 *
 * Fast path (version already matches) is one `claude --version` (~1s) with no
 * network dependency. The upgrade path npm-installs the pinned version (tens
 * of seconds, once per stale sandbox) and re-verifies the version afterward,
 * so an install that "succeeds" without changing what's first on PATH fails
 * loudly instead of silently launching the stale CLI. The non-sudo attempt
 * covers the node* images (user-writable npm prefix); the sudo retry covers
 * dnf-installed Node (system prefix) on python images.
 *
 * On boot-path failure (`stopOnFailure: true` — a freshly created or resumed
 * session, where nothing else can be running yet) the sandbox is stopped
 * before the error propagates, so the next attempt starts from a clean
 * session. The repair path passes `stopOnFailure: false`: it can be reached by
 * a health-probe false negative against a session with a live turn, and
 * stopping would kill the running claude process.
 */
async function reconcileClaudeCodeVersion(
  sandbox: Sandbox,
  opts: { stopOnFailure: boolean },
): Promise<void> {
  const script =
    `current="$(claude --version 2>/dev/null | cut -d' ' -f1)"; ` +
    `if [ "$current" = "${PINNED_CLAUDE_CODE_VERSION}" ]; then exit 0; fi; ` +
    `echo "upgrading claude-code $current -> ${PINNED_CLAUDE_CODE_VERSION}"; ` +
    `npm install -g @anthropic-ai/claude-code@${PINNED_CLAUDE_CODE_VERSION} && ` +
    `installed="$(claude --version 2>/dev/null | cut -d' ' -f1)"; ` +
    `[ "$installed" = "${PINNED_CLAUDE_CODE_VERSION}" ] || { echo "still on $installed after install" >&2; exit 1; }`;
  let result = await sandbox.runCommand({ cmd: "sh", args: ["-c", script] });
  if (result.exitCode !== 0) {
    result = await sandbox.runCommand({ cmd: "sh", args: ["-c", script], sudo: true });
  }
  if (result.exitCode !== 0) {
    const stderr = await result.stderr();
    if (opts.stopOnFailure) {
      await sandbox.stop().catch((stopErr: unknown) => {
        // eslint-disable-next-line no-console
        console.warn(`[sandbox] stop after failed reconcile failed: ${(stopErr as Error).message}`);
      });
    }
    throw new Error(
      `claude-code version reconcile failed (exit ${result.exitCode}): ${stderr.slice(0, 500)}`,
    );
  }
  const stdout = await result.stdout();
  if (stdout.includes("upgrading claude-code")) {
    // eslint-disable-next-line no-console
    console.log(`[sandbox] ${sandbox.name}: ${stdout.split("\n")[0]}`);
  }
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
    DEV_PROXY_SECRET: env.devProxySecret,
    USER_ID: env.userId,
    PROJECT_ID: env.projectId,
    CONVERSATION_ID: env.conversationId,
    SANDBOX_ID: env.sandboxName,
    CALLBACK_TOKEN: env.callbackToken,
    QUEUE_DIR,
    INIT_SCRIPT_PATH: `${AGENT_CWD}/init.sh`,
  };
  // Trim to the last 256 KiB, then append: a repair launch must not destroy
  // the previous supervisor's crash output, but the log lives in the
  // snapshot-persisted home dir and must not grow without bound.
  const log = `${PLATFORM_DIR}/supervisor.log`;
  await sandbox.runCommand({
    cmd: "sh",
    args: [
      "-c",
      // The `&`-backgrounded unit must stay a simple command with every fd
      // redirected (`;` before it, never `&&`): backgrounding a compound list
      // makes runCommand wait on the subshell's inherited output pipes, which
      // on a freshly created session never close — the provision then hangs
      // until the function times out.
      `tail -c 262144 ${log} > ${log}.trim 2>/dev/null && mv ${log}.trim ${log}; ` +
        `echo "[launch] $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> ${log}; ` +
        `nohup setsid node ${SUPERVISOR_PATH} >> ${log} 2>&1 < /dev/null &`,
    ],
    env: supervisorEnv,
  });
  await waitForSupervisorReady(supervisorUrlForSandbox(sandbox));
}

/**
 * Thrown when a sandbox is provisioning but its supervisor hasn't come up within
 * the readiness window. Distinct from a hard provisioning failure: the resume
 * keeps progressing after we give up, so the caller can surface a "still
 * starting, retry" state and a retry will find it warm.
 */
export class SandboxWarmingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxWarmingError";
  }
}

const SUPERVISOR_READY_TIMEOUT_MS = 30_000;
const SUPERVISOR_PROBE_TIMEOUT_MS = 3_000;

async function probeSupervisorHealthOnce(endpointUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${endpointUrl}/health`, {
      signal: AbortSignal.timeout(SUPERVISOR_PROBE_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForSupervisorReady(endpointUrl: string): Promise<void> {
  const deadline = Date.now() + SUPERVISOR_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await probeSupervisorHealthOnce(endpointUrl)) return;
    await sleep(500);
  }
  throw new SandboxWarmingError(
    `supervisor not ready within ${SUPERVISOR_READY_TIMEOUT_MS / 1000}s`,
  );
}

const SUPERVISOR_PROBE_ATTEMPTS = 3;
const SUPERVISOR_PROBE_RETRY_DELAY_MS = 1_000;

/**
 * Decide whether a running session's supervisor is up, retrying over several
 * seconds before declaring it dead. The bar for a negative is deliberately
 * high: a negative sends the caller into repair, which kills the probed
 * process — on a false negative that costs a live turn.
 */
async function isSupervisorHealthy(endpointUrl: string): Promise<boolean> {
  for (let attempt = 0; attempt < SUPERVISOR_PROBE_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(SUPERVISOR_PROBE_RETRY_DELAY_MS);
    if (await probeSupervisorHealthOnce(endpointUrl)) return true;
  }
  return false;
}

/**
 * Overlay current platform files, bring the Claude CLI to the pinned version,
 * launch the supervisor, and wait for /health. Callers must ensure no other
 * supervisor holds the port: the boot paths run on a fresh session, and the
 * repair path kills the old process first.
 */
async function launchSupervisorStack(
  sandbox: Sandbox,
  env: SupervisorLaunchEnv,
  opts: { stopOnReconcileFailure: boolean },
): Promise<void> {
  await overlayPlatformFiles(sandbox);
  await reconcileClaudeCodeVersion(sandbox, { stopOnFailure: opts.stopOnReconcileFailure });
  await launchSupervisor(sandbox, env);
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

function captureSandboxProvision(props: {
  conversationId: string;
  projectId: string;
  /**
   * What state the provision found: `warm` = session already running; `busy` =
   * session mid-stop/mid-start, must settle before it can be touched.
   */
  path: "warm" | "create" | "resume" | "busy";
  durationMs: number;
  ready: boolean;
  repaired?: boolean;
}): void {
  serverCaptureEvent("researchSandboxProvision", props);
}

/**
 * Session states during which the sandbox must be left alone: issuing
 * `resume: true` into an in-flight stop/auto-snapshot (or another caller's
 * still-booting resume) is how hook-less orphan sessions get created.
 */
const SESSION_SETTLING_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "stopping",
  "snapshotting",
]);

interface ConversationSecrets {
  supervisorSecret: string;
  devProxySecret: string;
}

/**
 * Resolve the conversation's per-sandbox secrets, minting and persisting them
 * on first use. The supervisorSecret is generated once and reused for the
 * conversation's life: on a rebuild the row already exists, so its secret is
 * kept rather than minting one the backend's tokens wouldn't match. Persisted
 * before any supervisor launch: a readiness timeout must not lose the secret
 * the supervisor booted with, or a retry would mint a new one and fail to
 * authenticate to the still-running supervisor.
 */
async function ensureConversationSecrets(
  conversationId: string,
  existingRow: DbResearchSandboxSession | null,
  context: ResolverContext,
): Promise<ConversationSecrets> {
  const supervisorSecret = existingRow?.supervisorSecret ?? randomSecret();
  const devProxySecret = existingRow?.devProxySecret ?? randomSecret();
  if (!existingRow) {
    await context.ResearchSandboxSessions.rawInsert({
      _id: randomId(),
      conversationId,
      supervisorSecret,
      devProxySecret,
      createdAt: new Date(),
    });
  } else if (!existingRow.devProxySecret) {
    await context.ResearchSandboxSessions.rawUpdateOne(
      { _id: existingRow._id },
      { $set: { devProxySecret } },
    );
  }
  return { supervisorSecret, devProxySecret };
}

async function buildLaunchEnv(args: {
  conversation: DbResearchConversation;
  sandboxName: string;
  secrets: ConversationSecrets;
  context: ResolverContext;
}): Promise<SupervisorLaunchEnv> {
  const { conversation, sandboxName, secrets, context } = args;
  // The supervisor POSTs events/heartbeats from inside the sandbox back to our
  // backend, so it needs a publicly-reachable absolute URL pointing at *this*
  // deployment. In local dev the backend is only reachable through a tunnel
  // (RESEARCH_BACKEND_PUBLIC_URL, set by runDevWithResearchSandbox.sh, since the
  // configured siteUrl is localhost). Otherwise derive it from the firing
  // request's forwarded headers.
  const backendBaseUrl = process.env.RESEARCH_BACKEND_PUBLIC_URL ?? getSiteUrlFromHeaders(context.headers);
  const claudeToken = await resolveClaudeCodeToken(conversation.userId, context);
  const callbackToken = mintSupervisorCallbackToken({
    sandboxId: sandboxName,
    projectId: conversation.projectId,
    userId: conversation.userId,
  });
  return {
    claudeToken,
    supervisorSecret: secrets.supervisorSecret,
    backendBaseUrl,
    userId: conversation.userId,
    projectId: conversation.projectId,
    conversationId: conversation._id,
    sandboxName,
    callbackToken,
    devProxySecret: secrets.devProxySecret,
  };
}

/**
 * (Re)launch the supervisor into a running session whose health probe failed.
 * Anything still holding the supervisor port is by definition unresponsive
 * (the probe already failed), so it is SIGKILLed first — a wedged event loop
 * never runs a TERM handler — and any claude process it orphans is picked up
 * by the relaunched supervisor's dangling-turn self-heal.
 *
 * All failures surface as SandboxWarmingError: on a session the platform
 * reports running, unexpected errors are overwhelmingly stale-state races (an
 * idle-stop landing between the status read and the repair), so the client's
 * warming retry is the right default. The underlying error is logged, and the
 * failure is captured with `repaired: true` so a failed repair attempt is
 * distinguishable from an ordinary warming failure.
 */
async function repairSupervisor(args: {
  sandbox: Sandbox;
  conversation: DbResearchConversation;
  sandboxName: string;
  secrets: ConversationSecrets;
  context: ResolverContext;
  analyticsPath: "warm" | "resume";
  provisionStartedAt: number;
}): Promise<void> {
  const { sandbox, conversation, sandboxName, secrets, context, analyticsPath, provisionStartedAt } = args;
  try {
    const launchEnv = await buildLaunchEnv({ conversation, sandboxName, secrets, context });
    await sandbox.runCommand({
      cmd: "sh",
      args: ["-c", `pkill -9 -f '${SUPERVISOR_PATH}'`],
    });
    await launchSupervisorStack(sandbox, launchEnv, { stopOnReconcileFailure: false });
  } catch (err) {
    captureSandboxProvision({
      conversationId: conversation._id,
      projectId: conversation.projectId,
      path: analyticsPath,
      durationMs: Date.now() - provisionStartedAt,
      ready: false,
      repaired: true,
    });
    if (err instanceof SandboxWarmingError) throw err;
    // eslint-disable-next-line no-console
    console.error(`[sandbox] supervisor repair failed on ${sandboxName}:`, err);
    throw new SandboxWarmingError(`supervisor repair failed: ${(err as Error).message}`);
  }
}

/**
 * Resolve (provisioning lazily on first use) the persistent sandbox for a
 * conversation, with its supervisor confirmed up. Safe to call on every turn.
 *
 * A running session is never assumed to have a running supervisor: a session
 * can come up without the launch hooks having fired (a resume racing an
 * in-flight stop, or a provision request that died mid-flight), and a
 * supervisor can die mid-session. Every path health-checks the supervisor and
 * repairs the live session when it doesn't answer.
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

  const provisionStartedAt = Date.now();
  const sandboxName = sandboxNameForConversation(conversationId);
  const existingRow = await ResearchSandboxSessions.findOne({ conversationId });

  if (existingRow) {
    const existing = await getExistingSandbox(conversationId);

    // Fast path: the sandbox is already running mid-conversation — the common
    // case on every turn after the first. A healthy supervisor means nothing
    // needs launching, so skip the snapshot-source resolution (a GitHub
    // round-trip for a coding repo) and the secret decryption the launch
    // paths below need.
    if (existing?.status === "running") {
      const supervisorUrl = supervisorUrlForSandbox(existing);
      let supervisorSecret = existingRow.supervisorSecret;
      let devProxySecret = existingRow.devProxySecret;
      let repaired = false;
      if (!(await isSupervisorHealthy(supervisorUrl))) {
        repaired = true;
        const secrets = await ensureConversationSecrets(conversationId, existingRow, context);
        supervisorSecret = secrets.supervisorSecret;
        devProxySecret = secrets.devProxySecret;
        await repairSupervisor({
          sandbox: existing,
          conversation,
          sandboxName,
          secrets,
          context,
          analyticsPath: "warm",
          provisionStartedAt,
        });
      }
      captureSandboxProvision({
        conversationId,
        projectId: conversation.projectId,
        path: "warm",
        durationMs: Date.now() - provisionStartedAt,
        ready: true,
        repaired,
      });
      return {
        conversationId,
        sandboxName,
        sandbox: existing,
        supervisorUrl,
        supervisorSecret,
        devProxySecret,
        wasFreshlyCreated: false,
      };
    }

    if (existing && SESSION_SETTLING_STATUSES.has(existing.status)) {
      captureSandboxProvision({
        conversationId,
        projectId: conversation.projectId,
        path: "busy",
        durationMs: Date.now() - provisionStartedAt,
        ready: false,
      });
      throw new SandboxWarmingError(
        `sandbox session is ${existing.status}; retry once it settles`,
      );
    }
  }

  const secrets = await ensureConversationSecrets(conversationId, existingRow, context);
  const [launchEnv, snapshotSource] = await Promise.all([
    buildLaunchEnv({ conversation, sandboxName, secrets, context }),
    resolveSnapshotSource(conversation, context),
  ]);
  const { snapshotId } = snapshotSource;

  let wasFreshlyCreated = false;
  let hooksRan = false;

  const onResume = async (sandbox: Sandbox) => {
    hooksRan = true;
    await launchSupervisorStack(sandbox, launchEnv, { stopOnReconcileFailure: true });
  };
  const onCreate = async (sandbox: Sandbox) => {
    wasFreshlyCreated = true;
    await onResume(sandbox);
  };

  let sandbox: Sandbox;
  try {
    // `getOrCreate` covers all three branches: resume an existing sandbox,
    // create a fresh one when none exists, and rebuild (delete + create) when
    // the existing sandbox's snapshot has expired. `source` is consumed only on
    // the create path — `Sandbox.get` ignores it — so a warm resume can't
    // clobber the snapshot we're trying to recover from. `resume: true` is
    // passed explicitly because the SDK omits the `resume` query param entirely
    // when it's left undefined, and the backend in that case hands back a
    // stopped-session handle rather than starting a new session.
    sandbox = await Sandbox.getOrCreate({
      name: sandboxName,
      // The SDK types `getOrCreate`'s `source` as git/tarball only, but at
      // runtime it forwards `source` to `Sandbox.create` unchanged, which does
      // accept a snapshot source. Cast until the SDK widens the type.
      source: { type: "snapshot", snapshotId } as unknown as NonNullable<Parameters<typeof Sandbox.getOrCreate>[0]>["source"],
      ports: [SUPERVISOR_PORT, AUTH_PROXY_PORT],
      timeout: SESSION_TIMEOUT_MS,
      resources: { vcpus: 4 },
      persistent: true,
      snapshotExpiration: SNAPSHOT_EXPIRATION_MS,
      keepLastSnapshots: { count: KEEP_LAST_SNAPSHOTS_COUNT },
      resume: true,
      onCreate,
      onResume,
    });
  } catch (err) {
    if (err instanceof SandboxWarmingError) {
      captureSandboxProvision({
        conversationId,
        projectId: conversation.projectId,
        path: wasFreshlyCreated ? "create" : "resume",
        durationMs: Date.now() - provisionStartedAt,
        ready: false,
      });
    }
    throw err;
  }

  // The hooks only fire when the SDK observed this call create or resume the
  // session. The backend can instead hand back a session some other caller
  // (possibly one that died mid-provision) brought up — hooks skipped, so the
  // supervisor may never have been launched.
  let repaired = false;
  if (!hooksRan && !(await isSupervisorHealthy(supervisorUrlForSandbox(sandbox)))) {
    repaired = true;
    await repairSupervisor({
      sandbox,
      conversation,
      sandboxName,
      secrets,
      context,
      analyticsPath: "resume",
      provisionStartedAt,
    });
  }

  captureSandboxProvision({
    conversationId,
    projectId: conversation.projectId,
    path: wasFreshlyCreated ? "create" : "resume",
    durationMs: Date.now() - provisionStartedAt,
    ready: true,
    repaired,
  });

  return {
    conversationId,
    sandboxName,
    sandbox,
    supervisorUrl: supervisorUrlForSandbox(sandbox),
    supervisorSecret: secrets.supervisorSecret,
    devProxySecret: secrets.devProxySecret,
    wasFreshlyCreated,
  };
}

async function getExistingSandbox(conversationId: string): Promise<Sandbox | null> {
  const name = sandboxNameForConversation(conversationId);
  try {
    return await Sandbox.get({ name, resume: false });
  } catch (err) {
    if (isNotFoundError(err) || isSnapshotNotFoundError(err)) return null;
    throw err;
  }
}

/**
 * Resolve the conversation's sandbox handle *without* provisioning or
 * resuming it. Returns `null` when the sandbox does not exist or is not
 * currently running. Used by read/observe paths (heartbeat, cancel) that must
 * not bring a sandbox up.
 */
export async function getRunningSandbox(conversationId: string): Promise<Sandbox | null> {
  const sandbox = await getExistingSandbox(conversationId);
  return sandbox?.status === "running" ? sandbox : null;
}

/** Re-arm the idle switch when this little of the session timeout remains. */
const SESSION_REARM_THRESHOLD_MS = 25 * 60 * 1000;
/**
 * Roll (stop, to be resumed by the next turn) once a session reaches this age.
 * Keeps sessions well clear of Vercel's 24h session cap and bounds how stale a
 * long-lived session's platform-file overlay can get.
 */
const SESSION_ROLL_AGE_MS = 4.5 * 60 * 60 * 1000;

/**
 * Apply the idle/roll policy to a running sandbox, given whether a turn is
 * currently in progress. Driven by the supervisor's heartbeat.
 *
 * - While a turn runs, re-arm the Vercel session timeout once its remaining
 *   window gets short, so an active conversation is never idle-stopped.
 * - Between turns, once the session exceeds the roll age, stop it; the next
 *   turn resumes it into a fresh session. A roll is never done mid-turn —
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
    console.log(`[sandbox] rolling ${sandbox.name} — session exceeded the roll age`);
    await sandbox.stop().catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.warn(`[sandbox] roll stop failed: ${(err as Error).message}`);
    });
  }
}
