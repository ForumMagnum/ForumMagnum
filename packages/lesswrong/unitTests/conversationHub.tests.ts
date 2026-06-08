import {
  createConversationHub,
} from "../server/research/sandbox/supervisor/conversationHub";
import type {
  ConversationHubConfig,
} from "../server/research/sandbox/supervisor/conversationHub";
import type {
  ClaudeRunnerHandle,
  ClaudeRunnerOptions,
} from "../server/research/sandbox/supervisor/claudeRunner";
import type {
  ClaudeEventKind,
  ParsedJsonlLine,
} from "../server/research/sandbox/supervisor/jsonlParser";
import type {
  BackendEvent,
  PostPersister,
} from "../server/research/sandbox/supervisor/postPersister";

interface RecordedBackendEvent {
  conversationId: string;
  event: BackendEvent;
}

interface ControllableRunner {
  prompt: string;
  signals: NodeJS.Signals[];
  emit: (line: ParsedJsonlLine) => void;
  exit: (code?: number) => void;
}

function createRecordingPersister(events: RecordedBackendEvent[]): PostPersister {
  return {
    enqueue(conversationId, event) {
      events.push({ conversationId, event });
    },
    recover() {
      // no-op
    },
    drain() {
      return Promise.resolve();
    },
    pendingCount() {
      return 0;
    },
  };
}

function createControllableRunnerFactory(): {
  runners: ControllableRunner[];
  startRunner: NonNullable<ConversationHubConfig["startRunner"]>;
} {
  const runners: ControllableRunner[] = [];
  const startRunner = (opts: ClaudeRunnerOptions): ClaudeRunnerHandle => {
    let resolveDone: () => void = () => {
      // no-op until the promise initializer assigns this
    };
    const done = new Promise<void>((resolve) => {
      resolveDone = resolve;
    });
    const signals: NodeJS.Signals[] = [];
    const runner: ControllableRunner = {
      prompt: opts.prompt,
      signals,
      emit: opts.onLine,
      exit(code = 0) {
        opts.onExit({ code, signal: null });
        resolveDone();
      },
    };
    runners.push(runner);
    return {
      conversationId: opts.conversationId,
      pid: 1000 + runners.length,
      cancel(signal: NodeJS.Signals = "SIGTERM") {
        signals.push(signal);
      },
      done,
    };
  };
  return { runners, startRunner };
}

function jsonlLine(kind: ClaudeEventKind, label: string, sessionId = "sess-1"): ParsedJsonlLine {
  const uuid = `${label}-${kind}`;
  const parsed: Record<string, unknown> = {
    type: kind,
    session_id: sessionId,
  };
  if (kind !== "result") {
    parsed.uuid = uuid;
  }
  if (kind === "assistant") {
    parsed.message = {
      role: "assistant",
      content: [{ type: "text", text: label }],
    };
  }
  return {
    raw: JSON.stringify(parsed),
    parsed,
    kind,
    claudeMessageUuid: kind === "result" ? null : uuid,
    sessionId,
  };
}

describe("conversationHub", () => {
  it("drops late events from a completed runner superseded by a newer turn", async () => {
    const events: RecordedBackendEvent[] = [];
    const { runners, startRunner } = createControllableRunnerFactory();
    const hub = createConversationHub({
      postPersister: createRecordingPersister(events),
      startRunner,
      now: () => Date.parse("2026-06-08T23:00:00.000Z"),
    });

    await hub.dispatch({ conversationId: "conv-1", prompt: "turn one" });
    runners[0].emit(jsonlLine("result", "turn-one-result"));
    expect(hub.snapshot().conversations[0].status).toBe("completed");

    await hub.dispatch({ conversationId: "conv-1", prompt: "turn two" });
    expect(runners[0].signals).toEqual(["SIGTERM"]);
    expect(runners[1].prompt).toBe("turn two");

    runners[0].emit(jsonlLine("assistant", "stale assistant output"));
    runners[0].emit(jsonlLine("result", "stale result"));
    expect(events.map(({ event }) => event.rawJsonl)).not.toContain(
      jsonlLine("assistant", "stale assistant output").raw,
    );
    expect(hub.snapshot().conversations[0].status).toBe("running");

    runners[1].emit(jsonlLine("assistant", "fresh assistant output"));
    runners[1].emit(jsonlLine("result", "fresh result"));

    expect(events.map(({ event }) => event.rawJsonl)).toContain(
      jsonlLine("assistant", "fresh assistant output").raw,
    );
    expect(hub.snapshot().conversations[0].status).toBe("completed");
  });
});
