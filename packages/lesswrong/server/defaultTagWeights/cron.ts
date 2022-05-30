import { onStartup } from "../../lib/executionEnvironment";
import { addCronJob } from "../cronUtil";
import { refreshTagDefaultWeights } from "./cache";

onStartup(async () => {
  await refreshTagDefaultWeights();
});

addCronJob({
  name: 'refreshTagDefaultWeightsCron',
  interval: 'every 5 minutes',
  job() {
    void refreshTagDefaultWeights();
  }
});
