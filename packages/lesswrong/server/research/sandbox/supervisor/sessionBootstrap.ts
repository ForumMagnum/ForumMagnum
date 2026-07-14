/**
 * Session-file plumbing for `claude --resume`.
 *
 * Claude Code persists its conversation history at:
 *   ~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl
 * where `<encoded-cwd>` is the absolute working directory with `/` replaced
 * by `-`. The file is a sequence of JSONL events, and `--resume` reads it
 * from disk to reconstruct the context window.
 *
 * When a conversation continues in a sandbox that doesn't have this file
 * (the previous sandbox was reaped or rebuilt), `ResearchConversationEvents`
 * is the only surviving copy. The backend reconstructs the JSONL from it and
 * stages the result at `<session path>.staged` through the sandbox filesystem
 * API — whose writes can't be serialized with the claude process lifecycle —
 * and the hub installs it from here while spawning, inside the conversation's
 * opChain where no live process can hold the session file. That hand-off is
 * what preserves the single-writer invariant on the session file.
 */
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";

/**
 * Dispatch-rejection reason for "this session has history but its file is not
 * on disk". Shared contract between the hub (which rejects with it) and the
 * backend's dispatch path (which reacts by staging a reconstruction and
 * re-dispatching).
 */
export const SESSION_FILE_MISSING_REASON = "session_file_missing";

/**
 * Suffix appended to the session-JSONL path to form the staging path. Shared
 * contract with the backend's `stageClaudeSessionFile` (sandboxManager.ts),
 * which writes to it from outside the sandbox.
 */
export const SESSION_STAGING_SUFFIX = ".staged";

export interface BootstrapTarget {
  claudeSessionId: string;
  /** Absolute path Claude Code will run with as cwd. Defaults to /vercel/sandbox. */
  cwd?: string;
  /**
   * Override $HOME for testing. Real callers should let this default to homedir().
   */
  homeDir?: string;
}

/**
 * Produce the on-disk path Claude Code uses for a session JSONL.
 */
export function sessionJsonlPath(target: BootstrapTarget): string {
  const cwd = target.cwd ?? "/vercel/sandbox";
  const home = target.homeDir ?? homedir();
  const encodedCwd = cwd.replace(/\//g, "-");
  return path.join(home, ".claude", "projects", encodedCwd, `${target.claudeSessionId}.jsonl`);
}

/**
 * Whether the session JSONL exists on disk. Right after a sandbox resume the
 * snapshot restore can lag, so a single probe can transiently miss a file
 * that is actually there — callers acting on a negative must retry over a
 * few seconds first.
 */
export async function sessionJsonlExists(target: BootstrapTarget): Promise<boolean> {
  try {
    await fs.access(sessionJsonlPath(target));
    return true;
  } catch {
    return false;
  }
}

/**
 * Install a backend-staged session reconstruction, if one is present:
 * - staged file, no session file → rename it into place (atomic, same dir);
 * - staged file and a session file → delete the staged copy: the session file
 *   is owned by a live-or-recent claude process and is the newer truth;
 * - no staged file → no-op.
 * Callers must hold the conversation's opChain with no live process.
 */
export async function installStagedSessionJsonl(target: BootstrapTarget): Promise<void> {
  const finalPath = sessionJsonlPath(target);
  const stagedPath = finalPath + SESSION_STAGING_SUFFIX;
  const stagedExists = await fs.access(stagedPath).then(() => true, () => false);
  if (!stagedExists) return;
  if (await sessionJsonlExists(target)) {
    await fs.rm(stagedPath, { force: true });
    return;
  }
  await fs.rename(stagedPath, finalPath);
}
