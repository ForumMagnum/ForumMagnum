/**
 * Single source of truth for where the platform's files live inside a research
 * sandbox. Shared by `sandboxManager` (which overlays these at every launch) and
 * `buildResearchSandboxSnapshot` (which seeds them into the baseline snapshot),
 * so the two can't drift onto different paths.
 *
 * Platform files live under `/root`, *outside* the agent's cwd
 * (`/vercel/sandbox`), so the agent's cwd-scoped cleanup can't reach them. The
 * supervisor pins its own `HOME=SANDBOX_HOME_DIR` so `homedir()` resolves to the
 * same place the backend writes platform files.
 */
export const SANDBOX_HOME_DIR = "/root";

/** Agent working directory (cwd) — where `init.sh` lives. */
export const AGENT_CWD = "/vercel/sandbox";

/**
 * Writable home for agent-facing processes. Vercel sandbox commands run as the
 * unprivileged `vercel-sandbox` user, so using `/root` as the agent's `$HOME`
 * makes global tool setup (`git config --global`, `~/.git-credentials`, etc.)
 * fail with permissions errors.
 */
export const AGENT_HOME_DIR = `${AGENT_CWD}/.home`;

export const PLATFORM_DIR = `${SANDBOX_HOME_DIR}/.research`;
export const SUPERVISOR_PATH = `${PLATFORM_DIR}/supervisor.js`;
export const RESEARCH_TOOL_PATH = `${PLATFORM_DIR}/bin/research-tool`;
export const QUEUE_DIR = `${PLATFORM_DIR}/queue`;
export const CLAUDE_DIR = `${SANDBOX_HOME_DIR}/.claude`;
export const CLAUDE_MD_PATH = `${CLAUDE_DIR}/CLAUDE.md`;
