/**
 * Per-conversation runner hub.
 *
 * Owns the live Claude Code runner for each conversation and fans every parsed
 * JSONL line to `postPersister`, which durably ships it to the backend (the
 * single source of truth for clients). Persistence happens regardless of
 * whether any client is watching.
 */
import { ClaudeEventKind, ParsedJsonlLine } from "./jsonlParser";
import { ClaudeRunnerHandle, startClaudeRunner } from "./claudeRunner";
import { BackendEvent, PostPersister } from "./postPersister";
import { writeBootstrapJsonl } from "./sessionBootstrap";
import { ConversationState } from "./server";

export interface ConversationHubConfig {
  postPersister: PostPersister;
  /** Override clock for tests. */
  now?: () => number;
  /** Override runner creation for tests. */
  startRunner?: typeof startClaudeRunner;
}

interface ConversationEntry {
  conversationId: string;
  state: ConversationState;
  runner: ClaudeRunnerHandle | null;
  claudeSessionId?: string;
  /**
   * Monotonic id of the most recently dispatched turn. A runner's callbacks
   * carry the id they were started with; once a newer turn supersedes them
   * (the prior turn finished but its process is still alive), the stale
   * callbacks check this and become no-ops instead of mutating the entry.
   */
  activeTurnId: number;
}

export interface DispatchInput {
  conversationId: string;
  prompt: string;
  /**
   * If set, runs `claude -p ... --resume <id>`. Must point at an existing
   * session JSONL on disk, OR be combined with `bootstrapJsonl` so the
   * supervisor synthesizes the file from prior persisted events first.
   */
  claudeSessionId?: string;
  /**
   * Verbatim JSONL lines from prior `ResearchConversationEvents`, in seq order.
   * If non-empty, the hub writes them to the Claude Code session dir before
   * spawning so `--resume` finds the history. Each entry is one line of text.
   */
  bootstrapJsonl?: string[];
}

export function createConversationHub(config: ConversationHubConfig) {
  const now = config.now ?? (() => Date.now());
  const startRunner = config.startRunner ?? startClaudeRunner;
  const conversations = new Map<string, ConversationEntry>();

  function getOrInit(conversationId: string): ConversationEntry {
    const existing = conversations.get(conversationId);
    if (existing) return existing;
    const entry: ConversationEntry = {
      conversationId,
      state: { conversationId, status: "idle" },
      runner: null,
      activeTurnId: 0,
    };
    conversations.set(conversationId, entry);
    return entry;
  }

  function emit(entry: ConversationEntry, line: ParsedJsonlLine, turnId: number) {
    if (entry.activeTurnId !== turnId) return;

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

    // The `result` line is the turn's terminal signal — emitted once when the
    // turn is done, independent of whether the process then exits (a backgrounded
    // child can keep it alive). Completion is tracked here, not at process exit.
    if (line.kind === "result" && entry.state.status === "running") {
      entry.state = { ...entry.state, status: "completed", endedAt: now() };
    }

    if (line.sessionId && !entry.claudeSessionId) {
      entry.claudeSessionId = line.sessionId;
    }
  }

  async function dispatch(
    input: DispatchInput,
    runnerOpts?: { cwd?: string; env?: Record<string, string> },
  ): Promise<{ accepted: boolean; reason?: string }> {
    const entry = getOrInit(input.conversationId);
    if (entry.runner && entry.state.status === "running") {
      return { accepted: false, reason: "already running" };
    }
    if (entry.runner) {
      // The previous turn reached a terminal status but its process is still
      // alive (a backgrounded child is holding it open). Starting the next turn
      // is safe, but the old runner must be stopped before its stale context can
      // emit more events into this conversation.
      // eslint-disable-next-line no-console
      console.warn(`[hub] conv=${input.conversationId} starting turn with a live prior runner (status=${entry.state.status})`);
      entry.runner.cancel("SIGTERM");
    }

    if (input.claudeSessionId && input.bootstrapJsonl && input.bootstrapJsonl.length > 0) {
      try {
        await writeBootstrapJsonl(
          { claudeSessionId: input.claudeSessionId, cwd: runnerOpts?.cwd },
          input.bootstrapJsonl.map((line) => ({ payload: line })),
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `[hub] bootstrap write failed for conv=${input.conversationId} session=${input.claudeSessionId}:`,
          err,
        );
        return { accepted: false, reason: "bootstrap_failed" };
      }
    }

    const turnId = entry.activeTurnId + 1;
    entry.activeTurnId = turnId;
    entry.state = { conversationId: input.conversationId, status: "running", startedAt: now() };
    entry.claudeSessionId = input.claudeSessionId ?? entry.claudeSessionId;

    // Persist the user's turn now, from the prompt we already hold, rather than
    // waiting for Claude to echo it. Claude Code only re-emits the user message
    // bundled with its first model output — seconds later, and scaling with turn
    // complexity (it withholds the echo until inference produces its first
    // streamed message), so we'd otherwise have no record of the user's turn
    // until then. Emitting it here, before the runner starts, gives it the
    // turn's lowest seq and keeps the supervisor the single writer shipping it
    // through the durable queue → backend webhook. `claudeMessageUuid: null`
    // lets the persister synthesize a stable `sup:<localId>` idempotency key.
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

    const runner = startRunner({
      conversationId: input.conversationId,
      prompt: input.prompt,
      claudeSessionId: input.claudeSessionId,
      cwd: runnerOpts?.cwd,
      env: runnerOpts?.env,
      onLine: (line) => emit(entry, line, turnId),
      onExit: ({ code }) => {
        // A runner superseded by a newer turn must not touch the entry.
        if (entry.activeTurnId !== turnId) return;
        // Backstop for turns that exit without ever emitting a `result` (crash,
        // kill). A turn already moved to a terminal status by `emit` (the normal
        // case) or by `cancel` is left untouched.
        if (entry.state.status === "running") {
          entry.state = {
            ...entry.state,
            status: code === 0 ? "completed" : "errored",
            endedAt: now(),
          };
        }
        entry.runner = null;
      },
      onError: (err) => {
        // eslint-disable-next-line no-console
        console.error(`[hub] runner error conv=${input.conversationId}:`, err);
      },
      onStderr: (chunk) => {
        // eslint-disable-next-line no-console
        console.error(`[hub] claude stderr conv=${input.conversationId}: ${chunk}`);
      },
    });
    entry.runner = runner;
    return { accepted: true };
  }

  async function cancel(conversationId: string): Promise<void> {
    const entry = conversations.get(conversationId);
    if (!entry || !entry.runner) return;
    // Only an in-progress turn can be cancelled. A completed turn whose process
    // is still alive (a backgrounded child) must not be torn down here.
    if (entry.state.status !== "running") return;
    const cancelledRunner = entry.runner;
    entry.state = { ...entry.state, status: "cancelled" };
    cancelledRunner.cancel("SIGTERM");
    // SIGKILL fallback if still running after grace period — but only if this is
    // still the same runner, so a turn dispatched in the meantime isn't killed.
    setTimeout(() => {
      if (entry.runner === cancelledRunner) cancelledRunner.cancel("SIGKILL");
    }, 5_000);
  }

  function snapshot(): {
    conversations: ConversationState[];
    concurrencyCount: number;
  } {
    const states = [...conversations.values()].map((e) => e.state);
    const running = states.filter((s) => s.status === "running").length;
    return { conversations: states, concurrencyCount: running };
  }

  return {
    dispatch,
    cancel,
    snapshot,
  };
}

/**
 * Translate the parser-detected kind into one of the backend's accepted
 * persistence kinds. Returns null for kinds we drop on the floor:
 *  - "unknown" — unrecognized line shape; not persisted to keep the
 *               persistence schema strict. Backend can reject these explicitly.
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
