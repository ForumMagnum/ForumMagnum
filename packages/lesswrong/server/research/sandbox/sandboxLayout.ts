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
