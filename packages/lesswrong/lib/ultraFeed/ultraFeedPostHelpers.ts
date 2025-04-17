import { accessFilterMultiple } from "../utils/schemaUtils";
import { performQueryFromViewParameters } from "@/server/resolvers/defaultResolvers";
import { FeedFullPost, FeedItemSourceType } from "@/components/ultraFeed/ultraFeedTypes";
import { FilterSettings, getDefaultFilterSettings } from "../filterSettings";
import { viewTermsToQuery } from "../utils/viewUtils";
import { recombeeApi, recombeeRequestHelpers } from "@/server/recombee/client";
import { RecombeeRecommendationArgs } from "../collections/users/recommendationSettings";
import { filterNonnull } from "../utils/typeGuardUtils";


/**
 * Fetches recommended posts from Recombee, excluding specified IDs.
 */
export async function getRecommendedPostsForUltraFeed(
  context: ResolverContext,
  limit: number,
  excludedPostIds: string[] = [],
  scenarioId = 'recombee-lesswrong-custom'
): Promise<FeedFullPost[]> {
  const { currentUser } = context;
  const recombeeUser = recombeeRequestHelpers.getRecombeeUser(context);

  if (!recombeeUser) {
    // eslint-disable-next-line no-console
    console.warn("getRecommendedPostsForUltraFeed: No Recombee user found.");
    return [];
  }
  
  // Construct the RQL filter string ONLY for the excludedPostIds
  let exclusionFilterString: string | undefined = undefined;
  if (excludedPostIds.length > 0) {
      const exclusionFilter = excludedPostIds.map(id => `"${id}"`).join(',');
      exclusionFilterString = `'itemId' NOT IN {${exclusionFilter}}`;
  }
  
  const lwAlgoSettings: RecombeeRecommendationArgs = {
      scenario: scenarioId,
      filterSettings: currentUser?.frontpageFilterSettings,
      ...(exclusionFilterString && { filter: exclusionFilterString }),
  };
  
  try {
      const recommendedResults = await recombeeApi.getRecommendationsForUser( recombeeUser, limit, lwAlgoSettings, context);

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

  } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error calling getRecommendationsForUser for scenario ${scenarioId}:`, error);
      return [];
  }
}

/**
 * Fetches the latest posts and maps them directly to FeedFullPost format.
 */
export async function getLatestPostsForUltraFeed(
  context: ResolverContext,
  limit: number,
  excludedPostIds: string[] = [],
): Promise<FeedFullPost[]> {
  const latestPostsSourceType: FeedItemSourceType = 'hacker-news';
  const { currentUser } = context;
  const hiddenPostIds = currentUser?.hiddenPostsMetadata?.map(metadata => metadata.postId) ?? [];
  const allExcludedIds = [...new Set([...excludedPostIds, ...hiddenPostIds])];

  const thirtyDaysAgo = new Date(new Date().getTime() - (30*24*60*60*1000));
  const filterSettings: FilterSettings = currentUser?.frontpageFilterSettings ?? getDefaultFilterSettings();

  const postsTerms: PostsViewTerms = {
    view: "magic",
    forum: true,
    limit,
    filterSettings,
    after: thirtyDaysAgo,
    karmaThreshold: 10,
    ...(allExcludedIds.length > 0 && { notPostIds: allExcludedIds }),
  };

  const postsQuery = viewTermsToQuery('Posts', postsTerms, undefined, context);
  
  try {
    const posts = await performQueryFromViewParameters(context.Posts, postsTerms, postsQuery);
    const potentiallyPartialPosts = await accessFilterMultiple(currentUser, 'Posts', posts, context);
    const accessiblePosts = filterNonnull(potentiallyPartialPosts) as DbPost[];
    
    // Directly map to FeedFullPost format inline, without using mapDbPostToFeedFullPost
    return accessiblePosts.map(post => ({
      post,
      postMetaInfo: {
        sources: [latestPostsSourceType],
        displayStatus: 'expanded',
      }
    }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching latest posts for UltraFeed:", error);
    return [];
  }
}


/**
 * Fetches and combines recommended and latest posts for the UltraFeed.
 */
export async function getUltraFeedPostThreads(
  context: ResolverContext,
  recommendedPostsLimit: number,
  latestPostsLimit: number,
  servedPostIds: string[],
): Promise<FeedFullPost[]> {
  const recombeeScenario = 'recombee-lesswrong-custom';


  // Get both post types
  const [recommendedPostItems, latestPostItems] = await Promise.all([
    (recommendedPostsLimit > 0)
      ? getRecommendedPostsForUltraFeed(context, recommendedPostsLimit, servedPostIds, recombeeScenario)
      : Promise.resolve([]),
    (latestPostsLimit > 0)
      ? getLatestPostsForUltraFeed(context, latestPostsLimit, servedPostIds)
      : Promise.resolve([]),
  ]);

  const allPostsMap = new Map<string, FeedFullPost>();

  recommendedPostItems.forEach(item => {
    if (item.post?._id) {
      allPostsMap.set(item.post._id, item);
    }
  });

  // Add latest posts, merging sources if ID exists
  latestPostItems.forEach(item => {
    if (item.post?._id) {
      if (allPostsMap.has(item.post._id)) {
        const existingItem = allPostsMap.get(item.post._id)!;
        if (existingItem.postMetaInfo && item.postMetaInfo?.sources) {
           existingItem.postMetaInfo.sources = [
             ...new Set([...(existingItem.postMetaInfo.sources || []), ...item.postMetaInfo.sources])
           ];
        }
      } else {
        allPostsMap.set(item.post._id, item);
      }
    }
  });

  return Array.from(allPostsMap.values());
} 
