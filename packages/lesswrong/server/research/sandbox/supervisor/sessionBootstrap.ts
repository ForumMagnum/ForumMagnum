/**
 * JSONL bootstrap for `claude --resume` in a fresh sandbox.
 *
 * Claude Code persists its conversation history at:
 *   ~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl
 * where `<encoded-cwd>` is the absolute working directory with `/` replaced
 * by `-`. The file is a sequence of JSONL events: each line is one of
 * user|assistant|tool_use|tool_result|thinking|system, and `--resume` reads
 * this file from disk to reconstruct the context window.
 *
 * When a conversation continues in a fresh sandbox (the previous one was
 * reaped or hit the lifetime cap), our `ResearchConversationEvents` table is
 * the only surviving copy. The bootstrap step writes a synthesized JSONL
 * file from those events before invoking `claude --resume`.
 *
 * Per design doc: events store the **verbatim** JSONL line as `payload`, so
 * synthesis is just JSON.stringify per event back into newline-delimited form.
 */
import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";

export interface BootstrapEvent {
  /** Parsed payload of a ResearchConversationEvent — the JSONL line as an object. */
  payload: unknown;
}

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
 * Synthesize a JSONL file from `events` at the path Claude Code expects for
 * `--resume <sessionId>`. Creates parent directories as needed. Idempotent:
 * overwrites any existing file at the same path.
 *
 * Each event's `payload` is JSON-stringified onto its own line. If `payload`
 * was already stored as a string (raw JSONL line), it's written verbatim.
 */
export async function writeBootstrapJsonl(
  target: BootstrapTarget,
  events: BootstrapEvent[],
): Promise<{ filePath: string; lineCount: number }> {
  const filePath = sessionJsonlPath(target);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const body = events.map(serializeEvent).filter((s): s is string => s !== null).join("\n");
  const withTrailingNewline = body.length > 0 ? body + "\n" : "";
  await fs.writeFile(filePath, withTrailingNewline, "utf8");
  return { filePath, lineCount: withTrailingNewline === "" ? 0 : body.split("\n").length };
}

function serializeEvent(e: BootstrapEvent): string | null {
  if (typeof e.payload === "string") return e.payload;
  if (e.payload && typeof e.payload === "object") {
    try {
      return JSON.stringify(e.payload);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Inverse of `writeBootstrapJsonl`. Mainly for tests / inspection: reads a
 * JSONL session file back into parsed objects.
 */
export async function readBootstrapJsonl(
  target: BootstrapTarget,
): Promise<unknown[]> {
  const filePath = sessionJsonlPath(target);
  const text = await fs.readFile(filePath, "utf8");
  if (text.trim().length === 0) return [];
  return text
    .split("\n")
    .filter((l) => l.length > 0)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return line;
      }
    });
}
