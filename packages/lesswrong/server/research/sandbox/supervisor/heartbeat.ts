/**
 * Periodic heartbeat from the supervisor to the backend.
 *
 * sandboxManager uses these reports to decide spillover: when an inbound
 * dispatch would exceed a sandbox's per-sandbox concurrency cap (default 5),
 * the manager provisions an additional sandbox for the same `(user, project)`
 * rather than queueing.
 *
 * Heartbeat shape:
 *   POST /api/research/agent/sandboxes/:sandboxId/heartbeat
 *   Authorization: Bearer <signed callback token>
 *   {
 *     sandboxId,
 *     reportedAt,                  ISO-8601
 *     activeConversationCount,
 *     conversations: [{conversationId, status, startedAt?, endedAt?}, ...],
 *     memoryPressure,              0..1, normalized
 *     cpuPressure,                 0..1, normalized (1m loadavg / cpuCount)
 *   }
 *
 * Failures are logged and dropped — the next heartbeat will surface fresh state,
 * so persistent retry would only add latency without value.
 */
import { cpus, loadavg, totalmem, freemem } from "node:os";
import { ConversationState } from "./server";

export interface HeartbeatReport {
  sandboxId: string;
  reportedAt: string;
  activeConversationCount: number;
  conversations: ConversationState[];
  memoryPressure: number;
  cpuPressure: number;
}

export interface HeartbeatConfig {
  sandboxId: string;
  backendBaseUrl: string;
  authToken: string;
  intervalMs?: number;
  fetchImpl?: typeof fetch;
  /** Provides the current snapshot — typically `conversationHub.snapshot()`. */
  getSnapshot: () => {
    conversations: ConversationState[];
    concurrencyCount: number;
  };
  /** Override clock/instrumentation for tests. */
  now?: () => number;
  cpuCount?: () => number;
  loadAvg?: () => number[];
  memInfo?: () => { total: number; free: number };
}

export interface HeartbeatHandle {
  stop(): void;
  /** Force-fire one heartbeat now (returns once it's been sent or has failed). */
  reportOnce(): Promise<void>;
}

export const DEFAULT_HEARTBEAT_INTERVAL_MS = 10_000;

export function startHeartbeat(config: HeartbeatConfig): HeartbeatHandle {
  const fetchImpl = config.fetchImpl ?? fetch;
  const interval = config.intervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
  const now = config.now ?? (() => Date.now());
  const cpuCount = config.cpuCount ?? (() => cpus().length || 1);
  const loadAvg = config.loadAvg ?? loadavg;
  const memInfo = config.memInfo ?? (() => ({ total: totalmem(), free: freemem() }));

  let stopped = false;

  async function reportOnce() {
    const snapshot = config.getSnapshot();
    const mem = memInfo();
    const memoryPressure = mem.total > 0 ? Math.max(0, Math.min(1, 1 - mem.free / mem.total)) : 0;
    const oneMinLoad = loadAvg()[0] ?? 0;
    const cpuPressure = Math.max(0, Math.min(1, oneMinLoad / cpuCount()));

    const report: HeartbeatReport = {
      sandboxId: config.sandboxId,
      reportedAt: new Date(now()).toISOString(),
      activeConversationCount: snapshot.concurrencyCount,
      conversations: snapshot.conversations,
      memoryPressure,
      cpuPressure,
    };

    try {
      const url = `${config.backendBaseUrl}/api/research/agent/sandboxes/${encodeURIComponent(
        config.sandboxId,
      )}/heartbeat`;
      const res = await fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.authToken}`,
        },
        body: JSON.stringify(report),
      });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn(`[heartbeat] backend ${res.status}`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[heartbeat] post failed:`, err);
    }
  }

  const tick = () => {
    if (stopped) return;
    void reportOnce();
  };
  const handle = setInterval(tick, interval);
  // Immediate first report so the manager doesn't have to wait a full interval.
  void reportOnce();

  return {
    stop() {
      stopped = true;
      clearInterval(handle);
    },
    reportOnce,
  };
}
