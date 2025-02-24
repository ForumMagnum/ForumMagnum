import { addCronJob } from "./cronUtil";
import { pruneOldPerfMetrics } from "./analyticsWriter";
import { performanceMetricLoggingEnabled } from "../lib/instanceSettings";

addCronJob({
  name: 'prunePerfMetrics',
  interval: 'every 24 hours',
  async job() {
    if (performanceMetricLoggingEnabled.get()) {
      await pruneOldPerfMetrics();
    }
  },
});
