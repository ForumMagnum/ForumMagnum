import { addCronJob } from "./cron/cronUtil";
import { pruneOldPerfMetrics } from "./analyticsWriter";
import { Globals } from "../lib/vulcan-lib/config";
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

Globals.prunePerfMetrics = async () => await pruneOldPerfMetrics();
