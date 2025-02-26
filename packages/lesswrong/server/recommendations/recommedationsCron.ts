import { addCronJob } from "../cron/cronUtil";
import PostRecommendationsRepo from "../repos/PostRecommendationsRepo";

export const clearStaleRecommendationsCron = addCronJob({
  name: "clearStaleRecommendations",
  interval: "every 24 hours",
  job: async () => {
    const repo = new PostRecommendationsRepo();
    await repo.clearStaleRecommendations();
  },
});
