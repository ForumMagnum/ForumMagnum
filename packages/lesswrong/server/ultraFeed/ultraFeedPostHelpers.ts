import { FeedFullPost, FeedItemSourceType, FeedPostStub } from "@/components/ultraFeed/ultraFeedTypes";
import { FilterSettings, getDefaultFilterSettings } from "@/lib/filterSettings";
import { recombeeApi, recombeeRequestHelpers } from "@/server/recombee/client";
import { RecombeeRecommendationArgs } from "@/lib/collections/users/recommendationSettings";
import { UltraFeedResolverSettings } from "@/components/ultraFeed/ultraFeedSettingsTypes";
import keyBy from 'lodash/keyBy';


/**
 * Fetches recommended posts from Recombee, excluding specified IDs.
 */
export async function getRecommendedPostsForUltraFeed(
  context: ResolverContext,
  limit: number,
  scenarioId = 'recombee-lesswrong-custom',
  additionalExcludedIds: string[] = []
): Promise<FeedFullPost[]> {
  const { currentUser } = context;
  const recombeeUser = recombeeRequestHelpers.getRecombeeUser(context);

  if (!recombeeUser) {
    // eslint-disable-next-line no-console
    console.warn("getRecommendedPostsForUltraFeed: No Recombee user found.");
    return [];
  }

  let exclusionFilterString: string | undefined = undefined;
  const allExcludedIds = [
    ...(currentUser?.hiddenPostsMetadata?.map(metadata => metadata.postId) ?? []),
    ...additionalExcludedIds
  ];
  
  if (allExcludedIds.length > 0) {
    const exclusionFilter = allExcludedIds.map(id => `"${id}"`).join(',');
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
 * Fetches latest posts and posts from subscribed users in a single efficient query.
 * Posts from subscribed users will have both 'hacker-news' and 'subscriptions' in their sources.
 */
export async function getLatestAndSubscribedPosts(
  context: ResolverContext,
  limit: number,
  maxAgeDays: number
): Promise<FeedFullPost[]> {
  const { currentUser, repos } = context;

  if (!currentUser?._id) {
    // eslint-disable-next-line no-console
    console.warn("getCombinedLatestAndSubscribedPosts: No logged in user found.");
    return [];
  }

  const filterSettings: FilterSettings = currentUser?.frontpageFilterSettings ?? getDefaultFilterSettings();

  return await repos.posts.getLatestAndSubscribedFeedPosts(
    context,
    filterSettings,
    maxAgeDays,
    limit
  );
}

/**
 * Fetches and combines recommended and latest posts for the UltraFeed.
 * (Latest posts included posts from subscribed users.)
 */
export async function getUltraFeedPostThreads(
  context: ResolverContext,
  recommendedPostsLimit: number,
  latestAndSubscribedPostsLimit: number,
  settings: UltraFeedResolverSettings,
  maxAgeDays: number
): Promise<FeedFullPost[]> {
  const { currentUser } = context;
  if (!currentUser?._id) {
    return [];
  }

  const recombeeScenario = 'recombee-lesswrong-custom';

  const [recommendedPostItems, latestAndSubscribedPostItems] = await Promise.all([
    (recommendedPostsLimit > 0)
      ? getRecommendedPostsForUltraFeed(context, recommendedPostsLimit, recombeeScenario)
      : Promise.resolve([]),
    (latestAndSubscribedPostsLimit > 0)
      ? getLatestAndSubscribedPosts(context, latestAndSubscribedPostsLimit, maxAgeDays)
      : Promise.resolve([]),
  ]);

  const allPostsMap = keyBy(recommendedPostItems, item => item.post?._id) as Record<string, FeedFullPost>;

  latestAndSubscribedPostItems.forEach(item => {
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
