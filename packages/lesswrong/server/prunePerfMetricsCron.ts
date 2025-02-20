import { addCronJob } from "./cronUtil";
import { pruneOldPerfMetrics } from "./analyticsWriter";
import { Globals } from "../lib/vulcan-lib/config";
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

Globals.prunePerfMetrics = async () => await pruneOldPerfMetrics();
