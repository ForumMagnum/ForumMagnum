/**
 * Claude Code subprocess runner.
 *
 * Spawns `claude -p "<prompt>" --output-format stream-json [--resume <sessionId>]`,
 * pipes stdout through the JSONL chunker, and emits each `ParsedJsonlLine` to
 * a caller-supplied sink. Manages cancellation, exit-code propagation, and
 * cleanup of per-conversation runner state.
 *
 * Design constraints:
 * - Multiple conversations may be running concurrently in the same supervisor
 *   process; each gets its own `claudeSessionId` and its own subprocess. The
 *   supervisor enforces the per-sandbox concurrency cap before calling here.
 * - We do not parse the JSONL into our own shapes; emission is verbatim. The
 *   parsed object is provided for routing/dedup convenience only.
 */
import { ChildProcessByStdio, spawn } from "node:child_process";
import type { Readable } from "node:stream";
import {
  createJsonlChunker,
  ParsedJsonlLine,
} from "./jsonlParser";

export interface ClaudeRunnerOptions {
  conversationId: string;
  prompt: string;
  /** If provided, runs `claude -p ... --resume <claudeSessionId>`. */
  claudeSessionId?: string;
  /** Path to the claude binary. Defaults to `claude` (must be on PATH). */
  claudePath?: string;
  /** Working directory of the subprocess. Defaults to `/vercel/sandbox`. */
  cwd?: string;
  /** Extra env to pass — merged with `process.env`. */
  env?: Record<string, string>;
  /** Called for every parsed JSONL line (and verbatim raw text). */
  onLine: (line: ParsedJsonlLine) => void;
  /** Called when the subprocess exits. `code` is null if killed by signal. */
  onExit: (info: { code: number | null; signal: NodeJS.Signals | null }) => void;
  /** Called when the subprocess fails to start or stdout/stderr produces an error. */
  onError: (err: Error) => void;
  /** Optional stderr forwarder (for log surfacing). Default: drop. */
  onStderr?: (chunk: string) => void;
}

export interface ClaudeRunnerHandle {
  conversationId: string;
  /** PID once spawned; null if spawn failed. */
  pid: number | null;
  /** Send a signal to the subprocess. Default: SIGTERM. */
  cancel(signal?: NodeJS.Signals): void;
  /** Resolves when the subprocess has fully exited and onExit has been called. */
  done: Promise<void>;
}

export function startClaudeRunner(opts: ClaudeRunnerOptions): ClaudeRunnerHandle {
  const claudePath = opts.claudePath ?? "claude";
  const cwd = opts.cwd ?? "/vercel/sandbox";
  const args = buildArgs(opts);

  let exited = false;
  let resolveDone: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  let proc: ChildProcessByStdio<null, Readable, Readable>;
  try {
    proc = spawn(claudePath, args, {
      cwd,
      env: { ...process.env, ...(opts.env ?? {}) },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    opts.onError(err as Error);
    opts.onExit({ code: null, signal: null });
    resolveDone!();
    return {
      conversationId: opts.conversationId,
      pid: null,
      cancel() {
        /* nothing to cancel */
      },
      done,
    };
  }

  const chunker = createJsonlChunker();

  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", (chunk: string) => {
    try {
      for (const line of chunker.push(chunk)) opts.onLine(line);
    } catch (err) {
      opts.onError(err as Error);
    }
  });

  if (opts.onStderr) {
    proc.stderr.setEncoding("utf8");
    proc.stderr.on("data", opts.onStderr);
  }

  proc.on("error", (err) => {
    opts.onError(err);
  });

  proc.on("close", (code, signal) => {
    if (exited) return;
    exited = true;
    try {
      for (const line of chunker.flush()) opts.onLine(line);
    } catch (err) {
      opts.onError(err as Error);
    }
    opts.onExit({ code, signal });
    resolveDone!();
  });

  return {
    conversationId: opts.conversationId,
    pid: proc.pid ?? null,
    cancel(signal: NodeJS.Signals = "SIGTERM") {
      if (exited) return;
      try {
        proc.kill(signal);
      } catch {
        // process might already be gone
      }
    },
    done,
  };
}

export function buildArgs(opts: Pick<ClaudeRunnerOptions, "prompt" | "claudeSessionId">): string[] {
  // `auto` is Claude Code's classifier-backed auto-approval mode (v2.1.83+).
  // The classifier model auto-approves safe operations (local edits, reads,
  // research-tool invocations, etc.) and blocks risky ones (hostile deploys,
  // mass deletion, force-pushes) — meaningfully safer than the older
  // `bypassPermissions`, which disables all checks. We need *some* form of
  // auto-approval because there's no human in the loop inside the sandbox to
  // answer a per-tool prompt; without it, every `Bash` / `research-tool`
  // call dead-ends in `permission_denials` (visible on the turn's `result`).
  const args = [
    "-p", opts.prompt,
    "--output-format", "stream-json",
    "--verbose",
    "--permission-mode", "auto",
    "--model", "claude-opus-4-7",
  ];
  if (opts.claudeSessionId) {
    args.push("--resume", opts.claudeSessionId);
  }
  return args;
}
