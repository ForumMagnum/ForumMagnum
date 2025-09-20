import PostRecommendationsRepo from "../repos/PostRecommendationsRepo";

export async function clearStaleRecommendations() {
  const repo = new PostRecommendationsRepo();
  await repo.clearStaleRecommendations();
}
