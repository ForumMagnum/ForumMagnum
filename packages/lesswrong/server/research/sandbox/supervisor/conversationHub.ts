/**
 * Per-conversation runner hub.
 *
 * Owns the single long-lived Claude Code process for each conversation and
 * fans every parsed JSONL line to `postPersister`, which durably ships it to
 * the backend (the single source of truth for clients). Persistence happens
 * regardless of whether any client is watching.
 *
 * Invariant: at most one live claude process per conversation (and therefore
 * per Claude session — sandboxes are one-conversation scoped). All spawns go
 * through `ensureProcess`, which awaits the previous process's full exit
 * before starting a replacement. Two processes holding the same session is
 * exactly the bug class that caused permanent history loss under the old
 * process-per-turn design: a process kept alive by a background task would
 * later continue from a stale context and fork the session file's parentUuid
 * chain, orphaning every turn dispatched in the interim.
 *
 * Turn lifecycle: a dispatch writes one user message to the process's stdin.
 * Claude Code queues messages that arrive mid-turn and runs each as its own
 * turn (one `result` line per turn). Background-task completions re-invoke
 * the agent inside the same process with *no* dispatch — such turns begin
 * with a `system:init` line and also end with a `result`. Busy state is
 * therefore derived from the stream itself:
 *
 *  - `pendingTurns` counts dispatched user messages whose turn hasn't
 *    *started* yet. It's decremented on `system:init` (the line that opens
 *    every turn), NOT on `result` — a result can belong to a background-task
 *    re-invocation that had no dispatch, and consuming a queued turn's count
 *    there would let the conversation read idle (and the sandbox get rolled)
 *    out from under a queued message. A re-invocation's init can still
 *    consume a queued turn's count, but that mislabels a much smaller window
 *    (the re-invocation itself is busy via activity) and re-rights itself at
 *    the queued turn's own init.
 *  - `activitySinceResult` is true while turn output is streaming.
 */
import { randomUUID } from "node:crypto";
import { ParsedJsonlLine, ClaudeEventKind } from "./jsonlParser";
import { ClaudeProcessHandle, startClaudeProcess } from "./claudeRunner";
import { BackendEvent, PostPersister } from "./postPersister";
import { writeBootstrapJsonl } from "./sessionBootstrap";
import { ConversationState } from "./server";
import {
  isTurnActivity,
  FLUSH_RESULT_SUBTYPE,
  TURN_OPENING_SYSTEM_SUBTYPE,
} from "../../../../lib/research/turnActivity";

/** How long cancel waits for the interrupt control_request to end the turn
 * before escalating to SIGTERM (then SIGKILL). Interrupt normally lands in
 * single-digit seconds; the margin covers a turn stuck in a slow tool call. */
const CANCEL_INTERRUPT_GRACE_MS = 10_000;
const CANCEL_SIGKILL_GRACE_MS = 5_000;

/**
 * Task statuses that mean a background task has settled, taken from the Claude
 * Code Agent SDK message types (`@anthropic-ai/claude-agent-sdk`): the union of
 * `SDKTaskNotificationMessage.status` ({completed, failed, stopped}) and the
 * terminal subset of `SDKTaskUpdatedMessage.patch.status` ({completed, failed,
 * killed}). The SDK exports the same set as `TERMINAL_TASK_STATUSES`. Every
 * other status (pending/running/paused) and statusless patches (e.g.
 * `{is_backgrounded: true}`) are non-terminal and keep the task counted.
 */
const TERMINAL_TASK_STATUSES = new Set(["completed", "failed", "killed", "stopped"]);

export interface ConversationHubConfig {
  postPersister: PostPersister;
  /** Override clock for tests. */
  now?: () => number;
  /** Override process factory for tests. */
  startProcess?: typeof startClaudeProcess;
}

interface ConversationEntry {
  conversationId: string;
  state: ConversationState;
  proc: ClaudeProcessHandle | null;
  claudeSessionId: string | null;
  /** Dispatched user messages whose turn hasn't opened (no `system:init` yet). */
  pendingTurns: number;
  /** True when turn output has streamed since the last `result` line. */
  activitySinceResult: boolean;
  /**
   * Whether a `system:init` arrived since the last `result`. A result that
   * arrives without one belongs to a dispatched turn that failed before
   * opening (early CLI error), so it must release a pending count — otherwise
   * the conversation reads busy forever while the client transcript reads
   * idle.
   */
  initSeenSinceResult: boolean;
  /**
   * Set by cancel(); cleared by the next `result` line (the interrupted
   * turn's terminal) or process exit — NOT by a dispatch, so a new message
   * racing the cancel can't make the interrupted turn read as "completed" or
   * defuse the SIGTERM escalation while the interrupt is still unanswered.
   */
  cancelPending: boolean;
  /**
   * Background Bash tasks the agent has started that haven't reached a terminal
   * status yet (see `updateOutstandingTasks` for the terminal signals). A
   * pending task means the process may re-invoke the agent later, so the
   * sandbox must be kept alive even though no turn is running — surfaced to the
   * heartbeat via `hasPendingWork`.
   */
  outstandingTaskIds: Set<string>;
  /** Serializes spawn/teardown so two dispatches can't race a respawn. */
  opChain: Promise<void>;
}

interface RunnerOpts {
  cwd?: string;
  env?: Record<string, string>;
  appendSystemPrompt?: string;
}

export interface DispatchInput {
  conversationId: string;
  prompt: string;
  /**
   * The Claude session this conversation owns. The backend supplies it on
   * every dispatch (derived deterministically at conversation creation, or
   * the stored id for older conversations). If absent — only possible from a
   * not-yet-redeployed backend's first-turn dispatch — the hub generates one;
   * that old backend still runs the first-write-wins event capture, and even
   * without it the new backend's legacy path reconstructs the session from
   * persisted events under a derived id.
   */
  claudeSessionId?: string;
  /**
   * True when a Claude session for this conversation has existed before (the
   * backend checks its persisted events for any line carrying a session_id).
   * Decides `--resume` vs `--session-id` at spawn. This deliberately comes
   * from the backend rather than a supervisor-side existence check on the
   * session file: right after a sandbox resume the snapshot restore can lag,
   * so a filesystem probe races it — observed as `--session-id` being chosen
   * for an existing session, which the CLI rejects with "already in use".
   */
  sessionHasHistory?: boolean;
  /**
   * Verbatim JSONL lines from prior `ResearchConversationEvents`, in seq order.
   * If non-empty, the hub writes them to the Claude Code session dir before
   * spawning so `--resume` finds the history. Each entry is one line of text.
   * The write replaces any file already at that path: the backend only ships
   * a bootstrap when the on-disk file can't be trusted (fresh rebuild — where
   * any file present came from a stale base snapshot — or a legacy
   * conversation with a just-derived id), so the reconstruction wins.
   * Ignored when the conversation's process is already running (the live
   * process owns the session file).
   */
  bootstrapJsonl?: string[];
}

/**
 * Ship a supervisor-synthesized terminal `result` for a turn that can't end
 * normally (process crash, cancel flush, sandbox restart). Uses the
 * `interrupted` subtype, which in-flight derivations treat as closing every
 * outstanding user turn; `writeBootstrapJsonl` strips result lines, so it
 * never lands back in Claude's resume context.
 */
export function enqueueSyntheticInterruptedResult(
  postPersister: PostPersister,
  conversationId: string,
  message: string,
  nowMs: number,
): void {
  postPersister.enqueue(conversationId, {
    rawJsonl: JSON.stringify({
      type: "result",
      subtype: FLUSH_RESULT_SUBTYPE,
      is_error: true,
      result: message,
    }),
    kind: "result",
    claudeMessageUuid: null,
    supervisorEmittedAt: new Date(nowMs).toISOString(),
  });
}

export function createConversationHub(config: ConversationHubConfig) {
  const now = config.now ?? (() => Date.now());
  const startProcess = config.startProcess ?? startClaudeProcess;
  const conversations = new Map<string, ConversationEntry>();
  let interruptCounter = 0;

  function getOrInit(conversationId: string): ConversationEntry {
    const existing = conversations.get(conversationId);
    if (existing) return existing;
    const entry: ConversationEntry = {
      conversationId,
      state: { conversationId, status: "idle" },
      proc: null,
      claudeSessionId: null,
      pendingTurns: 0,
      activitySinceResult: false,
      initSeenSinceResult: false,
      cancelPending: false,
      outstandingTaskIds: new Set(),
      opChain: Promise.resolve(),
    };
    conversations.set(conversationId, entry);
    return entry;
  }

  function isBusy(entry: ConversationEntry): boolean {
    return entry.pendingTurns > 0 || entry.activitySinceResult;
  }

  function refreshStatus(entry: ConversationEntry, terminal?: ConversationState["status"]) {
    if (isBusy(entry)) {
      if (entry.state.status !== "running") {
        entry.state = { conversationId: entry.conversationId, status: "running", startedAt: now() };
      }
      return;
    }
    if (terminal && entry.state.status === "running") {
      entry.state = { ...entry.state, status: terminal, endedAt: now() };
    }
  }

  function emit(entry: ConversationEntry, line: ParsedJsonlLine) {
    const persistKind = mapKindForPersistence(line.kind);
    if (persistKind) {
      config.postPersister.enqueue(entry.conversationId, {
        rawJsonl: line.raw,
        kind: persistKind,
        claudeMessageUuid: line.claudeMessageUuid,
        claudeSessionId: line.sessionId ?? undefined,
        supervisorEmittedAt: new Date(now()).toISOString(),
      });
    }

    const subtype = systemSubtypeOf(line);

    if (line.kind === "system" && line.parsed) {
      if (subtype === TURN_OPENING_SYSTEM_SUBTYPE) {
        // A turn opened; if one of ours was queued, it's (presumably) this
        // one. See the module doc for why init — not result — consumes the
        // pending count.
        entry.pendingTurns = Math.max(0, entry.pendingTurns - 1);
        entry.initSeenSinceResult = true;
      }
      updateOutstandingTasks(entry, subtype, line.parsed);
    }

    if (line.kind === "result") {
      // One `result` per turn — dispatched, queued, or a background-task
      // re-invocation. Turn-end for busy purposes; the conversation may still
      // have queued turns pending. An init-less result is a dispatched turn
      // that failed before opening: release its pending count here, since no
      // init ever will. (Re-invocation results can't take this branch — every
      // re-invocation opens with its own init.)
      if (!entry.initSeenSinceResult) {
        entry.pendingTurns = Math.max(0, entry.pendingTurns - 1);
      }
      entry.initSeenSinceResult = false;
      entry.activitySinceResult = false;
      const wasCancel = entry.cancelPending;
      entry.cancelPending = false;
      if (wasCancel && entry.pendingTurns > 0) {
        // The cancel interrupted a turn while other dispatched messages were
        // still queued on stdin. Whether the CLI runs or drops queued
        // messages after an interrupt is version-dependent, so close them out
        // now — a cancel means "stop everything outstanding". If the CLI does
        // run one anyway, its init/activity re-raise busy state.
        entry.pendingTurns = 0;
        enqueueSyntheticInterruptedResult(
          config.postPersister,
          entry.conversationId,
          "Turn cancelled.",
          now(),
        );
      }
      refreshStatus(entry, wasCancel ? "cancelled" : "completed");
      return;
    }

    if (isTurnActivity(line.kind, subtype)) {
      entry.activitySinceResult = true;
      refreshStatus(entry);
    }
  }

  /**
   * Ensure the conversation's long-lived process exists, spawning (or
   * respawning after a crash/kill) if needed. Serialized per conversation via
   * `opChain` and always awaits the prior process's full exit first — the
   * single-writer invariant for the session file.
   */
  async function ensureProcess(
    entry: ConversationEntry,
    input: DispatchInput,
    runnerOpts: RunnerOpts,
  ): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (entry.proc?.alive()) return { ok: true };

    const previous = entry.proc;
    if (previous) {
      await previous.done;
      if (entry.proc === previous) entry.proc = null;
    }

    const claudeSessionId = entry.claudeSessionId ?? input.claudeSessionId ?? randomUUID();
    entry.claudeSessionId = claudeSessionId;

    let sessionExists = input.sessionHasHistory ?? false;

    if (input.bootstrapJsonl && input.bootstrapJsonl.length > 0) {
      try {
        await writeBootstrapJsonl(
          { claudeSessionId, cwd: runnerOpts.cwd },
          input.bootstrapJsonl.map((line) => ({ payload: line })),
        );
        sessionExists = true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `[hub] bootstrap write failed for conv=${entry.conversationId} session=${claudeSessionId}:`,
          err,
        );
        return { ok: false, reason: "bootstrap_failed" };
      }
    }

    const proc = startProcess({
      conversationId: entry.conversationId,
      claudeSessionId,
      sessionMode: sessionExists ? "resume" : "new",
      appendSystemPrompt: runnerOpts.appendSystemPrompt,
      cwd: runnerOpts.cwd,
      env: runnerOpts.env,
      onLine: (line) => emit(entry, line),
      onExit: ({ code }) => {
        if (entry.proc !== proc) return;
        entry.proc = null;
        if (isBusy(entry)) {
          // The process died mid-turn (crash, OOM, cancel escalation). Close
          // the dangling turn(s) with a synthetic terminal `result` so
          // clients aren't stuck on "running".
          const interrupted = entry.cancelPending;
          enqueueSyntheticInterruptedResult(
            config.postPersister,
            entry.conversationId,
            interrupted
              ? "Turn cancelled."
              : `Turn interrupted: the agent process exited unexpectedly${code !== null ? ` (code ${code})` : ""}.`,
            now(),
          );
          entry.pendingTurns = 0;
          entry.activitySinceResult = false;
          refreshStatus(entry, interrupted ? "cancelled" : "errored");
        }
        entry.initSeenSinceResult = false;
        entry.cancelPending = false;
        // No process, no future re-invocation: pending tasks can't keep the
        // sandbox alive any more (orphaned task processes die with the sandbox).
        entry.outstandingTaskIds.clear();
      },
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error(`[hub] runner error conv=${entry.conversationId}:`, err);
      },
      onStderr: (chunk) => {
        // eslint-disable-next-line no-console
        console.error(`[hub] claude stderr conv=${entry.conversationId}: ${chunk}`);
      },
    });
    entry.proc = proc;
    if (!proc.alive()) {
      entry.proc = null;
      return { ok: false, reason: "spawn_failed" };
    }
    return { ok: true };
  }

  async function dispatch(
    input: DispatchInput,
    runnerOpts?: RunnerOpts,
  ): Promise<{ accepted: boolean; reason?: string }> {
    const entry = getOrInit(input.conversationId);
    const opts = runnerOpts ?? {};

    // A turn may already be running — that's fine. The message is written to
    // the live process's stdin; Claude Code queues it and runs it as its own
    // turn after the current one (verified empirically; see the design notes
    // in claudeRunner.ts).
    let result: { accepted: boolean; reason?: string } = { accepted: true };
    const run = entry.opChain.then(async () => {
      const ensured = await ensureProcess(entry, input, opts);
      if (!ensured.ok) {
        result = { accepted: false, reason: ensured.reason };
        return;
      }

      let sent = entry.proc!.sendUserMessage(input.prompt);
      if (!sent) {
        // The process's stdin is gone but it may not have fully exited. Tear
        // it down and make one respawn attempt; the session file has
        // everything up to the last completed turn. (Capture the handle:
        // onExit nulls entry.proc, possibly synchronously.)
        const dead = entry.proc!;
        dead.kill("SIGKILL");
        await dead.done;
        const respawned = await ensureProcess(entry, input, opts);
        sent = respawned.ok && entry.proc!.sendUserMessage(input.prompt);
      }
      if (!sent) {
        result = { accepted: false, reason: "process_unavailable" };
        return;
      }

      // Persist the user's turn only after it has been handed to the process:
      // a failed dispatch ships nothing, so the backend's error response and
      // the transcript agree (the client re-sends without creating a
      // duplicate). Claude never echoes the message itself (no
      // --replay-user-messages), and the send→enqueue window is synchronous,
      // so the user event still precedes any of the turn's output in seq
      // order. `claudeMessageUuid: null` lets the persister synthesize a
      // stable `sup:<localId>` idempotency key.
      config.postPersister.enqueue(input.conversationId, {
        rawJsonl: JSON.stringify({
          type: "user",
          message: { role: "user", content: input.prompt },
          parent_tool_use_id: null,
        }),
        kind: "user",
        claudeMessageUuid: null,
        supervisorEmittedAt: new Date(now()).toISOString(),
      });
      entry.pendingTurns += 1;
      refreshStatus(entry);
    });
    entry.opChain = run.then(noop, noop);
    await run;
    return result;
  }

  /**
   * Cancel the in-flight turn via the stream-json `interrupt` control
   * request: the CLI aborts the turn, records "[Request interrupted by
   * user]" in the session, and emits a normal `result` — process stays alive
   * for the next turn. Escalates to SIGTERM/SIGKILL if no `result` arrives
   * within the grace period (`cancelPending` still set); a result arriving
   * for ANY turn clears `cancelPending` and defuses the escalation, so a new
   * turn dispatched after a successful interrupt can't be killed by the
   * stale timer. The killed process is respawned lazily by the next dispatch
   * via `--resume`.
   */
  async function cancel(conversationId: string): Promise<void> {
    const entry = conversations.get(conversationId);
    if (!entry || !entry.proc?.alive() || !isBusy(entry)) return;
    const proc = entry.proc;
    entry.cancelPending = true;
    const requestId = `interrupt-${++interruptCounter}`;
    const wrote = proc.interrupt(requestId);
    const escalate = () => {
      if (entry.proc !== proc || !proc.alive()) return;
      if (!entry.cancelPending) return; // a result arrived since cancel; interrupt landed
      proc.kill("SIGTERM");
      setTimeout(() => {
        if (entry.proc === proc && proc.alive()) proc.kill("SIGKILL");
      }, CANCEL_SIGKILL_GRACE_MS).unref();
    };
    if (!wrote) {
      escalate();
      return;
    }
    setTimeout(escalate, CANCEL_INTERRUPT_GRACE_MS).unref();
  }

  function snapshot(): {
    conversations: ConversationState[];
    concurrencyCount: number;
  } {
    const states = [...conversations.values()].map((e) => e.state);
    const running = states.filter((s) => s.status === "running").length;
    return { conversations: states, concurrencyCount: running };
  }

  /**
   * True while the sandbox must be kept alive for agent work: a turn is
   * running, or a background task is pending whose completion will re-invoke
   * the agent. Drives the heartbeat's `turnRunning` (which re-arms the idle
   * timeout and defers session rolls) and the /status snapshot (which gates
   * environment saves).
   */
  function hasPendingWork(): boolean {
    return [...conversations.values()].some(
      (e) => isBusy(e) || (e.proc?.alive() === true && e.outstandingTaskIds.size > 0),
    );
  }

  /** Graceful teardown for supervisor shutdown: end stdin-fed processes. */
  async function shutdown(): Promise<void> {
    const procs = [...conversations.values()]
      .map((e) => e.proc)
      .filter((p): p is ClaudeProcessHandle => p !== null && p.alive());
    for (const proc of procs) proc.kill("SIGTERM");
    await Promise.all(procs.map((p) => p.done));
  }

  return {
    dispatch,
    cancel,
    snapshot,
    hasPendingWork,
    shutdown,
  };
}

function noop(): void {}

function systemSubtypeOf(line: ParsedJsonlLine): string | undefined {
  const subtype = line.parsed?.subtype;
  return typeof subtype === "string" ? subtype : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTerminalTaskStatus(status: unknown): boolean {
  return typeof status === "string" && TERMINAL_TASK_STATUSES.has(status);
}

/**
 * Maintain `entry.outstandingTaskIds` from the agent's task lifecycle events: a
 * background Bash task is added on `task_started` and removed once it settles.
 * Its terminal signal arrives in one of two shapes (Agent SDK message types),
 * and a background Bash task uses ONLY the second — it emits no
 * `task_notification` (verified against Claude Code 2.1.170 and 2.1.181):
 *   - `task_notification.status` ∈ TERMINAL_TASK_STATUSES
 *   - `task_updated.patch.status` ∈ TERMINAL_TASK_STATUSES
 * Non-terminal `task_updated` patches (status running/pending/paused, or an
 * `is_backgrounded`/progress-only patch with no status) keep the task counted;
 * anything still outstanding when the process exits is cleared in `onExit`.
 */
function updateOutstandingTasks(
  entry: ConversationEntry,
  subtype: string | undefined,
  parsed: Record<string, unknown>,
): void {
  const taskId = parsed.task_id;
  if (typeof taskId !== "string") return;

  if (subtype === "task_started") {
    entry.outstandingTaskIds.add(taskId);
    return;
  }
  if (subtype === "task_notification" && isTerminalTaskStatus(parsed.status)) {
    entry.outstandingTaskIds.delete(taskId);
    return;
  }
  if (subtype === "task_updated") {
    const patch = parsed.patch;
    if (isRecord(patch) && isTerminalTaskStatus(patch.status)) {
      entry.outstandingTaskIds.delete(taskId);
    }
  }
}

/**
 * Translate the parser-detected kind into one of the backend's accepted
 * persistence kinds. Returns null for kinds we drop on the floor:
 *  - "unknown" — unrecognized line shape (incl. `control_response` acks and
 *               `rate_limit_event`); not persisted to keep the persistence
 *               schema strict. Backend can reject these explicitly.
 *
 * `result` is persisted because it's the only line Claude Code emits exactly
 * once per turn regardless of how many intermediate events the turn produced;
 * the client uses its presence as a turn-end signal. It's filtered back out
 * in `writeBootstrapJsonl` so it never lands in Claude's resume context.
 */
function mapKindForPersistence(kind: ClaudeEventKind): BackendEvent["kind"] | null {
  switch (kind) {
    case "user":
    case "assistant":
    case "tool_use":
    case "tool_result":
    case "thinking":
    case "system":
    case "error":
    case "result":
      return kind;
    case "unknown":
      return null;
    default: {
      const _exhaustive: never = kind;
      void _exhaustive;
      return null;
    }
  }
}
