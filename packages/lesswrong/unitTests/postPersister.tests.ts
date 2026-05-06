import {
  createPostPersister,
  BackendEvent,
} from "../server/research/sandbox/supervisor/postPersister";

interface RecordedCall {
  url: string;
  body: BackendEvent;
  attempt: number;
}

function mkEvent(idx: number, kind: BackendEvent["kind"] = "assistant"): BackendEvent {
  return {
    rawJsonl: `{"type":"${kind}","i":${idx}}`,
    kind,
    claudeMessageUuid: `msg_${idx}`,
  };
}

function mkFetch(opts: {
  failTimes?: number;
  failStatus?: number;
}): { fetchImpl: typeof fetch; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  let attemptCount = 0;
  const fetchImpl: typeof fetch = async (input, init) => {
    attemptCount += 1;
    const body = JSON.parse((init?.body as string) ?? "{}");
    calls.push({
      url: typeof input === "string" ? input : input.toString(),
      body,
      attempt: attemptCount,
    });
    if (opts.failTimes && attemptCount <= opts.failTimes) {
      return new Response("nope", { status: opts.failStatus ?? 503 });
    }
    return new Response(JSON.stringify({ ok: true, seq: attemptCount, deduplicated: false }), {
      status: 200,
    });
  };
  return { fetchImpl, calls };
}

describe("postPersister", () => {
  it("sends one POST per event", async () => {
    const { fetchImpl, calls } = mkFetch({});
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      fetchImpl,
    });
    p.enqueue("conv1", mkEvent(0));
    p.enqueue("conv1", mkEvent(1));
    p.enqueue("conv1", mkEvent(2));
    await p.drain();
    (calls.length as any).should.be.equal(3);
    (calls[0].url as any).should.be.equal(
      "https://example.test/api/research/agent/conversations/conv1/events",
    );
    (calls[0].body.rawJsonl as any).should.be.equal('{"type":"assistant","i":0}');
    (calls[0].body.kind as any).should.be.equal("assistant");
  });

  it("retries on 5xx and eventually succeeds", async () => {
    const { fetchImpl, calls } = mkFetch({ failTimes: 2, failStatus: 503 });
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      fetchImpl,
      initialBackoffMs: 1,
    });
    p.enqueue("conv1", mkEvent(0));
    await p.drain();
    (calls.length as any).should.be.equal(3);
  });

  it("does not retry on 4xx (other than 429)", async () => {
    const { fetchImpl, calls } = mkFetch({ failTimes: 100, failStatus: 400 });
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      fetchImpl,
      initialBackoffMs: 1,
    });
    p.enqueue("conv1", mkEvent(0));
    await p.drain();
    (calls.length as any).should.be.equal(1);
  });

  it("retries on 429 (rate limited)", async () => {
    const { fetchImpl, calls } = mkFetch({ failTimes: 1, failStatus: 429 });
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      fetchImpl,
      initialBackoffMs: 1,
    });
    p.enqueue("conv1", mkEvent(0));
    await p.drain();
    (calls.length as any).should.be.equal(2);
  });

  it("preserves per-conversation FIFO ordering", async () => {
    const { fetchImpl, calls } = mkFetch({});
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      fetchImpl,
    });
    for (let i = 0; i < 5; i++) p.enqueue("conv1", mkEvent(i));
    await p.drain();
    const order = calls.map((c) => c.body.claudeMessageUuid);
    (JSON.stringify(order) as any).should.be.equal(
      JSON.stringify(["msg_0", "msg_1", "msg_2", "msg_3", "msg_4"]),
    );
  });

  it("isolates failures per conversation", async () => {
    const calls: RecordedCall[] = [];
    let i = 0;
    const fetchImpl: typeof fetch = async (input, init) => {
      i += 1;
      const url = typeof input === "string" ? input : input.toString();
      const body = JSON.parse((init?.body as string) ?? "{}");
      calls.push({ url, body, attempt: i });
      if (url.includes("conv1") && i <= 2) {
        return new Response("nope", { status: 502 });
      }
      return new Response(JSON.stringify({ ok: true, seq: i, deduplicated: false }), {
        status: 200,
      });
    };
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      fetchImpl,
      initialBackoffMs: 1,
    });
    p.enqueue("conv1", mkEvent(0));
    p.enqueue("conv2", mkEvent(0));
    await p.drain();
    const conv1 = calls.filter((c) => c.url.includes("conv1"));
    const conv2 = calls.filter((c) => c.url.includes("conv2"));
    (conv1.length as any).should.be.greaterThan(1);
    (conv2.length as any).should.be.equal(1);
  });
});
