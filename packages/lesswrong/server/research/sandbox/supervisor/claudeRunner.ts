/**
 * Claude Code subprocess runner.
 *
 * Spawns one long-lived `claude -p --input-format stream-json --output-format
 * stream-json` process per conversation and keeps its stdin open for the life
 * of the conversation (until the sandbox stops, the process crashes, or it is
 * deliberately killed). User turns are fed in over time as stream-json user
 * messages; Claude Code queues a message that arrives mid-turn and runs it as
 * its own turn after the current one completes.
 *
 * This single-process model is what makes background Bash tasks safe: when a
 * harness-tracked background task finishes, Claude Code re-invokes the agent
 * loop *inside this same process*, so the continuation shares one context with
 * any user turns dispatched while the task was pending. (The previous
 * process-per-turn design spawned a concurrent `--resume` of the same session
 * while the old process was still alive waiting on its background task; the
 * woken process then continued from a stale context and forked the session
 * file's parentUuid chain, permanently orphaning the interleaved turns.)
 * Corollary: at most one live process may ever hold a given Claude session.
 * The hub enforces that invariant; nothing in this module may spawn without it.
 *
 * Cancellation uses the stream-json control protocol (`control_request` /
 * `interrupt`) rather than signals: the CLI aborts the in-flight turn, records
 * a "[Request interrupted by user]" user turn, and emits a normal `result`
 * line, leaving the session file consistent and the process alive for the
 * next turn. SIGTERM/SIGKILL remain as an escalation path only; after a kill
 * the next dispatch respawns with `--resume`.
 *
 * Note: we deliberately do NOT pass `--replay-user-messages`. That flag only
 * re-emits the user turn bundled with the model's first output (gated behind
 * inference), so the supervisor records the user turn itself at dispatch time
 * instead (see `conversationHub.dispatch`) — earlier and independent of the
 * model's response latency.
 *
 * The control protocol is undocumented but is the same wire protocol the
 * official Agent SDK speaks to this binary; the sandbox image pins the CLI
 * version, so treat CLI upgrades as a compatibility surface.
 */
import { ChildProcessByStdio, spawn } from "node:child_process";
import type { Readable, Writable } from "node:stream";
import {
  createJsonlChunker,
  ParsedJsonlLine,
} from "./jsonlParser";
import { RESEARCH_AGENT_MODEL } from "../sandboxLayout";

/**
 * A `can_use_tool` control_request the CLI emits when a tool needs an out-of-band
 * decision — for us, only `AskUserQuestion` reaches this path (safe tools are
 * auto-approved by `--permission-mode auto`'s classifier before it; verified
 * empirically). `input` is the tool's input (for AskUserQuestion, `{questions}`).
 */
export interface CanUseToolRequest {
  requestId: string;
  toolName: string;
  toolUseId: string;
  input: Record<string, unknown>;
}

/** The `response` body of a `control_response` that resolves a can_use_tool. */
export type PermissionDecision =
  | { behavior: "allow"; updatedInput: Record<string, unknown>; toolUseId: string }
  | { behavior: "deny"; message: string };

export interface ClaudeProcessOptions {
  conversationId: string;
  /**
   * The Claude session this process owns. With `sessionMode: "new"` the
   * process is started with `--session-id` (fresh session under this exact
   * id); with `"resume"` it's started with `--resume` (session JSONL must
   * already exist on disk, possibly synthesized by the bootstrap step).
   */
  claudeSessionId: string;
  sessionMode: "new" | "resume";
  /** Appended to Claude Code's default system prompt (per-conversation context). */
  appendSystemPrompt?: string;
  /** Path to the claude binary. Defaults to `claude` (must be on PATH). */
  claudePath?: string;
  /** Working directory of the subprocess. Defaults to `/vercel/sandbox`. */
  cwd?: string;
  /** Extra env to pass — merged with `process.env`. */
  env?: Record<string, string>;
  /** Called for every parsed JSONL line (and verbatim raw text). */
  onLine: (line: ParsedJsonlLine) => void;
  /**
   * Called for each inbound `can_use_tool` control_request. The handler must
   * eventually call `respondPermission` with a decision (for AskUserQuestion,
   * after the user answers) — the CLI's turn is paused until it does.
   */
  onCanUseTool?: (req: CanUseToolRequest) => void;
  /** Called when the subprocess exits. `code` is null if killed by signal. */
  onExit: (info: { code: number | null; signal: NodeJS.Signals | null }) => void;
  /** Called when the subprocess fails to start or stdout/stderr produces an error. */
  onError: (err: Error) => void;
  /** Optional stderr forwarder (for log surfacing). Default: drop. */
  onStderr?: (chunk: string) => void;
}

export interface ClaudeProcessHandle {
  conversationId: string;
  claudeSessionId: string;
  /** PID once spawned; null if spawn failed. */
  pid: number | null;
  /** True until the process has exited (or failed to spawn). */
  alive(): boolean;
  /**
   * Feed one user turn as a stream-json message. Returns false if the process
   * is no longer writable (caller should respawn and retry).
   */
  sendUserMessage(content: string): boolean;
  /**
   * Send an `interrupt` control_request. The CLI acks with a
   * `control_response` line and ends the in-flight turn with a `result`.
   * Returns false if the process is no longer writable.
   */
  interrupt(requestId: string): boolean;
  /**
   * Resolve a `can_use_tool` control_request with a decision (allow-with-answers
   * for AskUserQuestion, or deny). Returns false if the process is no longer
   * writable.
   */
  respondPermission(requestId: string, decision: PermissionDecision): boolean;
  /** Escalation path; prefer `interrupt`. Default: SIGTERM. */
  kill(signal?: NodeJS.Signals): void;
  /** Resolves when the subprocess has fully exited and onExit has been called. */
  done: Promise<void>;
}

export function startClaudeProcess(opts: ClaudeProcessOptions): ClaudeProcessHandle {
  const claudePath = opts.claudePath ?? "claude";
  const cwd = opts.cwd ?? "/vercel/sandbox";
  const args = buildArgs(opts);

  let exited = false;
  let resolveDone: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  let proc: ChildProcessByStdio<Writable, Readable, Readable>;
  try {
    proc = spawn(claudePath, args, {
      cwd,
      env: {
        ...process.env,
        // Opt into authoritative `session_state_changed` events (idle/running/
        // requires_action). The hub derives busy-state from these rather than
        // inferring it from the turn stream — `idle` is the CLI's own
        // turn-over signal and already accounts for queued messages and
        // background-task re-invocations.
        CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS: "1",
        ...(opts.env ?? {}),
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    exited = true;
    opts.onError(err as Error);
    opts.onExit({ code: null, signal: null });
    resolveDone!();
    return {
      conversationId: opts.conversationId,
      claudeSessionId: opts.claudeSessionId,
      pid: null,
      alive: () => false,
      sendUserMessage: () => false,
      interrupt: () => false,
      respondPermission: () => false,
      kill() {
        /* nothing to kill */
      },
      done,
    };
  }

  const chunker = createJsonlChunker();

  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", (chunk: string) => {
    try {
      for (const line of chunker.push(chunk)) {
        // `can_use_tool` control_requests are our control channel, not
        // transcript content — route them to the permission handler instead of
        // the persistence stream. Everything else flows to onLine.
        const canUseTool = asCanUseToolRequest(line.parsed);
        if (canUseTool) {
          opts.onCanUseTool?.(canUseTool);
        } else {
          opts.onLine(line);
        }
      }
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

  proc.stdin.on("error", (err) => opts.onError(err));

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

  function writeLine(payload: unknown): boolean {
    if (exited || !proc.stdin.writable) return false;
    try {
      proc.stdin.write(`${JSON.stringify(payload)}\n`);
      return true;
    } catch (err) {
      opts.onError(err as Error);
      return false;
    }
  }

  return {
    conversationId: opts.conversationId,
    claudeSessionId: opts.claudeSessionId,
    pid: proc.pid ?? null,
    alive: () => !exited,
    sendUserMessage(content: string): boolean {
      return writeLine({
        type: "user",
        message: { role: "user", content },
      });
    },
    interrupt(requestId: string): boolean {
      return writeLine({
        type: "control_request",
        request_id: requestId,
        request: { subtype: "interrupt" },
      });
    },
    respondPermission(requestId: string, decision: PermissionDecision): boolean {
      const response = decision.behavior === "allow"
        ? {
            behavior: "allow",
            updatedInput: decision.updatedInput,
            // The CLI keys the resolved tool call by this id.
            toolUseID: decision.toolUseId,
          }
        : { behavior: "deny", message: decision.message };
      return writeLine({
        type: "control_response",
        response: { subtype: "success", request_id: requestId, response },
      });
    },
    kill(signal: NodeJS.Signals = "SIGTERM") {
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

/**
 * Recognize a `can_use_tool` control_request and normalize it, or return null.
 * Shape (verified against Claude Code 2.1.198):
 *   { type: "control_request", request_id, request: { subtype: "can_use_tool",
 *     tool_name, tool_use_id, input } }
 */
function asCanUseToolRequest(parsed: Record<string, unknown> | null): CanUseToolRequest | null {
  if (!parsed || parsed.type !== "control_request") return null;
  const request = parsed.request;
  if (!request || typeof request !== "object") return null;
  const req = request as Record<string, unknown>;
  if (req.subtype !== "can_use_tool") return null;
  const requestId = parsed.request_id;
  const toolName = req.tool_name;
  const toolUseId = req.tool_use_id;
  const input = req.input;
  if (
    typeof requestId !== "string" ||
    typeof toolName !== "string" ||
    typeof toolUseId !== "string" ||
    !input || typeof input !== "object"
  ) {
    return null;
  }
  return { requestId, toolName, toolUseId, input: input as Record<string, unknown> };
}

export function buildArgs(
  opts: Pick<ClaudeProcessOptions, "claudeSessionId" | "sessionMode" | "appendSystemPrompt">,
): string[] {
  // `auto` is Claude Code's classifier-backed auto-approval mode (v2.1.83+).
  // The classifier model auto-approves safe operations (local edits, reads,
  // research-tool invocations, etc.) and blocks risky ones (hostile deploys,
  // mass deletion, force-pushes) — meaningfully safer than the older
  // `bypassPermissions`, which disables all checks. We need *some* form of
  // auto-approval because there's no human in the loop inside the sandbox to
  // answer a per-tool prompt; without it, every `Bash` / `research-tool`
  // call dead-ends in `permission_denials` (visible on the turn's `result`).
  const args = [
    "-p",
    "--input-format", "stream-json",
    "--output-format", "stream-json",
    "--verbose",
    "--permission-mode", "auto",
    // Route out-of-band tool decisions to us over stdio control_requests. Under
    // `--permission-mode auto` the classifier still auto-approves safe tools
    // (Bash, research-tool, edits) *before* this, so in practice only
    // AskUserQuestion — which has no automatic answer — reaches the channel
    // (verified empirically). Without it, AskUserQuestion dead-ends.
    "--permission-prompt-tool", "stdio",
    "--model", RESEARCH_AGENT_MODEL,
  ];
  if (opts.sessionMode === "resume") {
    args.push("--resume", opts.claudeSessionId);
  } else {
    args.push("--session-id", opts.claudeSessionId);
  }
  if (opts.appendSystemPrompt) {
    args.push("--append-system-prompt", opts.appendSystemPrompt);
  }
  return args;
}
