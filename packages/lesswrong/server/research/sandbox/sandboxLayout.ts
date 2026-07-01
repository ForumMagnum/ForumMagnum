/**
 * Single source of truth for where the platform's files live inside a research
 * sandbox. Shared by `sandboxManager` (which overlays these at every launch) and
 * `buildResearchSandboxSnapshot` (which seeds them into the baseline snapshot),
 * so the two can't drift onto different paths.
 *
 * The sandbox's home directory: the runtime image runs as root, so this is
 * `/root`. The platform files live under here, *outside* the agent's cwd
 * (`/vercel/sandbox`), so the agent's cwd-scoped cleanup can't reach them. (The
 * in-sandbox supervisor pins `HOME=SANDBOX_HOME_DIR` so its `homedir()` resolves
 * to the same place the backend writes to.)
 */
export const SANDBOX_HOME_DIR = "/root";

/** Agent working directory (cwd) — where `init.sh` lives. */
export const AGENT_CWD = "/vercel/sandbox";

export const PLATFORM_DIR = `${SANDBOX_HOME_DIR}/.research`;
export const SUPERVISOR_PATH = `${PLATFORM_DIR}/supervisor.js`;
export const RESEARCH_TOOL_PATH = `${PLATFORM_DIR}/bin/research-tool`;
export const QUEUE_DIR = `${PLATFORM_DIR}/queue`;
export const CLAUDE_DIR = `${SANDBOX_HOME_DIR}/.claude`;
export const CLAUDE_MD_PATH = `${CLAUDE_DIR}/CLAUDE.md`;

/**
 * The Claude Code version every sandbox runs. Pinned because the supervisor
 * speaks the CLI's stream-json + control protocol (undocumented; this is the
 * compatibility surface flagged in claudeRunner.ts) and because the agent
 * model below may require a minimum CLI version. Enforcement is two-sided:
 * `buildResearchSandboxSnapshot` installs exactly this version into fresh
 * baselines, and `sandboxManager.reconcileClaudeCodeVersion` upgrades any
 * older sandbox/environment snapshot at launch, before the supervisor starts —
 * snapshots otherwise carry their build-time CLI forever. To upgrade: bump
 * this, rebuild the baseline snapshots, and existing sandboxes reconcile on
 * their next launch.
 */
export const PINNED_CLAUDE_CODE_VERSION = "2.1.181";

/** The model the research agent runs (`claude --model ...`). Requires a CLI
 * version that knows the model family — see PINNED_CLAUDE_CODE_VERSION. */
export const RESEARCH_AGENT_MODEL = "claude-fable-5";
// export const RESEARCH_AGENT_MODEL = "claude-opus-4-8";

