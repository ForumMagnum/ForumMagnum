import { ApiClient, RecommendationResponse, requests } from 'recombee-api-client';
import { HybridRecombeeConfiguration, RecombeeRecommendationArgs } from '../../lib/collections/users/recommendationSettings';
import { loadByIds } from '../../lib/loaders';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { htmlToTextDefault } from '../../lib/htmlToText';
import { truncate } from '../../lib/editor/ellipsize';
import findByIds from '../vulcan-lib/findbyids';
import ReadStatuses from '../../lib/collections/readStatus/collection';
import moment from 'moment';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';
import { recombeeDatabaseIdSetting, recombeePrivateApiTokenSetting } from '../../lib/instanceSettings';

export const getRecombeeClientOrThrow = (() => {
  let client: ApiClient;

  return () => {
    if (!client) {
      const databaseId = recombeeDatabaseIdSetting.get();
      const apiToken = recombeePrivateApiTokenSetting.get();

      if (!databaseId || !apiToken) {
        throw new Error('Missing either databaseId or api token when initializing Recombee client!');
      }
      
      // TODO - pull out client options like region to db settings?
      client = new ApiClient(databaseId, apiToken, { region: 'us-west' });
    }

    return client;
  };
})();

const voteTypeRatingsMap: Partial<Record<string, number>> = {
  bigDownvote: -1,
  smallDownvote: -0.5,
  smallUpvote: 0.5,
  bigUpvote: 1,
};

const recombeeRequestHelpers = {
  createRecommendationsForUserRequest(userId: string, count: number, lwAlgoSettings: RecombeeRecommendationArgs) {
    const { userId: overrideUserId, lwRationalityOnly, onlyUnread, loadMore, ...settings } = lwAlgoSettings;

    if (loadMore) {
      return new requests.RecommendNextItems(loadMore.prevRecommId, count);
    }

    const servedUserId = overrideUserId ?? userId;

    // TODO: pass in scenario, exclude unread, etc, in options?
    const lwRationalityFilter = lwRationalityOnly ? ` and ("Rationality" in 'core_tags' or "World Modeling" in 'core_tags')` : '';

    return new requests.RecommendItemsToUser(servedUserId, count, {
      ...settings,
      // Explicitly coalesce empty strings to undefined, since empty strings aren't valid booster expressions
      booster: settings.booster || undefined,
      rotationTime: settings.rotationTime * 3600,
    });
  },

  async createUpsertPostRequest(post: DbPost, context: ResolverContext, tags?: { name: string, core: boolean }[]) {
    const { Tags } = context;

    const tagIds = Object.entries(post.tagRelevance ?? {}).filter(([_, relevance]: [string, number]) => relevance > 0).map(([tagId]) => tagId)
    tags ??= filterNonnull(await findByIds(Tags, tagIds))
    const tagNames = tags.map(tag => tag.name)
    const coreTagNames = tags.filter(tag => tag.core).map(tag => tag.name)

    const postText = htmlToTextDefault(truncate(post.contents?.html, 2000, 'words'))

    return new requests.SetItemValues(post._id, {
      title: post.title,
      author: post.author,
      authorId: post.userId,
      karma: post.baseScore,
      body: postText,
      postedAt: post.postedAt,
      tags: tagNames,
      coreTags: coreTagNames,
      curated: !!post.curatedDate,
      frontpage: !!post.frontpageDate,
      draft: !!post.draft,
      lastCommentedAt: post.lastCommentedAt,
    }, { cascadeCreate: true });
  },

  createReadStatusRequest(readStatus: DbReadStatus) {
    if (!readStatus.postId) {
      // eslint-disable-next-line no-console
      console.error(`Missing postId for read status ${readStatus._id} when trying to add detail view to recombee`);
      return;
    }

    return new requests.AddDetailView(readStatus.userId, readStatus.postId, {
      timestamp: readStatus.lastUpdated.toISOString(),
      cascadeCreate: false
    });
  },

  createVoteRequest(vote: DbVote) {
    const rating = voteTypeRatingsMap[vote.voteType];
    if (typeof rating !== 'number') {
      // eslint-disable-next-line no-console
      console.log(`Attempted to create a recombee rating request for a non-karma vote with id ${vote._id}`);
      return;
    }

    return new requests.AddRating(vote.userId, vote.documentId, rating, {
      timestamp: vote.votedAt.toISOString(),
      cascadeCreate: false
    });
  },

  createUpsertUserDetailsRequest(user: DbUser) {
    const { displayName, karma, createdAt } = user;
    return new requests.SetUserValues(user._id, { displayName, karma, createdAt }, { cascadeCreate: true });
  },

  getBatchRequest(requestBatch: requests.Request[]) {
    return new requests.Batch(requestBatch);
  }
};

const recombeeApi = {
  async getRecommendationsForUser(userId: string, count: number, lwAlgoSettings: RecombeeRecommendationArgs, context: ResolverContext) {
    const client = getRecombeeClientOrThrow();

    // TODO: Now having Recombee filter out read posts, maybe clean up?
    const modifiedCount = count * 1;
    const request = recombeeRequestHelpers.createRecommendationsForUserRequest(userId, modifiedCount, lwAlgoSettings);

    // We need the type cast here because recombee's type definitions can't handle inferring response types for union request types, even if they have the same response type
    const recombeeResponse = await client.send(request) as RecommendationResponse;

    // remove posts read more than a week ago
    const twoWeeksAgo = moment(new Date()).subtract(2, 'week').toDate();
    const postIds = recombeeResponse.recomms.map(rec => rec.id);
    const [
      posts,
      readStatuses
    ] = await Promise.all([ 
      filterNonnull(await loadByIds(context, 'Posts', postIds)),
      ReadStatuses.find({ 
        postId: { $in: postIds }, 
        userId, 
        isRead: true, 
        lastUpdated: { $lt: twoWeeksAgo } 
      }).fetch()
    ])

    //should basically never take any out
    const filteredPosts = await accessFilterMultiple(context.currentUser, context.Posts, posts, context)

    // TO-DO: clean up. Recombee should now be handling this for us but maybe we'll need it again for some reason

    // //sort the posts by read/unread but ensure otherwise preserving Recombee's returned order
    // const unreadOrRecentlyReadPosts = filteredPosts.filter(post => !readStatuses.find(readStatus => (readStatus.postId === post._id)));
    // const remainingPosts = filteredPosts.filter(post => readStatuses.find(readStatus => (readStatus.postId === post._id)));

    // //concatenate unread and read posts and return requested number
    // return unreadOrRecentlyReadPosts.concat(remainingPosts).slice(0, count).map(post => ({post, recommId: recombeeResponse.recommId}));

    return filteredPosts.map(post => ({ post, recommId: recombeeResponse.recommId }));
  },


  async getHybridRecommendationsForUser(userId: string, count: number, lwAlgoSettings: HybridRecombeeConfiguration, context: ResolverContext) {
    const client = getRecombeeClientOrThrow();

    const split = 0.5;
    const firstCount = Math.floor(count * split);
    const secondCount = count - firstCount;

    const { loadMore, ...rest } = lwAlgoSettings;
    const firstRequestSettings = { ...rest, scenario: 'recombee-hybrid-1-nearterm', ...(loadMore ? { loadMore: { prevRecommId: loadMore.prevRecommIds[0] } } : {}) };
    const secondRequestSettings = { ...rest, scenario: 'recombee-hybrid-2-global', ...(loadMore ? { loadMore: { prevRecommId: loadMore.prevRecommIds[1] } } : {}) };

    const firstRequest = recombeeRequestHelpers.createRecommendationsForUserRequest(userId, firstCount, firstRequestSettings);
    const secondRequest = recombeeRequestHelpers.createRecommendationsForUserRequest(userId, secondCount, secondRequestSettings);
    const batchRequest = recombeeRequestHelpers.getBatchRequest([firstRequest, secondRequest]);

    // We need the type cast here because recombee's type definitions can't handle inferring response types for union request types, even if they have the same response type
    const batchResponse = await client.send(batchRequest)  
    const recombeeResponses = batchResponse.map(({json}) => json as RecommendationResponse);

    const recommendations = recombeeResponses.flatMap(response => response.recomms.map(rec => ({ id: rec.id, recommId: response.recommId })));
    const postIds = recommendations.map(rec => rec.id);
    const posts = filterNonnull(await loadByIds(context, 'Posts', postIds))
    const filteredPosts = await accessFilterMultiple(context.currentUser, context.Posts, posts, context)


    return filteredPosts.map(post => ({ post, recommId: recommendations.find(rec => rec.id === post._id)?.recommId}));
  },


  async upsertPost(post: DbPost, context: ResolverContext) {
    const client = getRecombeeClientOrThrow();
    const request = await recombeeRequestHelpers.createUpsertPostRequest(post, context);

    await client.send(request);
  },

  async createReadStatus(readStatus: DbReadStatus) {
    const client = getRecombeeClientOrThrow();
    const request = recombeeRequestHelpers.createReadStatusRequest(readStatus);
    if (!request) {
      return;
    }

    await client.send(request);
  },

  async createVote(vote: DbVote) {
    const client = getRecombeeClientOrThrow();
    const request = recombeeRequestHelpers.createVoteRequest(vote);
    if (!request) {
      return;
    }

    await client.send(request);
  },

  async createUser(user: DbUser) {
    const client = getRecombeeClientOrThrow();
    const request = recombeeRequestHelpers.createUpsertUserDetailsRequest(user);
    await client.send(request);
  }
};

export { recombeeRequestHelpers, recombeeApi };
