import { createConversationHub } from "../server/research/sandbox/supervisor/conversationHub";
import {
  ClaudeProcessHandle,
  ClaudeProcessOptions,
  startClaudeProcess,
} from "../server/research/sandbox/supervisor/claudeRunner";
import { createJsonlChunker } from "../server/research/sandbox/supervisor/jsonlParser";
import { BackendEvent, PostPersister } from "../server/research/sandbox/supervisor/postPersister";

interface FakeProcess {
  opts: ClaudeProcessOptions;
  handle: ClaudeProcessHandle;
  sent: string[];
  interrupts: string[];
  kills: string[];
  permissionResponses: Array<{ requestId: string; decision: unknown }>;
  /** Feed one stdout line (an object; stringified through the real chunker). */
  emit(payload: Record<string, unknown>): void;
  /** Simulate process exit. */
  exit(code: number | null): void;
}

function mkFakeFactory(opts?: { sendFailsForProcs?: number[] }): {
  factory: typeof startClaudeProcess;
  procs: FakeProcess[];
} {
  const procs: FakeProcess[] = [];
  const factory: typeof startClaudeProcess = (procOpts) => {
    const procIndex = procs.length;
    const sendFails = opts?.sendFailsForProcs?.includes(procIndex) ?? false;
    let exited = false;
    let resolveDone: () => void;
    const done = new Promise<void>((resolve) => {
      resolveDone = resolve;
    });
    const chunker = createJsonlChunker();
    const fake: FakeProcess = {
      opts: procOpts,
      sent: [],
      interrupts: [],
      kills: [],
      permissionResponses: [],
      emit(payload) {
        for (const line of chunker.push(`${JSON.stringify(payload)}\n`)) {
          const req = line.parsed;
          if (
            req?.type === "control_request" &&
            (req.request as Record<string, unknown> | undefined)?.subtype === "can_use_tool"
          ) {
            const r = req.request as Record<string, unknown>;
            procOpts.onCanUseTool?.({
              requestId: req.request_id as string,
              toolName: r.tool_name as string,
              toolUseId: r.tool_use_id as string,
              input: r.input as Record<string, unknown>,
            });
          } else {
            procOpts.onLine(line);
          }
        }
      },
      exit(code) {
        if (exited) return;
        exited = true;
        procOpts.onExit({ code, signal: null });
        resolveDone!();
      },
      handle: {
        conversationId: procOpts.conversationId,
        claudeSessionId: procOpts.claudeSessionId,
        pid: 1234,
        alive: () => !exited,
        sendUserMessage(content: string) {
          if (exited || sendFails) return false;
          fake.sent.push(content);
          return true;
        },
        interrupt(requestId: string) {
          if (exited) return false;
          fake.interrupts.push(requestId);
          return true;
        },
        respondPermission(requestId: string, decision) {
          if (exited) return false;
          fake.permissionResponses.push({ requestId, decision });
          return true;
        },
        kill(signal = "SIGTERM") {
          fake.kills.push(signal);
          fake.exit(null);
        },
        done,
      },
    };
    procs.push(fake);
    return fake.handle;
  };
  return { factory, procs };
}

function mkPersister(): { persister: PostPersister; events: BackendEvent[] } {
  const events: BackendEvent[] = [];
  const persister: PostPersister = {
    enqueue(_conversationId, event) {
      events.push(event);
    },
    recover() {},
    async drain() {},
    pendingCount: () => 0,
  };
  return { persister, events };
}

const init = { type: "system", subtype: "init", session_id: "sess-1", uuid: "u-init" };
const assistantLine = {
  type: "assistant",
  message: { role: "assistant", content: [{ type: "text", text: "hi" }] },
  uuid: "u-a",
  session_id: "sess-1",
};
const resultLine = { type: "result", subtype: "success", uuid: "u-r", session_id: "sess-1" };
// The CLI's authoritative turn-over signal (CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS).
const stateIdle = { type: "system", subtype: "session_state_changed", state: "idle", uuid: "u-si", session_id: "sess-1" };

function mkHub(factoryOpts?: { sendFailsForProcs?: number[] }) {
  const { factory, procs } = mkFakeFactory(factoryOpts);
  const { persister, events } = mkPersister();
  const hub = createConversationHub({ postPersister: persister, startProcess: factory });
  return { hub, procs, events };
}

function status(hub: { snapshot(): { conversations: { status: string }[] } }): string {
  return hub.snapshot().conversations[0].status;
}

describe("conversationHub", () => {
  it("spawns one long-lived process and reuses it across turns", async () => {
    const { hub, procs } = mkHub();
    const r1 = await hub.dispatch({ conversationId: "c1", prompt: "first", claudeSessionId: "sess-1" });
    expect(r1.accepted).toBe(true);
    expect(procs.length).toBe(1);
    expect(procs[0].opts.sessionMode).toBe("new");
    expect(procs[0].sent).toEqual(["first"]);

    procs[0].emit(init);
    procs[0].emit(assistantLine);
    procs[0].emit(resultLine);
    procs[0].emit(stateIdle); // CLI's authoritative turn-over
    expect(status(hub)).toBe("completed");

    const r2 = await hub.dispatch({ conversationId: "c1", prompt: "second", claudeSessionId: "sess-1" });
    expect(r2.accepted).toBe(true);
    expect(procs.length).toBe(1); // same process, no respawn
    expect(procs[0].sent).toEqual(["first", "second"]);
  });

  it("resumes the session when the backend reports prior history", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({
      conversationId: "c1",
      prompt: "continue",
      claudeSessionId: "sess-1",
      sessionHasHistory: true,
    });
    // No filesystem probe: the backend's word decides --resume vs --session-id
    // (an existence check races snapshot restore on freshly-resumed sandboxes).
    expect(procs[0].opts.sessionMode).toBe("resume");
  });

  it("stays busy until the CLI reports idle, not at the first result", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "one", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit(assistantLine);
    expect(status(hub)).toBe("running");

    const r = await hub.dispatch({ conversationId: "c1", prompt: "two", claudeSessionId: "sess-1" });
    expect(r.accepted).toBe(true);
    expect(procs[0].sent.length).toBe(2);

    // A turn's result is NOT turn-over: more work (the queued turn) is coming,
    // and the CLI hasn't reported idle.
    procs[0].emit(resultLine);
    expect(status(hub)).toBe("running");
    expect(hub.hasPendingWork()).toBe(true);
    procs[0].emit(init);
    procs[0].emit(resultLine);
    expect(hub.hasPendingWork()).toBe(true); // still no idle event

    procs[0].emit(stateIdle);
    expect(status(hub)).toBe("completed");
    expect(hub.hasPendingWork()).toBe(false);
  });

  it("stays busy through a background-task re-invocation until idle (no wedge)", async () => {
    // Regression for the pendingTurns wedge: turn 1 launches a background task;
    // after turn 1's result the task settles and re-invokes the agent (an init
    // with no dispatch), then more turns run. Only the CLI's `idle` ends it —
    // and it must end cleanly, not stick busy forever.
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit(resultLine); // turn 1 result, but session not idle (task pending)
    expect(hub.hasPendingWork()).toBe(true);

    procs[0].emit(init); // background-task re-invocation, no dispatch
    procs[0].emit(assistantLine);
    procs[0].emit(resultLine);
    expect(hub.hasPendingWork()).toBe(true);

    procs[0].emit(stateIdle);
    expect(hub.hasPendingWork()).toBe(false);
    expect(status(hub)).toBe("completed");
  });

  it("ends busy when the CLI goes idle even if a turn fails before opening", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    expect(hub.hasPendingWork()).toBe(true);
    // Early CLI failure: an error result, then the CLI reports idle.
    procs[0].emit({ ...resultLine, subtype: "error_during_execution", is_error: true });
    procs[0].emit(stateIdle);
    expect(hub.hasPendingWork()).toBe(false);
    expect(status(hub)).toBe("completed");
  });

  it("reports pending work while a background task is outstanding", async () => {
    // A background agent/workflow can let the session report idle while it
    // keeps running, so `outstandingTaskIds` keeps the sandbox awake
    // independently of `sessionState`.
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "scrape", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit({ type: "system", subtype: "task_started", task_id: "t1", session_id: "sess-1", uuid: "u-t1" });
    procs[0].emit(resultLine);
    procs[0].emit(stateIdle); // session idle, but the task is still outstanding
    expect(status(hub)).toBe("completed");
    expect(hub.hasPendingWork()).toBe(true); // task keeps the sandbox awake

    // A notification with an explicitly in-progress status keeps it counted.
    procs[0].emit({ type: "system", subtype: "task_notification", task_id: "t1", status: "running", session_id: "sess-1", uuid: "u-t2" });
    expect(hub.hasPendingWork()).toBe(true);

    procs[0].emit({ type: "system", subtype: "task_notification", task_id: "t1", status: "completed", session_id: "sess-1", uuid: "u-t3" });
    expect(hub.hasPendingWork()).toBe(false);
  });

  it("clears a background task that finishes via task_updated with no task_notification", async () => {
    // A backgrounded Bash task signals completion through a terminal
    // `task_updated.patch.status` and emits no `task_notification` (verified
    // against Claude Code 2.1.170 and 2.1.181).
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "install deps", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit({ type: "system", subtype: "task_started", task_id: "t1", task_type: "local_bash", session_id: "sess-1", uuid: "u-t1" });
    procs[0].emit(resultLine);
    procs[0].emit(stateIdle);
    expect(hub.hasPendingWork()).toBe(true);

    // A non-terminal update (here, the task being backgrounded) keeps it counted.
    procs[0].emit({ type: "system", subtype: "task_updated", task_id: "t1", patch: { is_backgrounded: true }, session_id: "sess-1", uuid: "u-t2" });
    expect(hub.hasPendingWork()).toBe(true);

    // A terminal patch status settles it — without any task_notification.
    procs[0].emit({ type: "system", subtype: "task_updated", task_id: "t1", patch: { status: "completed", end_time: 1 }, session_id: "sess-1", uuid: "u-t3" });
    expect(hub.hasPendingWork()).toBe(false);
  });

  it("keeps a task counted while task_updated reports a non-terminal status", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "start proxy", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit({ type: "system", subtype: "task_started", task_id: "t1", task_type: "local_bash", session_id: "sess-1", uuid: "u-t1" });
    procs[0].emit(resultLine);
    procs[0].emit(stateIdle);

    // `running` / `paused` are non-terminal and must not clear the task.
    procs[0].emit({ type: "system", subtype: "task_updated", task_id: "t1", patch: { status: "running" }, session_id: "sess-1", uuid: "u-t2" });
    expect(hub.hasPendingWork()).toBe(true);
    procs[0].emit({ type: "system", subtype: "task_updated", task_id: "t1", patch: { status: "paused" }, session_id: "sess-1", uuid: "u-t3" });
    expect(hub.hasPendingWork()).toBe(true);

    // A failed task is terminal and clears it.
    procs[0].emit({ type: "system", subtype: "task_updated", task_id: "t1", patch: { status: "failed", error: "boom" }, session_id: "sess-1", uuid: "u-t4" });
    expect(hub.hasPendingWork()).toBe(false);
  });

  it("persists the user turn at dispatch, before any process output", async () => {
    const { hub, events } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "hello", claudeSessionId: "sess-1" });
    expect(events.length).toBe(1);
    expect(events[0].kind).toBe("user");
    expect(JSON.parse(events[0].rawJsonl).message.content).toBe("hello");
  });

  it("persists nothing and reports failure when the send cannot be completed", async () => {
    const { hub, procs, events } = mkHub({ sendFailsForProcs: [0, 1] });
    const r = await hub.dispatch({ conversationId: "c1", prompt: "hello", claudeSessionId: "sess-1" });
    expect(r.accepted).toBe(false);
    expect(r.reason).toBe("process_unavailable");
    expect(procs.length).toBe(2); // one respawn attempt
    expect(events.length).toBe(0); // no dangling user event for a failed dispatch
  });

  it("recovers a failed send by respawning once", async () => {
    const { hub, procs, events } = mkHub({ sendFailsForProcs: [0] });
    const r = await hub.dispatch({ conversationId: "c1", prompt: "hello", claudeSessionId: "sess-1" });
    expect(r.accepted).toBe(true);
    expect(procs.length).toBe(2);
    expect(procs[1].sent).toEqual(["hello"]);
    expect(events.length).toBe(1);
  });

  it("closes a crashed mid-turn process with a synthetic interrupted result and respawns on the next dispatch", async () => {
    const { hub, procs, events } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit(assistantLine);
    procs[0].exit(137);

    expect(status(hub)).toBe("errored");
    const last = events[events.length - 1];
    expect(last.kind).toBe("result");
    expect(JSON.parse(last.rawJsonl).subtype).toBe("interrupted");

    await hub.dispatch({ conversationId: "c1", prompt: "again", claudeSessionId: "sess-1" });
    expect(procs.length).toBe(2);
    expect(procs[1].opts.claudeSessionId).toBe("sess-1");
    expect(procs[1].sent).toEqual(["again"]);
  });

  it("cancels via interrupt and reads the turn-end as cancelled", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit(assistantLine);

    await hub.cancel("c1");
    expect(procs[0].interrupts.length).toBe(1);
    expect(procs[0].kills.length).toBe(0); // no escalation needed

    procs[0].emit({ ...resultLine, subtype: "error_during_execution", is_error: true });
    procs[0].emit(stateIdle);
    expect(status(hub)).toBe("cancelled");
    expect(hub.hasPendingWork()).toBe(false);

    // Process survived the cancel and accepts the next turn.
    await hub.dispatch({ conversationId: "c1", prompt: "next", claudeSessionId: "sess-1" });
    expect(procs.length).toBe(1);
    expect(procs[0].sent).toEqual(["go", "next"]);
  });

  it("stays busy after a cancel issued before the turn produced output", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    // No idle event yet: the dispatch's optimistic `running` keeps it busy, so
    // the cancel proceeds (isBusy gate) and the escalation timer can fire.
    await hub.cancel("c1");
    expect(procs[0].interrupts.length).toBe(1);
    expect(status(hub)).toBe("running");
    expect(hub.hasPendingWork()).toBe(true);
  });

  it("flushes queued turns when a cancel's result arrives, even if a dispatch raced it", async () => {
    const { hub, procs, events } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit(assistantLine);

    await hub.cancel("c1");
    // A new message races the interrupt; it must not relabel the cancelled
    // turn as completed, and its queued (possibly CLI-dropped) message gets
    // flushed so the transcript can't dangle.
    await hub.dispatch({ conversationId: "c1", prompt: "raced", claudeSessionId: "sess-1" });

    procs[0].emit({ ...resultLine, subtype: "error_during_execution", is_error: true });
    // The flush (a synthetic interrupted result for the raced turn) fires on
    // the cancelled turn's result, before the session reports idle.
    const last = events[events.length - 1];
    expect(last.kind).toBe("result");
    expect(JSON.parse(last.rawJsonl).subtype).toBe("interrupted");
    procs[0].emit(stateIdle);
    expect(status(hub)).toBe("cancelled");
    expect(hub.hasPendingWork()).toBe(false);
  });

  it("ignores cancel when idle", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit(resultLine);
    procs[0].emit(stateIdle);
    await hub.cancel("c1");
    expect(procs[0].interrupts.length).toBe(0);
    expect(procs[0].kills.length).toBe(0);
  });

  const askControlRequest = {
    type: "control_request",
    request_id: "perm-1",
    request: {
      subtype: "can_use_tool",
      tool_name: "AskUserQuestion",
      tool_use_id: "toolu_q1",
      input: { questions: [{ question: "Red or blue?", header: "Color", multiSelect: false, options: [{ label: "Red" }, { label: "Blue" }] }] },
    },
  };

  it("parks an AskUserQuestion permission request and resolves it on answer", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "ask me", claudeSessionId: "sess-1" });
    procs[0].emit(askControlRequest);
    expect(procs[0].permissionResponses.length).toBe(0);

    const result = hub.answerQuestion("c1", "toolu_q1", { "Red or blue?": "Red" });
    expect(result.ok).toBe(true);
    expect(procs[0].permissionResponses.length).toBe(1);
    const resp = procs[0].permissionResponses[0];
    expect(resp.requestId).toBe("perm-1");
    expect(resp.decision).toMatchObject({
      behavior: "allow",
      toolUseId: "toolu_q1",
      updatedInput: { answers: { "Red or blue?": "Red" } },
    });
    expect((resp.decision as { updatedInput: { questions: unknown[] } }).updatedInput.questions).toBeDefined();

    expect(hub.answerQuestion("c1", "toolu_q1", { "Red or blue?": "Blue" }).ok).toBe(false);
  });

  it("auto-allows a non-AskUserQuestion permission request", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    procs[0].emit({
      type: "control_request",
      request_id: "perm-2",
      request: { subtype: "can_use_tool", tool_name: "Bash", tool_use_id: "toolu_b1", input: { command: "ls" } },
    });
    expect(procs[0].permissionResponses.length).toBe(1);
    expect(procs[0].permissionResponses[0].decision).toMatchObject({ behavior: "allow", toolUseId: "toolu_b1" });
  });

  it("reports no pending question when answering an unknown tool_use", async () => {
    const { hub } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    const result = hub.answerQuestion("c1", "toolu_missing", { q: "a" });
    expect(result).toEqual({ ok: false, reason: "no_pending_question" });
  });
});
