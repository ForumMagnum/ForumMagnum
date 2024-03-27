import { ApiClient, requests } from 'recombee-api-client';
import { RecombeeRecommendationArgs } from '../../lib/collections/users/recommendationSettings';
import { loadByIds } from '../../lib/loaders';
import { recombeePrivateApiTokenSetting } from '../databaseSettings';
import { recombeeDatabaseIdSetting } from '../../lib/publicSettings';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { htmlToTextDefault } from '../../lib/htmlToText';
import { truncate } from '../../lib/editor/ellipsize';
import findByIds from '../vulcan-lib/findbyids';
import ReadStatuses from '../../lib/collections/readStatus/collection';
import moment from 'moment';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';

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
    const { userId: overrideUserId, lwRationalityOnly, onlyUnread, ...settings } = lwAlgoSettings;

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
  /**
   * WARNING: this does not do permissions checks on the posts it returns.  The caller is responsible for this.
   */
  async getRecommendationsForUser(userId: string, count: number, lwAlgoSettings: RecombeeRecommendationArgs, context: ResolverContext) {
    const modifiedCount = Math.ceil(count * 3);

    const client = getRecombeeClientOrThrow();
    const request = recombeeRequestHelpers.createRecommendationsForUserRequest(userId, modifiedCount, lwAlgoSettings);

    const response = await client.send(request);

    // remove posts read more than a week ago
    const oneWeekAgo = moment(new Date()).subtract(1, 'week').toDate();
    const postIds = response.recomms.map(rec => rec.id);
    const [
      posts,
      readStatuses
    ] = await Promise.all([ 
      filterNonnull(await loadByIds(context, 'Posts', postIds)),
      ReadStatuses.find({ 
        postId: { $in: postIds }, 
        userId, 
        isRead: true, 
        lastUpdated: { $lt: oneWeekAgo } 
      }).fetch()
    ])

    const unreadPosts = posts.filter(post => !readStatuses.find(readStatus => (readStatus.postId === post._id)));
    const filteredPosts = await accessFilterMultiple(context.currentUser, context.Posts, unreadPosts, context)
    
    // TODO: loop over the above if we don't get enough posts?
    return filteredPosts.slice(0, count).map(post => ({post, recommId: response.recommId}));
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
