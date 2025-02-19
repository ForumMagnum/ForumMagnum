import { addCronJob } from "../cronUtil";
import { PostRecommendationsRepo } from "../repos";

addCronJob({
  name: "clearStaleRecommendations",
  interval: "every 24 hours",
  job: async () => {
    const repo = new PostRecommendationsRepo();
    await repo.clearStaleRecommendations();
  },
});
