import { startHeartbeat, HeartbeatReport } from "../server/research/sandbox/supervisor/heartbeat";

interface RecordedCall {
  url: string;
  body: HeartbeatReport;
}

function mkSnapshot(running: number) {
  const conversations = [];
  for (let i = 0; i < running; i++) {
    conversations.push({
      conversationId: `cnv_${i}`,
      status: "running" as const,
      startedAt: 1700000000000,
    });
  }
  return { conversations, concurrencyCount: running };
}

function mkFetch(): { fetchImpl: typeof fetch; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push({ url, body: JSON.parse((init?.body as string) ?? "{}") });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  return { fetchImpl, calls };
}

describe("heartbeat", () => {
  it("reports immediately on start", async () => {
    const { fetchImpl, calls } = mkFetch();
    const handle = startHeartbeat({
      sandboxId: "sbx_a",
      backendBaseUrl: "https://backend.test",
      authToken: "tk",
      fetchImpl,
      intervalMs: 60_000,
      getSnapshot: () => mkSnapshot(2),
      cpuCount: () => 4,
      loadAvg: () => [2, 1, 0.5],
      memInfo: () => ({ total: 4_000_000_000, free: 1_000_000_000 }),
    });
    // immediate report is fire-and-forget; flush microtasks
    await new Promise((r) => setImmediate(r));
    handle.stop();
    (calls.length as any).should.be.equal(1);
    (calls[0].body.activeConversationCount as any).should.be.equal(2);
    (calls[0].body.cpuPressure as any).should.be.equal(0.5);
    (calls[0].body.memoryPressure as any).should.be.equal(0.75);
    (calls[0].url as any).should.be.equal(
      "https://backend.test/api/research/agent/sandboxes/sbx_a/heartbeat",
    );
  });

  it("clamps memoryPressure and cpuPressure to [0,1]", async () => {
    const { fetchImpl, calls } = mkFetch();
    const handle = startHeartbeat({
      sandboxId: "sbx_b",
      backendBaseUrl: "https://backend.test",
      authToken: "tk",
      fetchImpl,
      intervalMs: 60_000,
      getSnapshot: () => mkSnapshot(0),
      cpuCount: () => 1,
      loadAvg: () => [9.0, 5, 1],
      memInfo: () => ({ total: 1, free: 0 }),
    });
    await new Promise((r) => setImmediate(r));
    handle.stop();
    (calls[0].body.cpuPressure as any).should.be.equal(1);
    (calls[0].body.memoryPressure as any).should.be.equal(1);
  });

  it("reportOnce can be called explicitly", async () => {
    const { fetchImpl, calls } = mkFetch();
    const handle = startHeartbeat({
      sandboxId: "sbx_c",
      backendBaseUrl: "https://backend.test",
      authToken: "tk",
      fetchImpl,
      intervalMs: 60_000,
      getSnapshot: () => mkSnapshot(1),
      cpuCount: () => 1,
      loadAvg: () => [0, 0, 0],
      memInfo: () => ({ total: 100, free: 50 }),
    });
    await handle.reportOnce();
    handle.stop();
    (calls.length as any).should.be.greaterThan(0);
  });

  it("stop prevents further intervals", async () => {
    const { fetchImpl, calls } = mkFetch();
    const handle = startHeartbeat({
      sandboxId: "sbx_d",
      backendBaseUrl: "https://backend.test",
      authToken: "tk",
      fetchImpl,
      intervalMs: 1,
      getSnapshot: () => mkSnapshot(0),
      cpuCount: () => 1,
      loadAvg: () => [0, 0, 0],
      memInfo: () => ({ total: 100, free: 100 }),
    });
    await new Promise((r) => setImmediate(r));
    handle.stop();
    const after = calls.length;
    await new Promise((r) => setTimeout(r, 20));
    // No additional calls should have arrived after stop()
    (calls.length as any).should.be.equal(after);
  });

  it("swallows fetch errors without throwing", async () => {
    const failingFetch: typeof fetch = async () => {
      throw new TypeError("network");
    };
    const handle = startHeartbeat({
      sandboxId: "sbx_e",
      backendBaseUrl: "https://backend.test",
      authToken: "tk",
      fetchImpl: failingFetch,
      intervalMs: 60_000,
      getSnapshot: () => mkSnapshot(0),
      cpuCount: () => 1,
      loadAvg: () => [0, 0, 0],
      memInfo: () => ({ total: 100, free: 100 }),
    });
    await handle.reportOnce(); // must not throw
    handle.stop();
    // If we reach this line the test passes
    (true as any).should.be.equal(true);
  });
});
