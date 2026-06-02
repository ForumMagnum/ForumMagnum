import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  createPostPersister,
  BackendEvent,
} from "../server/research/sandbox/supervisor/postPersister";
import { createDurableEventQueue } from "../server/research/sandbox/supervisor/durableEventQueue";

interface RecordedCall {
  url: string;
  body: BackendEvent;
  attempt: number;
}

const createdDirs: string[] = [];
function tmpQueueDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "postpersister-"));
  createdDirs.push(dir);
  return dir;
}

// Backoff is irrelevant to correctness here and would only slow the suite; make
// it instant so retry-heavy tests run fast.
const instantSleep = () => Promise.resolve();

afterAll(() => {
  for (const dir of createdDirs) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});

function mkEvent(idx: number, kind: BackendEvent["kind"] = "assistant"): BackendEvent {
  return {
    rawJsonl: `{"type":"${kind}","i":${idx}}`,
    kind,
    claudeMessageUuid: kind === "assistant" ? `msg_${idx}` : null,
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
      conversationId: "conv1",
      queueDir: tmpQueueDir(),
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
      conversationId: "conv1",
      queueDir: tmpQueueDir(),
      fetchImpl,
      sleepImpl: instantSleep,
    });
    p.enqueue("conv1", mkEvent(0));
    await p.drain();
    (calls.length as any).should.be.equal(3);
  });

  it("retries transient failures indefinitely (no fixed attempt cap)", async () => {
    // The old persister capped at 6 attempts and dropped; the durable one keeps
    // going. 10 failures then success ⇒ 11 calls, which the old cap forbade.
    const { fetchImpl, calls } = mkFetch({ failTimes: 10, failStatus: 503 });
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      conversationId: "conv1",
      queueDir: tmpQueueDir(),
      fetchImpl,
      sleepImpl: instantSleep,
    });
    p.enqueue("conv1", mkEvent(0));
    await p.drain();
    (calls.length as any).should.be.equal(11);
  });

  it("retries a suspect 200 (unrecognized body) instead of dropping it", async () => {
    // A 200 whose body isn't {ok:true} — e.g. a tunnel interstitial. The old
    // persister treated this as permanent; we now retry until the real backend
    // answers.
    const calls: RecordedCall[] = [];
    let n = 0;
    const fetchImpl: typeof fetch = async (input, init) => {
      n += 1;
      calls.push({
        url: typeof input === "string" ? input : input.toString(),
        body: JSON.parse((init?.body as string) ?? "{}"),
        attempt: n,
      });
      if (n === 1) return new Response("<html>tunnel offline</html>", { status: 200 });
      return new Response(JSON.stringify({ ok: true, seq: n, deduplicated: false }), { status: 200 });
    };
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      conversationId: "conv1",
      queueDir: tmpQueueDir(),
      fetchImpl,
      sleepImpl: instantSleep,
    });
    p.enqueue("conv1", mkEvent(0));
    await p.drain();
    (calls.length as any).should.be.equal(2);
  });

  it("does not retry on 4xx (other than 429)", async () => {
    const { fetchImpl, calls } = mkFetch({ failTimes: 100, failStatus: 400 });
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      conversationId: "conv1",
      queueDir: tmpQueueDir(),
      fetchImpl,
      sleepImpl: instantSleep,
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
      conversationId: "conv1",
      queueDir: tmpQueueDir(),
      fetchImpl,
      sleepImpl: instantSleep,
    });
    p.enqueue("conv1", mkEvent(0));
    await p.drain();
    (calls.length as any).should.be.equal(2);
  });

  it("synthesizes a stable sup:<localId> uuid for events without a Claude uuid", async () => {
    const { fetchImpl, calls } = mkFetch({});
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      conversationId: "conv1",
      queueDir: tmpQueueDir(),
      fetchImpl,
    });
    // `result` events carry no Claude message uuid.
    p.enqueue("conv1", mkEvent(0, "result"));
    p.enqueue("conv1", mkEvent(1, "assistant"));
    await p.drain();
    // First event in the conversation gets localId 1 ⇒ sup:1; the assistant
    // event keeps its real uuid.
    (calls[0].body.claudeMessageUuid as any).should.be.equal("sup:1");
    (calls[1].body.claudeMessageUuid as any).should.be.equal("msg_1");
  });

  it("advances the cursor and compacts the log on ack", async () => {
    const dir = tmpQueueDir();
    const { fetchImpl } = mkFetch({});
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      conversationId: "conv1",
      queueDir: dir,
      fetchImpl,
    });
    p.enqueue("conv1", mkEvent(0));
    await p.drain();
    // After ack the cursor advances and the log is compacted to drop the
    // now-acked entry — leaving an empty log + the high-water cursor.
    const cursor = fs.readFileSync(path.join(dir, "conv1.cursor"), "utf8").trim();
    (cursor as any).should.be.equal("1");
    const log = fs.readFileSync(path.join(dir, "conv1.ndjson"), "utf8").trim();
    (log as any).should.be.equal("");
  });

  it("recovers and ships events left un-acked by a prior session", async () => {
    const dir = tmpQueueDir();
    // Simulate a prior session that durably queued two events but never acked
    // them (backend was unreachable).
    const seed = createDurableEventQueue({ dir });
    seed.append("conv1", mkEvent(0));
    seed.append("conv1", mkEvent(1));

    const { fetchImpl, calls } = mkFetch({});
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      conversationId: "conv1",
      queueDir: dir,
      fetchImpl,
    });
    p.recover();
    await p.drain();
    const order = calls.map((c) => c.body.rawJsonl);
    (JSON.stringify(order) as any).should.be.equal(
      JSON.stringify(['{"type":"assistant","i":0}', '{"type":"assistant","i":1}']),
    );
    const cursor = fs.readFileSync(path.join(dir, "conv1.cursor"), "utf8").trim();
    (cursor as any).should.be.equal("2");
  });

  it("preserves per-conversation FIFO ordering", async () => {
    const { fetchImpl, calls } = mkFetch({});
    const p = createPostPersister({
      backendBaseUrl: "https://example.test",
      authToken: "tk",
      conversationId: "conv1",
      queueDir: tmpQueueDir(),
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
      conversationId: "conv1",
      queueDir: tmpQueueDir(),
      fetchImpl,
      sleepImpl: instantSleep,
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
