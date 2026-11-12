import difference from 'lodash/difference';
import uniq from 'lodash/uniq';
import { PostsViews } from '@/lib/collections/posts/views';
import { FilterSettings, getDefaultFilterSettings } from '@/lib/filterSettings';
import { aboutPostIdSetting, frontpageDaysAgoCutoffSetting } from '@/lib/instanceSettings';
import { loadByIds } from '@/lib/loaders';
import type { NativeRecommendedPost } from '@/lib/recombee/types';
import { accessFilterMultiple } from '@/lib/utils/schemaUtils';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { viewTermsToQuery } from '@/lib/utils/viewUtils';
import { performQueryFromViewParameters } from '../resolvers/defaultResolvers';

export interface ClassicFrontpagePostsSettings {
  filterSettings?: FilterSettings,
  excludedPostIds?: string[],
}

interface LatestFrontpagePostsArgs {
  limit: number,
  offset?: number,
  excludedPostIds: string[],
  filterSettings: FilterSettings,
}

interface ClassicTopOfList {
  postIds: string[],
  curatedPostIds: string[],
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WELCOME_POST_MAX_ACCOUNT_AGE_MS = 90 * DAY_IN_MS;
const TOP_OF_LIST_CURATED_COUNT = 2;
const MAX_TOP_OF_LIST_POSTS = TOP_OF_LIST_CURATED_COUNT + 1;
const NO_TOP_OF_LIST: ClassicTopOfList = { postIds: [], curatedPostIds: [] };

const getUserHiddenPostIds = (context: ResolverContext): string[] =>
  context.currentUser?.hiddenPostsMetadata?.map(metadata => metadata.postId) ?? [];

export async function getLatestFrontpagePosts({ limit, offset, excludedPostIds, filterSettings }: LatestFrontpagePostsArgs, context: ResolverContext): Promise<DbPost[]> {
  const notPostIds = [...excludedPostIds, ...getUserHiddenPostIds(context)];
  const cutoffDate = new Date(Date.now() - (frontpageDaysAgoCutoffSetting.get(context) * DAY_IN_MS));

  const postsTerms: PostsViewTerms = {
    view: "magic",
    forum: true,
    limit,
    filterSettings,
    after: cutoffDate.toISOString(),
    // Unfortunately, passing in an empty array translates to something like `NOT (_id IN (SELECT NULL::VARCHAR(27)))`, which filters out everything
    ...(notPostIds.length ? { notPostIds } : {}),
    ...(offset ? { offset } : {}),
  };

  const postsQuery = await viewTermsToQuery(PostsViews, postsTerms, undefined, context);
  return performQueryFromViewParameters(context.Posts, postsTerms, postsQuery);
}

async function getReadPostIds(postIds: string[], context: ResolverContext): Promise<string[]> {
  const { currentUser } = context;
  if (!currentUser || !postIds.length) {
    return [];
  }
  const readStatuses = await context.ReadStatuses.find(
    { postId: { $in: postIds }, userId: currentUser._id, isRead: true },
    undefined,
    { postId: 1 },
  ).fetch();
  return filterNonnull(readStatuses.map(readStatus => readStatus.postId));
}

const userGetsWelcomePost = (currentUser: DbUser | null): boolean =>
  !currentUser || (Date.now() - currentUser.createdAt.getTime()) <= WELCOME_POST_MAX_ACCOUNT_AGE_MS;

async function getClassicTopOfList(context: ResolverContext): Promise<ClassicTopOfList> {
  const curatedTerms: PostsViewTerms = { view: 'curated', limit: TOP_OF_LIST_CURATED_COUNT };
  const curatedQuery = await viewTermsToQuery(PostsViews, curatedTerms, undefined, context);
  const curatedPosts = await context.Posts.find(curatedQuery.selector, curatedQuery.options, { _id: 1 }).fetch();
  const curatedPostIds = curatedPosts.map(post => post._id);
  const welcomePostIds = userGetsWelcomePost(context.currentUser) ? [aboutPostIdSetting.get(context)] : [];

  // The newest curated post stays at the top of the list after it's been read
  const hiddenOnceReadPostIds = [...welcomePostIds, ...curatedPostIds.slice(1)];
  const readPostIds = await getReadPostIds(hiddenOnceReadPostIds, context);
  const notShownPostIds = [...readPostIds, ...getUserHiddenPostIds(context)];

  return {
    postIds: uniq(difference([...welcomePostIds, ...curatedPostIds], notShownPostIds)),
    curatedPostIds: difference(curatedPostIds, notShownPostIds),
  };
}

const toClassicFrontpagePost = (post: Partial<DbPost>, topOfList: ClassicTopOfList): NativeRecommendedPost => {
  const isTopOfList = !!post._id && topOfList.postIds.includes(post._id);
  const isTopOfListCurated = !!post._id && topOfList.curatedPostIds.includes(post._id);
  return { post, curated: isTopOfListCurated, stickied: !isTopOfList && !!post.sticky };
};

export async function getClassicFrontpagePosts(limit: number, settings: ClassicFrontpagePostsSettings, context: ResolverContext): Promise<NativeRecommendedPost[]> {
  const filterSettings = settings.filterSettings ?? context.currentUser?.frontpageFilterSettings ?? getDefaultFilterSettings(context.forumType);
  const excludedPostIds = settings.excludedPostIds ?? [];
  const continuesExistingList = excludedPostIds.length > 0;

  // The latest posts are fetched without waiting to learn which posts are at
  // the top of the list, so fetch enough to still fill the list after removing those.
  const [topOfList, latestPosts] = await Promise.all([
    continuesExistingList ? NO_TOP_OF_LIST : getClassicTopOfList(context),
    getLatestFrontpagePosts({
      limit: continuesExistingList ? limit : limit + MAX_TOP_OF_LIST_POSTS,
      excludedPostIds,
      filterSettings,
    }, context),
  ]);

  const topOfListPosts = filterNonnull(await loadByIds(context, 'Posts', topOfList.postIds));
  const rankedPosts = latestPosts.filter(post => !topOfList.postIds.includes(post._id));
  const posts = [...topOfListPosts, ...rankedPosts].slice(0, limit);
  const visiblePosts = await accessFilterMultiple(context.currentUser, 'Posts', posts, context);

  return visiblePosts.map(post => toClassicFrontpagePost(post, topOfList));
}
