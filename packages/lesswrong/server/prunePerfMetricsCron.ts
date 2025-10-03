import { pruneOldPerfMetrics } from "./analytics/serverAnalyticsWriter";
import { performanceMetricLoggingEnabled } from "../lib/instanceSettings";

export async function prunePerfMetrics() {
  if (performanceMetricLoggingEnabled.get()) {
    await pruneOldPerfMetrics();
  }
}
