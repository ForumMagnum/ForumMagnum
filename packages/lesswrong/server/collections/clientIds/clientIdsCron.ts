import { addCronJob } from "@/server/cron/cronUtil";
import ClientIdsRepo from "@/server/repos/ClientIdsRepo";

export const clearOldClientIdsCron = addCronJob({
  name: "clearOldClientIds",
  interval: "every 1 day",
  job: async () => {
    const repo = new ClientIdsRepo();
    await repo.clearOldClientIds();
  },
});
