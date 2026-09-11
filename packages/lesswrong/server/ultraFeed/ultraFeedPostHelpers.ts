import { FeedFullPost, FeedItemSourceType } from "@/components/ultraFeed/ultraFeedTypes";
import { FilterSettings, getDefaultFilterSettings } from "@/lib/filterSettings";
import { recombeeApi, recombeeRequestHelpers } from "@/server/recombee/client";
import { UltraFeedResolverSettings } from "@/components/ultraFeed/ultraFeedSettingsTypes";
import keyBy from 'lodash/keyBy';
import { accessFilterMultiple } from "@/lib/utils/schemaUtils";

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
  scenarioId = 'recombee-lesswrong-ultrafeed',
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

  if (limit <= 0) return [];
  const excluded = new Set([
    ...(currentUser?.hiddenPostsMetadata?.map(metadata => metadata.postId) ?? []),
    ...additionalExcludedIds,
  ]);
  const filters: FilterSettings = currentUser?.frontpageFilterSettings ?? getDefaultFilterSettings();
  const eligible = (post: Partial<DbPost>) => {
    if (!post._id || excluded.has(post._id) || post.draft || post.rejected || post.deletedDraft) return false;
    if (filters.personalBlog === 'Hidden' && !post.frontpageDate) return false;
    return filters.tags.every(tag => {
      const relevance = post.tagRelevance?.[tag.tagId] ?? 0;
      return (tag.filterMode !== 'Hidden' || relevance < 1)
        && (tag.filterMode !== 'Required' || relevance >= 1);
    });
  };

  const cachedIds = userIdOrClientId
    ? await repos.ultraFeedEvents.getUnviewedRecombeePostIds(userIdOrClientId, scenarioId, UNVIEWED_RECOMBEE_CONFIG.lookbackDays, limit)
    : [];
  const loaded = await context.loaders.Posts.loadMany(cachedIds);
  const cachedPosts = await accessFilterMultiple(currentUser, 'Posts',
    loaded.filter((post): post is DbPost => !!post && !(post instanceof Error) && eligible(post)), context);
  const cachedItems: FeedFullPost[] = cachedPosts.map(post => ({
    post, postMetaInfo: { sources: [scenarioId as FeedItemSourceType], displayStatus: 'expanded', highlight: false },
  }));
  const ratio = cachedItems.length / limit;
  let freshItems: FeedFullPost[] = [];
  if (ratio < UNVIEWED_RECOMBEE_CONFIG.skipFetchThreshold) {
    const fetchLimit = ratio >= UNVIEWED_RECOMBEE_CONFIG.reduceFetchThreshold ? Math.ceil(limit * 0.5) : limit;
    const allExcludedIds = [...excluded, ...cachedPosts.map(post => post._id!)];
    const filter = allExcludedIds.length
      ? `'itemId' NOT IN {${allExcludedIds.map(id => JSON.stringify(id)).join(',')}}`
      : undefined;
    const recommended = await recombeeApi.getRecommendationsForUser(recombeeUser, fetchLimit, {
      scenario: scenarioId, filterSettings: filters, skipTopOfListPosts: true,
      rotationRate: 0.5, rotationTime: 24 * 30, ...(filter && { filter }),
    }, context);
    freshItems = recommended.filter(item => item.post && eligible(item.post)).map(item => ({
      post: item.post,
      postMetaInfo: {
        sources: [(item.scenario || scenarioId) as FeedItemSourceType], displayStatus: 'expanded', highlight: false,
        recommInfo: item.recommId && item.generatedAt ? {
          recommId: item.recommId, scenario: item.scenario || scenarioId, generatedAt: item.generatedAt,
        } : undefined,
      },
    }));
  }

  // Every path, including a cache-only response, gets current read highlighting.
  const items = [...new Map([...cachedItems, ...freshItems].map(item => [item.post._id, item])).values()].slice(0, limit);
  const viewed = userIdOrClientId
    ? await repos.ultraFeedEvents.getViewedPostIds(userIdOrClientId, items.map(item => item.post._id!))
    : new Set<string>();
  return items.map(item => ({ ...item, postMetaInfo: {
    ...item.postMetaInfo, highlight: !viewed.has(item.post._id!), isRead: viewed.has(item.post._id!),
  } }));
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

  const filterSettings: FilterSettings = currentUser?.frontpageFilterSettings ?? getDefaultFilterSettings(context.forumType);

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
  maxAgeDays: number
): Promise<FeedFullPost[]> {

  const recombeeScenario = 'recombee-lesswrong-ultrafeed';

  const [recommendedPostItems, latestAndSubscribedPostItems] = await Promise.all([
    (recommendedPostsLimit > 0)
      ? getRecommendedPostsForUltraFeed(context, recommendedPostsLimit, recombeeScenario)
      : Promise.resolve([]),
    (latestAndSubscribedPostsLimit > 0)
      ? getLatestAndSubscribedPosts(context, latestAndSubscribedPostsLimit, maxAgeDays, settings.sourceWeights['hacker-news'] <= 0)
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
