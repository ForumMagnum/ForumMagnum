import { addCronJob } from "./cronUtil";
import { pruneOldPerfMetrics } from "./analyticsWriter";
import { Globals } from "./vulcan-lib";

addCronJob({
  name: 'prunePerfMetrics',
  interval: 'every 24 hours',
  async job() {
    await pruneOldPerfMetrics();
  },
});

Globals.prunePerfMetrics = async () => await pruneOldPerfMetrics();
