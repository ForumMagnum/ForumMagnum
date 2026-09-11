import * as fs from "fs";
import * as path from "path";
import { Sandbox } from "@vercel/sandbox";
import { randomId } from "@/lib/random";
import SandboxBaselineSnapshots from "@/server/collections/sandboxBaselineSnapshots/collection";
import {
  CLAUDE_MD_PATH,
  PINNED_CLAUDE_CODE_VERSION,
  RESEARCH_TOOL_PATH,
  SUPERVISOR_PATH,
} from "@/server/research/sandbox/sandboxLayout";

const TIMEOUT_MS = 10 * 60 * 1000;
const SUPPORTED_RUNTIMES = ["node22", "node24", "node26", "python3.13"] as const;
export type SupportedSandboxRuntime = typeof SUPPORTED_RUNTIMES[number];
const DEFAULT_RUNTIME: SupportedSandboxRuntime = "node24";

const SANDBOX_DIR = path.resolve(__dirname, "../research/sandbox");
const DIST_DIR = path.join(SANDBOX_DIR, "dist");
const SUPERVISOR_BUNDLE = path.join(DIST_DIR, "supervisor.js");
const RESEARCH_TOOL_BUNDLE = path.join(DIST_DIR, "research-tool.cjs");
// Markdown file shipped into the sandbox as `CLAUDE.md` so Claude Code
// auto-loads it as a system prompt. Kept under a different filename in the
// repo so a developer's local Claude Code doesn't pick it up while working on
// this code.
const AGENT_INSTRUCTIONS = path.join(SANDBOX_DIR, "supervisor/agentInstructions.md");

export interface BuildResearchSandboxSnapshotArgs {
  runtime?: SupportedSandboxRuntime;
  noExpire?: boolean;
}

function resolveRuntime(runtime: string | undefined): SupportedSandboxRuntime {
  if (!runtime) return DEFAULT_RUNTIME;
  const match = SUPPORTED_RUNTIMES.find((supportedRuntime) => supportedRuntime === runtime);
  if (!match) {
    throw new Error(`runtime must be one of: ${SUPPORTED_RUNTIMES.join(", ")}`);
  }
  return match;
}

/** Upsert the `SandboxBaselineSnapshots` row for a runtime (keyed on `runtime`). */
async function registerBaselineSnapshot(runtime: string, snapshotId: string): Promise<void> {
  const builtAt = new Date();
  const existing = await SandboxBaselineSnapshots.findOne({ runtime });
  if (existing) {
    await SandboxBaselineSnapshots.rawUpdateOne(
      { _id: existing._id },
      { $set: { vercelSnapshotId: snapshotId, builtAt } },
    );
  } else {
    await SandboxBaselineSnapshots.rawInsert({
      _id: randomId(),
      createdAt: builtAt,
      runtime,
      vercelSnapshotId: snapshotId,
      builtAt,
    });
  }
  // eslint-disable-next-line no-console
  console.log(`[snapshot] SandboxBaselineSnapshots row upserted for runtime "${runtime}".`);
}

/**
 * Ensure Node.js + npm exist in the builder sandbox. Returns true if it had to
 * install them. The node* runtimes ship Node/npm; the python3.13 image does not,
 * so we install it via `dnf` (Amazon Linux 2023) with `sudo: true`. This is
 * needed for more than the build-time `npm install` — at runtime the supervisor
 * runs `node supervisor.js` and `research-tool` has a `#!/usr/bin/env node`
 * shebang, so every baseline must carry Node on the system PATH.
 */
async function ensureNodeInstalled(sandbox: Sandbox): Promise<boolean> {
  const hasNpm = await sandbox.runCommand({ cmd: "sh", args: ["-c", "command -v npm >/dev/null 2>&1"] });
  if (hasNpm.exitCode === 0) return false;

  // eslint-disable-next-line no-console
  console.log("[snapshot] Node/npm not found — installing Node 24 via dnf…");
  // AL2023's unversioned `nodejs` is Node 18; the `nodejs24` package set (Node
  // 24.x + npm 11.x) ships in the same default repo and registers `node`/`npm`
  // on the system PATH via alternatives, matching the node24 runtime image.
  const install = await sandbox.runCommand({
    cmd: "dnf",
    args: ["install", "-y", "nodejs24", "nodejs24-npm"],
    sudo: true,
  });
  if (install.exitCode !== 0) {
    const stderr = await install.stderr();
    throw new Error(`dnf install nodejs24 failed (exit ${install.exitCode}): ${stderr.slice(0, 1000)}`);
  }

  const verify = await sandbox.runCommand({ cmd: "sh", args: ["-c", "node --version && npm --version"] });
  if (verify.exitCode !== 0) {
    const stderr = await verify.stderr();
    throw new Error(`Node.js not available after dnf install: ${stderr || "(no stderr)"}`);
  }
  // eslint-disable-next-line no-console
  console.log(`[snapshot] installed Node ${(await verify.stdout()).trim().split("\n")[0]}`);
  return true;
}

/**
 * Builds a Vercel Sandbox baseline snapshot containing everything a
 * freshly-provisioned sandbox needs to boot its supervisor:
 *
 *   - `@anthropic-ai/claude-code` installed globally
 *   - `~/.research/supervisor.js`     (bundled supervisor — platform, outside cwd)
 *   - `~/.research/bin/research-tool` (in-sandbox CLI — platform, outside cwd)
 *   - `~/.claude/CLAUDE.md`           (agent instructions, auto-loaded globally)
 *
 * One snapshot per runtime; the snapshot id is upserted into the
 * `SandboxBaselineSnapshots` table, which `sandboxManager` reads at provision
 * time.
 *
 * Intended usage:
 *   yarn repl dev lw packages/lesswrong/server/scripts/buildResearchSandboxSnapshot.ts
 *   yarn repl dev lw packages/lesswrong/server/scripts/buildResearchSandboxSnapshot.ts \
 *     'buildResearchSandboxSnapshot({ runtime: "node24", noExpire: true })'
 *
 * Run `yarn research-supervisor-build` first to produce the supervisor bundle in
 * `sandbox/dist/`. Rebuild a runtime's snapshot whenever the supervisor source,
 * research-tool, or `PINNED_CLAUDE_CODE_VERSION` changes. (Existing sandboxes
 * and saved environments don't need a rebuild for a Claude Code bump — the
 * launch path reconciles their install to the pin — but fresh provisions
 * shouldn't pay that upgrade cost, so keep the baselines current.)
 *
 * Requires Vercel auth in env (via `yarn repl` / `.env.local`: `VERCEL_OIDC_TOKEN`
 * from `vercel env pull`, or `VERCEL_TOKEN` + `VERCEL_TEAM_ID` + `VERCEL_PROJECT_ID`).
 */
export async function buildResearchSandboxSnapshot(args: BuildResearchSandboxSnapshotArgs = {}): Promise<void> {
  const noExpire = args.noExpire ?? false;
  const runtime = resolveRuntime(args.runtime);

  if (!fs.existsSync(SUPERVISOR_BUNDLE) || !fs.existsSync(RESEARCH_TOOL_BUNDLE)) {
    throw new Error(
      `Missing supervisor build artifacts. Run \`yarn research-supervisor-build\` first.\n` +
      `Expected:\n  ${SUPERVISOR_BUNDLE}\n  ${RESEARCH_TOOL_BUNDLE}`,
    );
  }
  if (!fs.existsSync(AGENT_INSTRUCTIONS)) {
    throw new Error(`Missing agent instructions file at ${AGENT_INSTRUCTIONS}`);
  }
  const supervisorBytes = fs.readFileSync(SUPERVISOR_BUNDLE);
  const researchToolBytes = fs.readFileSync(RESEARCH_TOOL_BUNDLE);
  const agentInstructionsBytes = fs.readFileSync(AGENT_INSTRUCTIONS);
  // eslint-disable-next-line no-console
  console.log(`[snapshot] runtime: ${runtime}`);

  // eslint-disable-next-line no-console
  console.log("[snapshot] creating builder sandbox…");
  const sandbox = await Sandbox.create({
    runtime,
    timeout: TIMEOUT_MS,
    resources: { vcpus: 2 },
    // Throwaway builder VM — we take an explicit snapshot below and don't want
    // the persistent auto-snapshot machinery.
    persistent: false,
  });
  // eslint-disable-next-line no-console
  console.log(`[snapshot] sandbox: ${sandbox.name}`);

  try {
    // The platform is Node-based on every runtime (the supervisor runs
    // `node supervisor.js`, research-tool has a node shebang, and claude-code
    // installs via npm), but only the node* images ship Node/npm — the
    // python3.13 image (Amazon Linux 2023, `pip`/`uv`) does not. Install it
    // there before anything else.
    const installedNode = await ensureNodeInstalled(sandbox);

    // eslint-disable-next-line no-console
    console.log(`[snapshot] installing @anthropic-ai/claude-code@${PINNED_CLAUDE_CODE_VERSION} (this may take a minute)…`);
    const installResult = await sandbox.runCommand({
      cmd: "npm",
      args: ["install", "-g", `@anthropic-ai/claude-code@${PINNED_CLAUDE_CODE_VERSION}`],
      // On the node* images npm's global prefix is already user-writable, but a
      // dnf-installed Node uses the system prefix (/usr), so a non-root `-g`
      // install would hit EACCES — run it as root there. claude lands on the
      // system PATH either way, so the (vercel-sandbox) agent can still run it.
      sudo: installedNode,
    });
    if (installResult.exitCode !== 0) {
      const stderr = await installResult.stderr();
      throw new Error(`npm install failed (exit ${installResult.exitCode}): ${stderr.slice(0, 1000)}`);
    }

    const verify = await sandbox.runCommand({ cmd: "sh", args: ["-c", "claude --version"] });
    const installedVersion = (await verify.stdout()).trim().split(" ")[0];
    if (verify.exitCode !== 0 || installedVersion !== PINNED_CLAUDE_CODE_VERSION) {
      const stderr = await verify.stderr();
      throw new Error(
        `claude ${PINNED_CLAUDE_CODE_VERSION} not runnable after install ` +
        `(got "${installedVersion || stderr || "(nothing)"}")`,
      );
    }

    // Paths come from the shared sandboxLayout module so the baseline seed and
    // the per-launch overlay (sandboxManager) can't drift onto different paths.
    await sandbox.writeFiles([
      { path: SUPERVISOR_PATH, content: supervisorBytes },
      // The bundle has a `#!/usr/bin/env node` shebang, so writing it without a
      // `.cjs` extension and chmod-ing it executable lets the agent run
      // `research-tool ...` directly (the supervisor prepends ~/.research/bin to
      // the Claude Code subprocess's PATH).
      { path: RESEARCH_TOOL_PATH, content: researchToolBytes, mode: 0o755 },
      // Auto-loaded by Claude Code from `~/.claude/CLAUDE.md` regardless of cwd.
      { path: CLAUDE_MD_PATH, content: agentInstructionsBytes },
    ]);

    // eslint-disable-next-line no-console
    console.log("[snapshot] taking snapshot (sandbox will stop after this)…");
    const snapshot = await sandbox.snapshot(noExpire ? { expiration: 0 } : undefined);
    // eslint-disable-next-line no-console
    console.log(`[snapshot] DONE — snapshot id: ${snapshot.snapshotId} (status ${snapshot.status})`);

    await registerBaselineSnapshot(runtime, snapshot.snapshotId);
  } catch (err) {
    try {
      await sandbox.stop();
    } catch {
      // best effort
    }
    throw err;
  }
}

export default buildResearchSandboxSnapshot;
