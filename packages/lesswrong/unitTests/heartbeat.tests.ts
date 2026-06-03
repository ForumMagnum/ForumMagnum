import { startHeartbeat, HeartbeatReport } from "../server/research/sandbox/supervisor/heartbeat";

interface RecordedCall {
  url: string;
  body: HeartbeatReport;
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
      getTurnRunning: () => true,
    });
    await new Promise((r) => setImmediate(r));
    handle.stop();
    (calls.length as any).should.be.equal(1);
    (calls[0].body.turnRunning as any).should.be.equal(true);
    (calls[0].url as any).should.be.equal(
      "https://backend.test/api/research/agent/sandboxes/sbx_a/heartbeat",
    );
  });

  it("includes lastDevActivityAt when the dev server has seen traffic", async () => {
    const { fetchImpl, calls } = mkFetch();
    const handle = startHeartbeat({
      sandboxId: "sbx_b",
      backendBaseUrl: "https://backend.test",
      authToken: "tk",
      fetchImpl,
      intervalMs: 60_000,
      getTurnRunning: () => false,
      getLastDevActivityAt: () => 1_700_000_000_000,
    });
    await new Promise((r) => setImmediate(r));
    handle.stop();
    (calls[0].body.lastDevActivityAt as any).should.be.equal(1_700_000_000_000);
  });

  it("reportOnce can be called explicitly", async () => {
    const { fetchImpl, calls } = mkFetch();
    const handle = startHeartbeat({
      sandboxId: "sbx_c",
      backendBaseUrl: "https://backend.test",
      authToken: "tk",
      fetchImpl,
      intervalMs: 60_000,
      getTurnRunning: () => false,
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
      getTurnRunning: () => false,
    });
    await new Promise((r) => setImmediate(r));
    handle.stop();
    const after = calls.length;
    await new Promise((r) => setTimeout(r, 20));
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
      getTurnRunning: () => false,
    });
    await handle.reportOnce();
    handle.stop();
    (true as any).should.be.equal(true);
  });
});
