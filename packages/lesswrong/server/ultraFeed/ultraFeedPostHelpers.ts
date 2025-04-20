import { FeedFullPost, FeedItemSourceType } from "@/components/ultraFeed/ultraFeedTypes";
import { FilterSettings, getDefaultFilterSettings } from "@/lib/filterSettings";
import { recombeeApi, recombeeRequestHelpers } from "@/server/recombee/client";
import { RecombeeRecommendationArgs } from "@/lib/collections/users/recommendationSettings";
import { UltraFeedSettingsType } from "@/components/ultraFeed/ultraFeedSettingsTypes";
import keyBy from 'lodash/keyBy';


/**
 * Fetches recommended posts from Recombee, excluding specified IDs.
 */
export async function getRecommendedPostsForUltraFeed(
  context: ResolverContext,
  limit: number,
  scenarioId = 'recombee-lesswrong-custom'
): Promise<FeedFullPost[]> {
  const { currentUser } = context;
  const recombeeUser = recombeeRequestHelpers.getRecombeeUser(context);

  if (!recombeeUser) {
    // eslint-disable-next-line no-console
    console.warn("getRecommendedPostsForUltraFeed: No Recombee user found.");
    return [];
  }

  let exclusionFilterString: string | undefined = undefined;
  if (currentUser?.hiddenPostsMetadata?.length) {
    const exclusionFilter = currentUser?.hiddenPostsMetadata.map(metadata => `"${metadata.postId}"`).join(',');
    exclusionFilterString = `'itemId' NOT IN {${exclusionFilter}}`;
  }

  const lwAlgoSettings: RecombeeRecommendationArgs = {
    scenario: scenarioId,
    filterSettings: currentUser?.frontpageFilterSettings,
    skipTopOfListPosts: true,
    ...(exclusionFilterString && { filter: exclusionFilterString }),
  };

  const recommendedResults = await recombeeApi.getRecommendationsForUser(recombeeUser, limit, lwAlgoSettings, context);
  const displayPosts = recommendedResults.map((item): FeedFullPost | null => {
    if (!item.post?._id) return null;
    const { post, recommId, scenario, generatedAt } = item;

    const recommInfo = (recommId && generatedAt) ? {
      recommId,
      scenario: scenario || scenarioId,
      generatedAt,
    } : undefined;

    return {
      post,
      postMetaInfo: {
        sources: [scenario as FeedItemSourceType],
        displayStatus: 'expanded',
        recommInfo: recommInfo,
      },
    };
  }).filter((p) => !!p);

  return displayPosts;
}

/**
 * Fetches the latest posts for UltraFeed by approx Hacker News algorithm
 */
export async function getLatestPostsForUltraFeed(
  context: ResolverContext,
  limit: number,
  settings: UltraFeedSettingsType
): Promise<FeedFullPost[]> {
  const { currentUser, repos } = context;

  if (!currentUser?._id) {
    // eslint-disable-next-line no-console
    console.warn("getLatestPostsForUltraFeed: No logged in user found.");
    return [];
  }

  const hiddenPostIds = currentUser?.hiddenPostsMetadata?.map(metadata => metadata.postId) ?? [];
  const filterSettings: FilterSettings = currentUser?.frontpageFilterSettings ?? getDefaultFilterSettings();
  const seenPenalty = settings.ultraFeedSeenPenalty;

  return await repos.posts.getLatestPostsForUltraFeed(
    context,
    filterSettings,
    seenPenalty,
    60,
    hiddenPostIds,
    limit
  );
}


/**
 * Fetches and combines recommended and latest posts for the UltraFeed.
 */
export async function getUltraFeedPostThreads(
  context: ResolverContext,
  recommendedPostsLimit: number,
  latestPostsLimit: number,
  settings: UltraFeedSettingsType
): Promise<FeedFullPost[]> {
  const recombeeScenario = 'recombee-lesswrong-custom';

  const [recommendedPostItems, latestPostItems] = await Promise.all([
    (recommendedPostsLimit > 0)
      ? getRecommendedPostsForUltraFeed(context, recommendedPostsLimit, recombeeScenario)
      : Promise.resolve([]),
    (latestPostsLimit > 0)
      ? getLatestPostsForUltraFeed(context, latestPostsLimit, settings)
      : Promise.resolve([]),
  ]);

  const allPostsMap = keyBy(recommendedPostItems, item => item.post?._id) as Record<string, FeedFullPost>;

  latestPostItems.forEach(item => {
    if (item.post?._id) {
      const postId = item.post._id;
      if (postId in allPostsMap) {
        const existingItem = allPostsMap[postId];

        if (!existingItem.postMetaInfo.sources) {
          existingItem.postMetaInfo.sources = [];
        }
        if (item.postMetaInfo?.sources) {
          existingItem.postMetaInfo.sources = [
            ...new Set([...existingItem.postMetaInfo.sources, ...item.postMetaInfo.sources])
          ];
        }
      } else {
        allPostsMap[postId] = item;
      }
    }
  });

  return Object.values(allPostsMap);
} 
