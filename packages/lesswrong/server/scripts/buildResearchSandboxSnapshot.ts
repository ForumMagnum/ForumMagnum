import * as fs from "fs";
import * as path from "path";
import { Sandbox } from "@vercel/sandbox";
import { randomId } from "@/lib/random";
import SandboxBaselineSnapshots from "@/server/collections/sandboxBaselineSnapshots/collection";

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
 * Builds a Vercel Sandbox baseline snapshot containing everything a
 * freshly-provisioned sandbox needs to boot its supervisor:
 *
 *   - `@anthropic-ai/claude-code` installed globally
 *   - `/vercel/sandbox/supervisor.js`        (bundled supervisor)
 *   - `/vercel/sandbox/bin/research-tool`    (in-sandbox CLI)
 *   - `/vercel/sandbox/CLAUDE.md`            (agent instructions)
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
 * Run `buildResearchSupervisor` first to produce the supervisor bundle in
 * `sandbox/dist/`. Rebuild a runtime's snapshot whenever the supervisor source,
 * research-tool, or Claude Code changes.
 *
 * Requires Vercel auth in env (via `yarn repl` / `.env.local`: `VERCEL_OIDC_TOKEN`
 * from `vercel env pull`, or `VERCEL_TOKEN` + `VERCEL_TEAM_ID` + `VERCEL_PROJECT_ID`).
 */
export async function buildResearchSandboxSnapshot(args: BuildResearchSandboxSnapshotArgs = {}): Promise<void> {
  const noExpire = args.noExpire ?? false;
  const runtime = resolveRuntime(args.runtime);

  if (!fs.existsSync(SUPERVISOR_BUNDLE) || !fs.existsSync(RESEARCH_TOOL_BUNDLE)) {
    throw new Error(
      `Missing supervisor build artifacts. Run buildResearchSupervisor first.\n` +
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
    // eslint-disable-next-line no-console
    console.log("[snapshot] installing @anthropic-ai/claude-code (this may take a minute)…");
    const installResult = await sandbox.runCommand({
      cmd: "npm",
      args: ["install", "-g", "@anthropic-ai/claude-code"],
    });
    if (installResult.exitCode !== 0) {
      const stderr = await installResult.stderr();
      throw new Error(`npm install failed (exit ${installResult.exitCode}): ${stderr.slice(0, 1000)}`);
    }

    const verify = await sandbox.runCommand({ cmd: "which", args: ["claude"] });
    const which = (await verify.stdout()).trim();
    if (verify.exitCode !== 0 || !which) {
      const stderr = await verify.stderr();
      throw new Error(`claude binary not found after install: ${stderr || "(no stderr)"}`);
    }

    await sandbox.writeFiles([
      { path: "/vercel/sandbox/supervisor.js", content: supervisorBytes },
      // The bundle has a `#!/usr/bin/env node` shebang, so writing it without a
      // `.cjs` extension and chmod-ing it executable lets the agent run
      // `research-tool ...` directly (the supervisor prepends /vercel/sandbox/bin
      // to the Claude Code subprocess's PATH).
      { path: "/vercel/sandbox/bin/research-tool", content: researchToolBytes, mode: 0o755 },
      // Auto-loaded by Claude Code from cwd at session start.
      { path: "/vercel/sandbox/CLAUDE.md", content: agentInstructionsBytes },
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
