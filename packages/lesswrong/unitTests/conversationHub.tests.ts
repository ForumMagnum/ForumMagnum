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
      emit(payload) {
        for (const line of chunker.push(`${JSON.stringify(payload)}\n`)) {
          procOpts.onLine(line);
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

  it("accepts a dispatch mid-turn and stays running until the queued turn ends", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "one", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit(assistantLine);
    expect(status(hub)).toBe("running");

    const r = await hub.dispatch({ conversationId: "c1", prompt: "two", claudeSessionId: "sess-1" });
    expect(r.accepted).toBe(true);
    expect(procs[0].sent.length).toBe(2);

    procs[0].emit(resultLine); // ends turn one; turn two still pending
    expect(status(hub)).toBe("running");
    procs[0].emit(init);
    procs[0].emit(resultLine); // ends turn two
    expect(status(hub)).toBe("completed");
  });

  it("goes busy again on a background-task re-invocation with no dispatch", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit(resultLine);
    expect(status(hub)).toBe("completed");

    // Task finishes later; the process re-invokes the agent: init arrives
    // with no dispatch having happened.
    procs[0].emit(init);
    procs[0].emit(assistantLine);
    expect(status(hub)).toBe("running");
    procs[0].emit(resultLine);
    expect(status(hub)).toBe("completed");
  });

  it("does not let a re-invocation's result consume a queued turn's pending count", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit(resultLine);

    // Re-invocation running; user dispatches B mid-re-invocation.
    procs[0].emit(init);
    procs[0].emit(assistantLine);
    await hub.dispatch({ conversationId: "c1", prompt: "queued", claudeSessionId: "sess-1" });

    // The re-invocation's result must not make the conversation read idle
    // while B is still queued on stdin.
    procs[0].emit(resultLine);
    expect(status(hub)).toBe("running");
    expect(hub.hasPendingWork()).toBe(true);

    procs[0].emit(init); // B starts
    procs[0].emit(resultLine);
    expect(status(hub)).toBe("completed");
  });

  it("releases the pending count when a dispatched turn fails before opening", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    expect(hub.hasPendingWork()).toBe(true);
    // Early CLI failure: the turn's result arrives without any system:init.
    // The pending count must not outlive it (the conversation would read
    // busy forever while the client transcript reads idle).
    procs[0].emit({ ...resultLine, subtype: "error_during_execution", is_error: true });
    expect(hub.hasPendingWork()).toBe(false);
    expect(status(hub)).toBe("completed");
  });

  it("reports pending work while a background task is outstanding", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "scrape", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit({ type: "system", subtype: "task_started", task_id: "t1", session_id: "sess-1", uuid: "u-t1" });
    procs[0].emit(resultLine);
    expect(status(hub)).toBe("completed");
    expect(hub.hasPendingWork()).toBe(true); // task keeps the sandbox awake

    // A notification with an explicitly in-progress status keeps it counted.
    procs[0].emit({ type: "system", subtype: "task_notification", task_id: "t1", status: "running", session_id: "sess-1", uuid: "u-t2" });
    expect(hub.hasPendingWork()).toBe(true);

    procs[0].emit({ type: "system", subtype: "task_notification", task_id: "t1", status: "completed", session_id: "sess-1", uuid: "u-t3" });
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
    // No output yet: busy comes solely from the pending dispatched turn.
    await hub.cancel("c1");
    expect(procs[0].interrupts.length).toBe(1);
    // The cancel must not zero the pending count — otherwise the escalation
    // path would read the conversation as already-interrupted and never fire.
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
    expect(status(hub)).toBe("cancelled");
    const last = events[events.length - 1];
    expect(last.kind).toBe("result");
    expect(JSON.parse(last.rawJsonl).subtype).toBe("interrupted");
    expect(hub.hasPendingWork()).toBe(false);
  });

  it("ignores cancel when idle", async () => {
    const { hub, procs } = mkHub();
    await hub.dispatch({ conversationId: "c1", prompt: "go", claudeSessionId: "sess-1" });
    procs[0].emit(init);
    procs[0].emit(resultLine);
    await hub.cancel("c1");
    expect(procs[0].interrupts.length).toBe(0);
    expect(procs[0].kills.length).toBe(0);
  });
});
