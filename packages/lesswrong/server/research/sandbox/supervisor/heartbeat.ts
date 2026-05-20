/**
 * Periodic heartbeat from the supervisor to the backend.
 *
 * POST /api/research/agent/sandboxes/:sandboxId/heartbeat
 * Authorization: Bearer <signed callback token>
 *
 * Carries whether a turn is running and recent dev-server activity so the
 * backend can re-arm the idle timeout or roll the session (§3.3). Failures are
 * logged and dropped; each terminal outcome can be reported to `healthTracker`.
 */
import { HealthTracker, classifyNetworkError, looksLikeOkResponseBody, snippetOf } from "./healthTracker";

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
  healthTracker?: HealthTracker;
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
        if (looksLikeOkResponseBody(text, { allowEmpty: true })) {
          config.healthTracker?.recordSuccess("heartbeat");
          return;
        }
        // eslint-disable-next-line no-console
        console.warn(`[heartbeat] suspect 200 (body did not match expected shape)`);
        config.healthTracker?.recordFailure({
          kind: "suspect_success",
          targetUrl: url,
          httpStatus: res.status,
          networkError: null,
          responseBodySnippet: snippetOf(text),
          attempts: 1,
          context: {},
        });
        return;
      }
      // eslint-disable-next-line no-console
      console.warn(`[heartbeat] backend ${res.status}`);
      config.healthTracker?.recordFailure({
        kind: "heartbeat",
        targetUrl: url,
        httpStatus: res.status,
        networkError: null,
        responseBodySnippet: snippetOf(text),
        attempts: 1,
        context: {},
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[heartbeat] post failed:`, err);
      config.healthTracker?.recordFailure({
        kind: "heartbeat",
        targetUrl: url,
        httpStatus: null,
        networkError: classifyNetworkError(err),
        responseBodySnippet: null,
        attempts: 1,
        context: {},
      });
    }
  }

  const tick = () => {
    if (stopped) return;
    void reportOnce();
  };
  const handle = setInterval(tick, interval);
  void reportOnce();

  return {
    stop() {
      stopped = true;
      clearInterval(handle);
    },
    reportOnce,
  };
}
