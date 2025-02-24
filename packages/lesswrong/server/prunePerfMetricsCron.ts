import { addCronJob } from "./cron/cronUtil";
import { pruneOldPerfMetrics } from "./analyticsWriter";
import { performanceMetricLoggingEnabled } from "../lib/instanceSettings";

export const prunePerfMetricsCron = addCronJob({
  name: 'prunePerfMetrics',
  interval: 'every 24 hours',
  async job() {
    if (performanceMetricLoggingEnabled.get()) {
      await pruneOldPerfMetrics();
    }
  },
});
