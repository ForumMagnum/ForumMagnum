/**
 * Periodic heartbeat from the supervisor to the backend.
 *
 * POST /api/research/agent/sandboxes/:sandboxId/heartbeat
 * Authorization: Bearer <signed callback token>
 *
 * Carries whether a turn is running and recent dev-server activity so the
 * backend can re-arm the idle timeout or roll the session. Failures are
 * logged and dropped (the next tick re-reports).
 */
import { looksLikeOkResponseBody } from "./backendResponseCheck";

export interface HeartbeatReport {
  sandboxId: string;
  reportedAt: string;
  turnRunning: boolean;
  /**
   * Epoch-ms of the most recent auth-proxy request, if a dev server is running.
   * Omitted when there is no dev server or it has seen no traffic.
   */
  lastDevActivityAt?: number;
}

export interface HeartbeatConfig {
  sandboxId: string;
  backendBaseUrl: string;
  authToken: string;
  intervalMs?: number;
  fetchImpl?: typeof fetch;
  getTurnRunning: () => boolean;
  getLastDevActivityAt?: () => number;
  now?: () => number;
}

export interface HeartbeatHandle {
  stop(): void;
  reportOnce(): Promise<void>;
}

export const DEFAULT_HEARTBEAT_INTERVAL_MS = 10_000;

export function startHeartbeat(config: HeartbeatConfig): HeartbeatHandle {
  const fetchImpl = config.fetchImpl ?? fetch;
  const interval = config.intervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
  const now = config.now ?? (() => Date.now());

  let stopped = false;

  async function reportOnce() {
    const report: HeartbeatReport = {
      sandboxId: config.sandboxId,
      reportedAt: new Date(now()).toISOString(),
      turnRunning: config.getTurnRunning(),
    };
    const lastDevActivityAt = config.getLastDevActivityAt?.() ?? 0;
    if (lastDevActivityAt > 0) {
      report.lastDevActivityAt = lastDevActivityAt;
    }

    const url = `${config.backendBaseUrl}/api/research/agent/sandboxes/${encodeURIComponent(
      config.sandboxId,
    )}/heartbeat`;

    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.authToken}`,
        },
        body: JSON.stringify(report),
      });
      const text = await res.text();
      if (res.ok) {
        if (looksLikeOkResponseBody(text, { allowEmpty: true })) return;
        // eslint-disable-next-line no-console
        console.warn(`[heartbeat] suspect 200 (body did not match expected shape)`);
        return;
      }
      // eslint-disable-next-line no-console
      console.warn(`[heartbeat] backend ${res.status}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[heartbeat] post failed:`, err);
    }
  }

  const tick = () => {
    if (stopped) return;
    void reportOnce().catch(() => {});
  };
  const handle = setInterval(tick, interval);
  void reportOnce().catch(() => {});

  return {
    stop() {
      stopped = true;
      clearInterval(handle);
    },
    reportOnce,
  };
}
