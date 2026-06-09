import { createConversationHub } from "../server/research/sandbox/supervisor/conversationHub";
import {
  ClaudeRunnerHandle,
  ClaudeRunnerOptions,
} from "../server/research/sandbox/supervisor/claudeRunner";
import { ParsedJsonlLine } from "../server/research/sandbox/supervisor/jsonlParser";
import {
  BackendEvent,
  PostPersister,
} from "../server/research/sandbox/supervisor/postPersister";

interface QueuedEvent {
  conversationId: string;
  event: BackendEvent;
}

interface StartedRunner {
  options: ClaudeRunnerOptions;
  handle: ClaudeRunnerHandle;
  cancelledSignals: NodeJS.Signals[];
}

function createHarness() {
  let clock = 1_000;
  const queuedEvents: QueuedEvent[] = [];
  const startedRunners: StartedRunner[] = [];
  const postPersister: PostPersister = {
    enqueue(conversationId: string, event: BackendEvent) {
      queuedEvents.push({ conversationId, event });
    },
    recover() {},
    drain() {
      return Promise.resolve();
    },
    pendingCount() {
      return queuedEvents.length;
    },
  };
  const startRunner = (options: ClaudeRunnerOptions): ClaudeRunnerHandle => {
    const cancelledSignals: NodeJS.Signals[] = [];
    const handle: ClaudeRunnerHandle = {
      conversationId: options.conversationId,
      pid: startedRunners.length + 1,
      cancel(signal: NodeJS.Signals = "SIGTERM") {
        cancelledSignals.push(signal);
      },
      done: Promise.resolve(),
    };
    startedRunners.push({ options, handle, cancelledSignals });
    return handle;
  };
  const hub = createConversationHub({
    postPersister,
    now: () => clock,
    startRunner,
  });

  return {
    hub,
    queuedEvents,
    startedRunners,
    advanceClock(ms: number) {
      clock += ms;
    },
  };
}

function line(kind: ParsedJsonlLine["kind"]): ParsedJsonlLine {
  return {
    raw: JSON.stringify({ type: kind }),
    parsed: { type: kind },
    kind,
    claudeMessageUuid: null,
    sessionId: null,
  };
}

describe("conversationHub", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects a second dispatch while the same conversation has a live running turn", async () => {
    const { hub, startedRunners } = createHarness();

    await expect(hub.dispatch({ conversationId: "conv1", prompt: "first" })).resolves.toEqual({
      accepted: true,
    });
    await expect(hub.dispatch({ conversationId: "conv1", prompt: "second" })).resolves.toEqual({
      accepted: false,
      reason: "already running",
    });
    expect(startedRunners).toHaveLength(1);
    expect(hub.snapshot().concurrencyCount).toBe(1);
  });

  it("accepts the next dispatch after a result even if the prior runner has not exited", async () => {
    const { hub, startedRunners, advanceClock } = createHarness();

    await expect(hub.dispatch({ conversationId: "conv1", prompt: "first" })).resolves.toEqual({
      accepted: true,
    });
    advanceClock(100);
    startedRunners[0].options.onLine(line("result"));

    await expect(hub.dispatch({ conversationId: "conv1", prompt: "second" })).resolves.toEqual({
      accepted: true,
    });
    expect(startedRunners).toHaveLength(2);
    expect(hub.snapshot().concurrencyCount).toBe(1);
  });

  it("accepts the next dispatch after a terminal error line even if the prior runner has not exited", async () => {
    const { hub, startedRunners, advanceClock } = createHarness();

    await expect(hub.dispatch({ conversationId: "conv1", prompt: "first" })).resolves.toEqual({
      accepted: true,
    });
    advanceClock(100);
    startedRunners[0].options.onLine(line("error"));

    await expect(hub.dispatch({ conversationId: "conv1", prompt: "second" })).resolves.toEqual({
      accepted: true,
    });
    expect(startedRunners).toHaveLength(2);
    expect(hub.snapshot().concurrencyCount).toBe(1);
  });
});
