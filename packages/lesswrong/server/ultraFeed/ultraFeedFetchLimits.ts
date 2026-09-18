import { feedCommentSourceTypesArray, feedSpotlightSourceTypesArray, type FeedItemSourceType } from "@/components/ultraFeed/ultraFeedTypes";

export const calculateFetchLimits = (
  sourceWeights: Record<string, number>,
  totalLimit: number,
  offset: number = 0,
  bufferMultiplier = 3.6,
  latestAndSubscribedPostMultiplier = 3.0,
  recombeeMultiplier = 3.6,
): {
  totalWeight: number;
  recombeePostFetchLimit: number;
  hackerNewsPostFetchLimit: number;
  subscribedPostFetchLimit: number;
  commentFetchLimit: number;
  spotlightFetchLimit: number;
  bookmarkFetchLimit: number;
  bufferMultiplier: number;
} => {
  const totalWeight = Object.values(sourceWeights).reduce((sum: number, weight) => sum + weight, 0);

  const recombeePostWeight = sourceWeights['recombee-lesswrong-ultrafeed'] ?? 0;
  const hackerNewsPostWeight = sourceWeights['hacker-news'] ?? 0;
  const subscribedPostWeight = sourceWeights['subscriptionsPosts'] ?? 0;
  const bookmarkWeight = sourceWeights['bookmarks'] ?? 0;
  const totalCommentWeight = feedCommentSourceTypesArray.filter(type => type !== 'bookmarks').reduce((sum: number, type: FeedItemSourceType) => sum + (sourceWeights[type] || 0), 0);
  const totalSpotlightWeight = feedSpotlightSourceTypesArray.reduce((sum: number, type: FeedItemSourceType) => sum + (sourceWeights[type] || 0), 0);

  const baseCommentFetchLimit = Math.ceil(totalLimit * (totalCommentWeight / (totalWeight || 1)) * bufferMultiplier);

  // Scale up comment fetch limit based on offset to reduce repetition in subsequent calls: grows incrementally with each call, capped at 200
  const commentFetchLimit = totalCommentWeight > 0 ? Math.min(baseCommentFetchLimit + Math.round(offset / 2), 200) : 0;


  return {
    totalWeight,
    recombeePostFetchLimit: Math.ceil(totalLimit * (recombeePostWeight / (totalWeight || 1)) * recombeeMultiplier),
    hackerNewsPostFetchLimit: Math.ceil(totalLimit * (hackerNewsPostWeight / (totalWeight || 1)) * latestAndSubscribedPostMultiplier),
    subscribedPostFetchLimit: Math.ceil(totalLimit * (subscribedPostWeight / (totalWeight || 1)) * latestAndSubscribedPostMultiplier),
    commentFetchLimit,
    spotlightFetchLimit: Math.ceil(totalLimit * (totalSpotlightWeight / (totalWeight || 1)) * bufferMultiplier),
    bookmarkFetchLimit: Math.ceil(totalLimit * (bookmarkWeight / (totalWeight || 1)) * bufferMultiplier),
    bufferMultiplier
  };
};
