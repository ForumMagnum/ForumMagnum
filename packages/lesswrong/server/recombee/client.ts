import { ApiClient, BatchResponse, RecommendationResponse, requests } from 'recombee-api-client';
import { HybridArmsConfig, HybridRecombeeConfiguration, RecombeeConfiguration, RecombeeRecommendationArgs } from '../../lib/collections/users/recommendationSettings';
import { loadByIds } from '../../lib/loaders';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { htmlToTextDefault } from '../../lib/htmlToText';
import { truncate } from '../../lib/editor/ellipsize';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';
import { recombeeDatabaseIdSetting, recombeePrivateApiTokenSetting } from '../../lib/instanceSettings';
import { viewTermsToQuery } from '../../lib/utils/viewUtils';
import { stickiedPostTerms } from '../../components/posts/RecombeePostsList';
import groupBy from 'lodash/groupBy';
import { recommendationsTabManuallyStickiedPostIdsSetting } from '../../lib/publicSettings';
import { getParentTraceId, openPerfMetric, wrapWithPerfMetric } from '../perfMetrics';
import { performQueryFromViewParameters } from '../../lib/vulcan-core/default_resolvers';
import { captureException } from '@sentry/core';

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

interface OnsitePostRecommendationsInfo {
  curatedPostIds: string[],
  stickiedPostIds: string[],
  excludedPostFilter?: string,
}

export interface RecombeeRecommendedPost {
  post: Partial<DbPost>,
  scenario: string,
  recommId: string,
  curated?: never,
  stickied?: never,
}

interface NativeRecommendedPost {
  post: Partial<DbPost>,
  scenario?: never,
  recommId?: never,
  curated: boolean,
  stickied: boolean,
}

export type RecommendedPost = RecombeeRecommendedPost | NativeRecommendedPost;

interface PostFieldDependencies {
  title: 'title',
  author: 'author',
  authorId: 'userId',
  karma: 'baseScore',
  body: 'contents',
  postedAt: 'postedAt',
  curated: 'curatedDate',
  frontpage: 'frontpageDate',
  draft: 'draft',
  lastCommentedAt: 'lastCommentedAt',
  shortform: 'shortform',
}

interface UpsertPostData<FieldMask extends PostFieldDependencies[keyof PostFieldDependencies] = PostFieldDependencies[keyof PostFieldDependencies]> {
  post: Pick<DbPost, FieldMask | '_id'>,
  tags: Pick<DbTag, 'name' | 'core'>[],
}

type RecRequest = requests.RecommendNextItems | requests.RecommendItemsToUser;

interface AssignRecommendationResultMetadataArgs {
  post: Partial<DbPost>,
  recommendationIdTuples: Array<(readonly [string, string, string])>,
  stickiedPostIds: string[],
  curatedPostIds: string[],
}

const recombeePostFieldMappings = {
  title:            ({ post }: UpsertPostData) => post.title,
  author:           ({ post }: UpsertPostData) => post.author,
  authorId:         ({ post }: UpsertPostData) => post.userId,
  karma:            ({ post }: UpsertPostData) => post.baseScore,
  body:             ({ post }: UpsertPostData) => htmlToTextDefault(truncate(post.contents?.html, 2000, 'words')),
  postedAt:         ({ post }: UpsertPostData) => post.postedAt,
  tags:             ({ tags }: UpsertPostData) => tags.map(tag => tag.name),
  coreTags:         ({ tags }: UpsertPostData) => tags.filter(tag => tag.core).map(tag => tag.name),
  curated:          ({ post }: UpsertPostData) => !!post.curatedDate,
  frontpage:        ({ post }: UpsertPostData) => !!post.frontpageDate,
  draft:            ({ post }: UpsertPostData) => !!post.draft,
  lastCommentedAt:  ({ post }: UpsertPostData) => post.lastCommentedAt,
  shortform:        ({ post }: UpsertPostData) => post.shortform,
};

type RecombeePostFields = keyof typeof recombeePostFieldMappings;

const ALL_RECOMBEE_POST_FIELDS = [
  'title', 'author', 'authorId', 'karma', 'body', 'postedAt', 'tags', 'coreTags',
  'curated', 'frontpage', 'draft', 'lastCommentedAt', 'shortform'
] as const;

const helpers = {
  createRecommendationsForUserRequest(userId: string, count: number, lwAlgoSettings: RecombeeRecommendationArgs) {
    const { userId: overrideUserId, rotationTime, lwRationalityOnly, onlyUnread, loadMore, ...settings } = lwAlgoSettings;

    if (loadMore) {
      return new requests.RecommendNextItems(loadMore.prevRecommId, count);
    }

    const servedUserId = overrideUserId ?? userId;
    const rotationTimeSeconds = typeof rotationTime === 'number' ? rotationTime * 3600 : undefined;

    // TODO: pass in scenario, exclude unread, etc, in options?
    const lwRationalityFilter = lwRationalityOnly ? ` and ("Rationality" in 'core_tags' or "World Modeling" in 'core_tags')` : '';

    return new requests.RecommendItemsToUser(servedUserId, count, {
      ...settings,
      // Explicitly coalesce empty strings to undefined, since empty strings aren't valid booster expressions
      booster: settings.booster || undefined,
      rotationTime: rotationTimeSeconds,
      cascadeCreate: true
    });
  },

  createUpsertPostRequest<Fields extends ReadonlyArray<RecombeePostFields>>(
    postData: UpsertPostData,
    fieldMask?: Fields,
    overrideOptions?: requests.SetValuesOptions
  ) {
    const { post } = postData;
    
    const recombeePostInfo = Object.fromEntries(
      (fieldMask ?? ALL_RECOMBEE_POST_FIELDS).map(field => [
        field,
        recombeePostFieldMappings[field](postData)
      ] as const)
    );

    return new requests.SetItemValues(post._id, recombeePostInfo, { cascadeCreate: true, ...overrideOptions });
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
  },

  filterSuccessesFromBatchResponse(batchResponse: BatchResponse) {
    return batchResponse.filter(({ json, code }) => {
      if (code !== 200) {
        // eslint-disable-next-line no-console
        console.log(`Error when batch fetching Recombee recommendations with status code ${code}`, { err: json.error });
        captureException(new Error(json.error));
        return false;
      }

      return true;
    });
  },

  async getOnsitePostInfo(lwAlgoSettings: HybridRecombeeConfiguration | RecombeeConfiguration, context: ResolverContext, skipOnLoadMore = true): Promise<OnsitePostRecommendationsInfo> {
    if (lwAlgoSettings.loadMore && skipOnLoadMore) {
      return {
        curatedPostIds: [],
        stickiedPostIds: [],
        excludedPostFilter: undefined,
      };
    }

    const postPromises =  [curatedPostTerms, stickiedPostTerms]
      .map(terms => viewTermsToQuery("Posts", terms, undefined, context))
      .map(postsQuery => context.Posts.find(postsQuery.selector, postsQuery.options, { _id: 1 }).fetch());

    const [curatedPosts, stickiedPosts] = await Promise.all(postPromises);

    const curatedPostIds = curatedPosts.map(post => post._id);
    const manuallyStickiedPostIds = recommendationsTabManuallyStickiedPostIdsSetting.get();
    const stickiedPostIds = [...manuallyStickiedPostIds, ...stickiedPosts.map(post => post._id)];
    const excludedPostIds = [...curatedPostIds, ...stickiedPostIds];
    const excludedPostFilter = `'itemId' not in {${excludedPostIds.map(id => `"${id}"`).join(', ')}}`;

    return {
      curatedPostIds,
      stickiedPostIds,
      excludedPostFilter,
    };
  },

  convertHybridToRecombeeArgs(hybridArgs: HybridRecombeeConfiguration, hybridArm: keyof HybridArmsConfig, filter?: string) {
    const { loadMore, userId, hybridScenarios, ...rest } = hybridArgs;

    const scenario = hybridScenarios[hybridArm];

    const isConfigurable = hybridArm === 'configurable';
    const clientConfig: Partial<Omit<HybridRecombeeConfiguration,"loadMore"|"userId">> = isConfigurable ? rest : {rotationRate: 0.1, rotationTime: 12};
    const prevRecommIdIndex = isConfigurable ? 0 : 1;
    const loadMoreConfig = loadMore
      ? { loadMore: { prevRecommId: loadMore.prevRecommIds[prevRecommIdIndex] } }
      : {};

    return {
      userId,
      ...clientConfig,
      filter,
      scenario,
      ...loadMoreConfig
    };
  },

  interleaveHybridRecommendedPosts(recommendedPosts: RecommendedPost[]) {
    // In the case where we're interleaving posts recommended by a mix of recombee and our own system, those not recommended by recombee won't have a recommId
    // This will need to change if we ever have e.g. multiple internal sources which we want to interleave
    const recommendationGroupedPosts = groupBy(recommendedPosts, (result) => result.recommId ?? 'none');
    let weights = Object.entries(recommendationGroupedPosts).map(([recommId, posts]) => [recommId, posts.length / recommendedPosts.length] as const);

    const interleavedPosts: RecommendedPost[] = [];

    while (interleavedPosts.length < recommendedPosts.length) {
      // Calculate current total weight (since it changes when we remove a recommId group for running out of posts)
      const totalWeight = weights.reduce((sum, [_, weight]) => sum + weight, 0);

      // Weighted random selection of next recommId to pick a post from
      let randomWeight = Math.random() * totalWeight;
      let selectedRecommId: string | undefined;
      for (const [recommId, recommIdWeight] of weights) {
        randomWeight -= recommIdWeight;
        if (randomWeight <= 0) {
          selectedRecommId = recommId;
          break;
        }
      }

      // Safety check, though selectedGroup should always be defined here
      if (!selectedRecommId) continue;

      // Add next post from the selected group to the interleaved array
      const postsWithRecommId = recommendationGroupedPosts[selectedRecommId];
      const nextPost = postsWithRecommId.shift();
      if (!nextPost) {
        // We shouldn't ever get here, but just in case
        continue;
      } else {
        interleavedPosts.push(nextPost);

        // Update the group's state: remove it if it's out of posts
        if (postsWithRecommId.length === 0) {
          weights = weights.filter(([recommId]) => recommId !== selectedRecommId);
        }  
      }
    }

    return interleavedPosts;
  },

  getNativeLatestPostsPromise(hybridArgs: HybridRecombeeConfiguration, limit: number, fixedArmCount: number, excludedPostIds: string[], context: ResolverContext) {
    const loadMoreCount = hybridArgs.loadMore?.loadMoreCount;
    const loadMoreCountArg = loadMoreCount ? { offset: loadMoreCount * fixedArmCount } : {};
    // Unfortunately, passing in an empty array translates to something like `NOT (_id IN (SELECT NULL::VARCHAR(27)))`, which filters out everything
    const notPostIdsArg = excludedPostIds.length ? { notPostIds: excludedPostIds } : {};
    const postsTerms: PostsViewTerms = {
      view: "magic",
      forum: true,
      limit,
      ...notPostIdsArg,
      ...loadMoreCountArg,
    };

    const postsQuery = viewTermsToQuery('Posts', postsTerms, undefined, context);

    return performQueryFromViewParameters(context.Posts, postsTerms, postsQuery);
  },

  getCuratedPostsReadStatuses(lwAlgoSettings: HybridRecombeeConfiguration | RecombeeConfiguration, curatedPostIds: string[], userId: string, context: ResolverContext) {
    return lwAlgoSettings.loadMore
      ? Promise.resolve([])
      : context.ReadStatuses.find({ postId: { $in: curatedPostIds.slice(1) }, userId, isRead: true }).fetch();
  },

  assignRecommendationResultMetadata({ post, recommendationIdTuples, stickiedPostIds, curatedPostIds }: AssignRecommendationResultMetadataArgs) {
    // _id isn't going to be filtered out by `accessFilterMultiple`
    const postId = post._id!;
    const [_, recommId, scenario] = recommendationIdTuples.find(([id]) => id === postId) ?? [];

    if (recommId) {
      return { post, recommId, scenario };
    } else {
      const stickied = stickiedPostIds.includes(postId);
      const curated = curatedPostIds.includes(postId);
      
      if (stickied) {
        post.sticky = true;
      }

      return { post, curated, stickied };
    }
  },

  openRecombeeBatchRecsPerfMetric<T extends RecRequest>(firstRequest: T, secondRequest: T) {
    const firstRequestType = firstRequest.constructor.name;

    const opName = (firstRequest instanceof requests.RecommendNextItems || secondRequest instanceof requests.RecommendNextItems)
      ? `batch_${firstRequestType}`
      : `batch_${firstRequestType}_${firstRequest.bodyParameters().scenario ?? 'unknown'}_${secondRequest.bodyParameters().scenario ?? 'unknown'}`;

    return openPerfMetric({
      op_type: 'recombee',
      op_name: opName,
      ...getParentTraceId()
    });
  },

  openRecombeeRecsPerfMetric(recombeeRequest: RecRequest) {
    const requestType = recombeeRequest.constructor.name;

    const opName = recombeeRequest instanceof requests.RecommendNextItems
      ? `batch_${requestType}`
      : `batch_${requestType}_${recombeeRequest.bodyParameters().scenario ?? 'unknown'}`;

    return openPerfMetric({
      op_type: 'recombee',
      op_name: opName,
      ...getParentTraceId()
    });
  },
};

const curatedPostTerms: PostsViewTerms = {
  view: 'curated',
  limit: 3,
};

const recombeeApi = {
  async getRecommendationsForUser(userId: string, count: number, lwAlgoSettings: RecombeeRecommendationArgs, context: ResolverContext) {
    const client = getRecombeeClientOrThrow();

    const {
      curatedPostIds,
      stickiedPostIds,
      excludedPostFilter
    } = await helpers.getOnsitePostInfo(lwAlgoSettings, context);

    const curatedPostReadStatuses = await (
      lwAlgoSettings.loadMore
        ? Promise.resolve([])
        : context.ReadStatuses.find({ postId: { $in: curatedPostIds.slice(1) }, userId, isRead: true }).fetch()
    );

    const includedCuratedPostIds = curatedPostIds.filter(id => !curatedPostReadStatuses.find(readStatus => readStatus.postId === id));
    const curatedAndStickiedPostCount = includedCuratedPostIds.length + stickiedPostIds.length;

    const modifiedCount = count - curatedAndStickiedPostCount;
    const recommendationsRequestBody = helpers.createRecommendationsForUserRequest(userId, modifiedCount, { ...lwAlgoSettings, filter: excludedPostFilter });

    // We need the type cast here because recombee's type definitions can't handle inferring response types for union request types, even if they have the same response type
    const recombeeResponse = await client.send(recommendationsRequestBody) as RecommendationResponse;
    const { recomms, recommId } = recombeeResponse;

    const recommendationIdPairs = recomms.map(rec => [rec.id, recommId] as const);
    const recommendedPostIds = recomms.map(({ id }) => id);
    const postIds = [...includedCuratedPostIds, ...stickiedPostIds, ...recommendedPostIds];

    const posts = filterNonnull(await loadByIds(context, 'Posts', postIds));
    const filteredPosts = await accessFilterMultiple(context.currentUser, context.Posts, posts, context)

    const mappedPosts = filteredPosts.map(post => {
      // _id isn't going to be filtered out by `accessFilterMultiple`
      const postId = post._id!;
      const recommId = recommendationIdPairs.find(([id]) => id === postId)?.[1];
      if (recommId) {
        return { post, recommId, scenario: lwAlgoSettings.scenario };
      } else {
        return {
          post,
          curated: curatedPostIds.includes(postId),
          stickied: stickiedPostIds.includes(postId)  
        };
      }
    });

    return mappedPosts;
  },

  async getHybridRecommendationsForUser(userId: string, count: number, lwAlgoSettings: HybridRecombeeConfiguration, context: ResolverContext) {
    const client = getRecombeeClientOrThrow();

    const { curatedPostIds, stickiedPostIds, excludedPostFilter } = await helpers.getOnsitePostInfo(lwAlgoSettings, context, false);

    const curatedPostReadStatuses = await helpers.getCuratedPostsReadStatuses(lwAlgoSettings, curatedPostIds, userId, context);
    const includedCuratedPostIds = curatedPostIds.filter(id => !curatedPostReadStatuses.find(readStatus => readStatus.postId === id));
    const excludeFromLatestPostIds = [...includedCuratedPostIds, ...stickiedPostIds];
    // We only want to fetch the curated and stickied posts if this is the first load, not on any load more
    const includedCuratedAndStickiedPostIds = lwAlgoSettings.loadMore
      ? []
      : excludeFromLatestPostIds;

    const curatedAndStickiedPostCount = includedCuratedAndStickiedPostIds.length;
    const modifiedCount = count - curatedAndStickiedPostCount;
    const split = 0.5;
    const configurableArmCount = Math.floor(modifiedCount * split);
    const fixedArmCount = modifiedCount - configurableArmCount;
    const hybridArmCounts = {
      configurable: configurableArmCount,
      fixed: fixedArmCount,
    };

    const initiateDeferredPostsPromise = () => helpers.getNativeLatestPostsPromise(lwAlgoSettings, modifiedCount, fixedArmCount, excludeFromLatestPostIds, context);

    let deferredPostsPromise: Promise<DbPost[]> | undefined = undefined;
    let recombeeResponsesWithScenario;
    if (lwAlgoSettings.hybridScenarios.fixed === 'forum-classic') {
      // We shoot off the promise to get our own latest posts now but don't block on it
      // There are plenty of longer-running operations we need to wait on before we need these posts, so we can hold off on awaiting this until those are all done
      deferredPostsPromise = initiateDeferredPostsPromise();
      
      const recombeeRequestSettings = helpers.convertHybridToRecombeeArgs(lwAlgoSettings, 'configurable', excludedPostFilter);
      const recombeeRequest = helpers.createRecommendationsForUserRequest(userId, configurableArmCount, recombeeRequestSettings);

      let recombeeResponse;
      try {
        recombeeResponse = await wrapWithPerfMetric(
          () => client.send(recombeeRequest) as Promise<RecommendationResponse>,
          () => helpers.openRecombeeRecsPerfMetric(recombeeRequest)
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(`Error when fetching Recombee recommendations for scenario ${recombeeRequestSettings.scenario} and userId ${userId}`, { err });
        captureException(err);
      }

      recombeeResponsesWithScenario = recombeeResponse
        ? [{ ...recombeeResponse, scenario: lwAlgoSettings.hybridScenarios.configurable }]
        : [];
    } else {
      const [firstRequest, secondRequest] = (['configurable', 'fixed'] as const)
        .map(hybridArm => [hybridArm, helpers.convertHybridToRecombeeArgs(lwAlgoSettings, hybridArm, excludedPostFilter)] as const)
        .map(([hybridArm, requestSettings]) => helpers.createRecommendationsForUserRequest(userId, hybridArmCounts[hybridArm], requestSettings));

      const batchRequest = helpers.getBatchRequest([firstRequest, secondRequest]);
      
      const batchResponse = await wrapWithPerfMetric(
        () => client.send(batchRequest),
        () => helpers.openRecombeeBatchRecsPerfMetric(firstRequest, secondRequest)
      );

      // When doing batch requests, recombee doesn't throw an error if any or all of the constituent requests return e.g. a 404
      // It returns them in as { json, code } (whereas regular requests just return the object in the `json` field directly, and throw on errors instead)
      const successResponses = helpers.filterSuccessesFromBatchResponse(batchResponse);

      // We need the type cast here because recombee's type definitions don't provide response types for batch requests
      const recombeeResponses = successResponses.map(({ json }) => json as RecommendationResponse);
      recombeeResponsesWithScenario = recombeeResponses.map((response, index) => ({
        ...response,
        scenario: index === 0
          ? lwAlgoSettings.hybridScenarios.configurable
          : lwAlgoSettings.hybridScenarios.fixed
      }));
    }

    // We explicitly avoid deduplicating postIds because we want to see how often the same post is recommended by both arms of the hybrid recommender
    const recommendationIdTuples = recombeeResponsesWithScenario.flatMap(response => response.recomms.map(rec => [rec.id, response.recommId, response.scenario] as const));
    const recommendedPostIds = recommendationIdTuples.map(([id]) => id);
    // The ordering of these post ids is actually important, since it's preserved through all subsequent filtering/mapping
    // It ensures the "curated > stickied > everything else" ordering
    const postIds = [...includedCuratedAndStickiedPostIds, ...recommendedPostIds];
    
    const [orderedPosts, deferredPosts] = await Promise.all([
      loadByIds(context, 'Posts', postIds)
        .then(filterNonnull)
        .then(posts => postIds.map(id => posts.find(post => post._id === id)))
        .then(filterNonnull),
      // Here is where we get the results of the non-awaited request for latest posts
      // Hopefully we don't actually need to wait at all, since the recombee call + fetching all the other posts from the DB should take longer than this request
      // In the case we're making a batch request to recombee, we don't launch the request at the top, since we're only using it as a fallback in case recombee returns an error
      // In those cases, I'd rather just eat the additional latency than be making totally pointless requests to fetch posts from the DB 99%+ of the time
      deferredPostsPromise ?? initiateDeferredPostsPromise()
    ]);

    // We might not get enough posts back from recombee (most likely because of downtime or other request failure)
    // In those cases, fall back to filling in from the latest posts (since we're fetching enough for the entire request, if necessary)
    const intendedNonDeferredPostCount = configurableArmCount + curatedAndStickiedPostCount;
    const missingPostCount = intendedNonDeferredPostCount - orderedPosts.length;
    const topDeferredPosts = deferredPosts.slice(0, fixedArmCount + missingPostCount);

    const filteredPosts = await accessFilterMultiple(context.currentUser, context.Posts, [...orderedPosts, ...topDeferredPosts], context);
    const postsWithMetadata = filteredPosts.map(post => helpers.assignRecommendationResultMetadata({ post, recommendationIdTuples, stickiedPostIds, curatedPostIds }));

    const curatedOrStickiedPosts = postsWithMetadata.filter((result): result is NativeRecommendedPost => !!(result.curated || result.stickied));
    const nativeRecommendedPosts = postsWithMetadata.filter((result): result is NativeRecommendedPost => !(result.curated || result.stickied || result.recommId));
    const recombeeRecommendedPosts = postsWithMetadata.filter((result): result is RecombeeRecommendedPost => !!result.recommId);

    const interleavedRecommendedPosts = helpers.interleaveHybridRecommendedPosts([...nativeRecommendedPosts, ...recombeeRecommendedPosts]);

    return [...curatedOrStickiedPosts, ...interleavedRecommendedPosts];
  },


  async upsertPost(post: DbPost, context: ResolverContext) {
    const client = getRecombeeClientOrThrow();
    const { Tags } = context;

    const tagIds = Object.entries(post.tagRelevance ?? {}).filter(([_, relevance]: [string, number]) => relevance > 0).map(([tagId]) => tagId);
    const tags = filterNonnull(await loadByIds(context, 'Tags', tagIds));

    const request = helpers.createUpsertPostRequest({ post, tags });

    await client.send(request);
  },

  async createReadStatus(readStatus: DbReadStatus) {
    const client = getRecombeeClientOrThrow();
    const request = helpers.createReadStatusRequest(readStatus);
    if (!request) {
      return;
    }

    await client.send(request);
  },

  async createVote(vote: DbVote) {
    const client = getRecombeeClientOrThrow();
    const request = helpers.createVoteRequest(vote);
    if (!request) {
      return;
    }

    await client.send(request);
  },

  async createUser(user: DbUser) {
    const client = getRecombeeClientOrThrow();
    const request = helpers.createUpsertUserDetailsRequest(user);
    await client.send(request);
  }
};

export { helpers as recombeeRequestHelpers, recombeeApi };
