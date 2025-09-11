import { FeedFullPost, FeedItemSourceType, FeedPostStub } from "@/components/ultraFeed/ultraFeedTypes";
import { FilterSettings, getDefaultFilterSettings } from "@/lib/filterSettings";
import { recombeeApi, recombeeRequestHelpers } from "@/server/recombee/client";
import { RecombeeRecommendationArgs } from "@/lib/collections/users/recommendationSettings";
import { UltraFeedResolverSettings } from "@/components/ultraFeed/ultraFeedSettingsTypes";
import keyBy from 'lodash/keyBy';

// Configuration for unviewed items optimization
const UNVIEWED_RECOMBEE_CONFIG = {
  lookbackDays: 14, // relevant for view events as we truncate served events sooner
  skipFetchThreshold: 0.5, // Skip if we have 70% of requested items
  reduceFetchThreshold: 0.3, // Reduce to 50% if we have 30% of requested items
};

/**
 * Fetches recommended posts from Recombee, excluding specified IDs.
 */
export async function getRecommendedPostsForUltraFeed(
  context: ResolverContext,
  limit: number,
  scenarioId = 'recombee-lesswrong-custom',
  additionalExcludedIds: string[] = []
): Promise<FeedFullPost[]> {
  const { currentUser, repos } = context;
  const recombeeUser = recombeeRequestHelpers.getRecombeeUser(context);
  const userIdOrClientId = context.userId ?? context.clientId;

  if (!recombeeUser) {
    // eslint-disable-next-line no-console
    console.warn("getRecommendedPostsForUltraFeed: No Recombee user found.");
    return [];
  }

  let unviewedRecombeePostIds: string[] = [];
  let adjustedLimit = limit;
  
  if (userIdOrClientId) {
    unviewedRecombeePostIds = await repos.ultraFeedEvents.getUnviewedRecombeePostIds(
      userIdOrClientId,
      scenarioId,
      UNVIEWED_RECOMBEE_CONFIG.lookbackDays,
      limit
    );
    
    const unviewedRatio = unviewedRecombeePostIds.length / limit;
    
    if (unviewedRatio >= UNVIEWED_RECOMBEE_CONFIG.skipFetchThreshold) {
      // We have enough cached items, return them directly
      const posts = await context.loaders.Posts.loadMany(unviewedRecombeePostIds.slice(0, limit));
      
      return posts
        .filter((post): post is DbPost => !(post instanceof Error))
        .slice(0, limit)
        .map((post): FeedFullPost => ({
          post,
          postMetaInfo: {
            sources: [scenarioId as FeedItemSourceType],
            displayStatus: 'expanded',
            highlight: true, // May be overridden by getViewedPostIds (these are unviewed from recent lookback period but concievably were viewed in the past)
          },
        }));
    } else if (unviewedRatio >= UNVIEWED_RECOMBEE_CONFIG.reduceFetchThreshold) {
      adjustedLimit = Math.ceil(limit * 0.5);
    }
  }

  let exclusionFilterString: string | undefined = undefined;
  const allExcludedIds = [
    ...(currentUser?.hiddenPostsMetadata?.map(metadata => metadata.postId) ?? []),
    ...additionalExcludedIds,
    ...unviewedRecombeePostIds
  ];
  
  if (allExcludedIds.length > 0) {
    const exclusionFilter = allExcludedIds.map(id => `"${id}"`).join(',');
    exclusionFilterString = `'itemId' NOT IN {${exclusionFilter}}`;
  }

  const lwAlgoSettings: RecombeeRecommendationArgs = {
    scenario: scenarioId,
    filterSettings: currentUser?.frontpageFilterSettings,
    skipTopOfListPosts: true,
    rotationRate: 0.5,
    rotationTime: 24 * 30, // 30 days
    ...(exclusionFilterString && { filter: exclusionFilterString }),
  };

  const recommendedResults = await recombeeApi.getRecommendationsForUser(recombeeUser, adjustedLimit, lwAlgoSettings, context);
  
  const allPostIds = [
    ...unviewedRecombeePostIds.slice(0, limit),
    ...recommendedResults.map(item => item.post?._id).filter((id): id is string => !!id)
  ];
  
  let viewedPostIds = new Set<string>();
  if (userIdOrClientId && allPostIds.length > 0) {
    viewedPostIds = await repos.ultraFeedEvents.getViewedPostIds(userIdOrClientId, allPostIds);
  }
  
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
        highlight: post._id ? !viewedPostIds.has(post._id) : true,
      },
    };
  }).filter((p) => !!p);

  if (adjustedLimit < limit && unviewedRecombeePostIds.length > 0) {
    const postsToReuse = limit - displayPosts.length;
    const reusedPostIds = unviewedRecombeePostIds.slice(0, postsToReuse);
    const reusedPosts = await context.loaders.Posts.loadMany(reusedPostIds);
    
    const reusedDisplayPosts = reusedPosts
      .filter((post): post is DbPost => !(post instanceof Error))
      .map((post): FeedFullPost => ({
        post,
        postMetaInfo: {
          sources: [scenarioId as FeedItemSourceType],
          displayStatus: 'expanded',
          highlight: !viewedPostIds.has(post._id),
        },
      }));
    
    return [...reusedDisplayPosts, ...displayPosts].slice(0, limit);
  }

  return displayPosts;
}

/**
 * Fetches latest posts and posts from subscribed users in a single efficient query.
 * Posts from subscribed users will have both 'hacker-news' and 'subscriptions' in their sources.
 */
export async function getLatestAndSubscribedPosts(
  context: ResolverContext,
  limit: number,
  maxAgeDays: number,
  restrictToFollowedAuthors = false,
): Promise<FeedFullPost[]> {
  const { currentUser, repos } = context;

  const filterSettings: FilterSettings = currentUser?.frontpageFilterSettings ?? getDefaultFilterSettings();

  return await repos.posts.getLatestAndSubscribedFeedPosts(
    context,
    {
      filterSettings,
      maxAgeDays,
      limit,
      restrictToFollowedAuthors,
    }
  );
}

/**
 * Fetches and combines recommended and latest posts for the UltraFeed (latest is superset of subscribed).
 */
export async function getUltraFeedPostThreads(
  context: ResolverContext,
  recommendedPostsLimit: number,
  latestAndSubscribedPostsLimit: number,
  settings: UltraFeedResolverSettings,
  maxAgeDays: number,
): Promise<FeedFullPost[]> {

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
