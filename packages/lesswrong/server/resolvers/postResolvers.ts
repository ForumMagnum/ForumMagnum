import { Posts } from '../../server/collections/posts/collection';
import { Comments } from '../../server/collections/comments/collection';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';
import { canUserEditPostMetadata, extractGoogleDocId } from '../../lib/collections/posts/helpers';
import { buildRevision } from '../editor/conversionUtils';
import { twitterBotKarmaThresholdSetting } from '../../lib/instanceSettings';
import { randomId } from '../../lib/random';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';
import { GoogleDocMetadata } from '../collections/revisions/helpers';
import { recombeeApi, recombeeRequestHelpers } from '../recombee/client';
import { RecommendedPost } from '@/lib/recombee/types';
import { HybridRecombeeConfiguration, RecombeeRecommendationArgs } from '../../lib/collections/users/recommendationSettings';
import { userCanDo, userIsAdmin } from '../../lib/vulcan-users/permissions';
import { FilterPostsForReview } from '@/components/bookmarks/ReadHistoryTab';
import gql from "graphql-tag";
import { createPaginatedResolver } from './paginatedResolver';
import { convertImportedGoogleDoc } from '../editor/googleDocUtils';
import { createPost } from '../collections/posts/mutations';
import { createRevision } from '../collections/revisions/mutations';
import { getDefaultViewSelector } from '@/lib/utils/viewUtils';
import { PostsViews } from '@/lib/collections/posts/views';
import { getCollaborativeEditorAccessWithKey } from '@/lib/collections/posts/collabEditingPermissions';
import { getSqlClientOrThrow } from '@/server/sql/sqlClient';
import { getViewablePostsSelector } from '@/server/repos/helpers';
import { getUserDefaultRichTextEditor } from '@/lib/editor/defaultRichTextEditor';
import { resetHocuspocusDocument } from '../hocuspocus/hocuspocusCallbacks';
import { htmlToYjsStateFromHtml } from '../editor/htmlToYjsState';
import jwt from 'jsonwebtoken';

interface PostWithApprovedJargon {
  post: Partial<DbPost>;
  jargonTerms: Partial<DbJargonTerm>[];
}

type GoogleDocExportFormat = 'markdown' | 'zip';

const GOOGLE_DOC_IMPORT_USER_AGENT = 'Mozilla/5.0 (compatible; ForumMagnum/1.0)';

function createGoogleDocImportError(message: string) {
  return Object.assign(new Error(message), { isGoogleDocImportError: true as const });
}

function isGoogleDocImportError(error: unknown): error is Error & { isGoogleDocImportError: true } {
  return error instanceof Error && 'isGoogleDocImportError' in error && error.isGoogleDocImportError === true;
}

function googleDocExportUrl(fileId: string, format: GoogleDocExportFormat) {
  return `https://docs.google.com/document/d/${fileId}/export?format=${format}`;
}

async function fetchGoogleDocExport(fileId: string, format: GoogleDocExportFormat) {
  let response: Response;

  try {
    response = await fetch(googleDocExportUrl(fileId, format), {
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': GOOGLE_DOC_IMPORT_USER_AGENT,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw createGoogleDocImportError('Request timed out while fetching document. Please try again.');
    }

    throw error;
  }

  if (response.status === 404) {
    throw createGoogleDocImportError("Document not found. Please ensure the document is publicly accessible (set to 'Anyone with the link can view')");
  }

  if (response.status === 401 || response.status === 403) {
    throw createGoogleDocImportError("Access denied. Please ensure the document is publicly accessible (set to 'Anyone with the link can view')");
  }

  if (!response.ok) {
    throw createGoogleDocImportError(`Failed to fetch Google Doc export (${response.status})`);
  }

  return response;
}

const {Query: CuratedAndPopularThisWeekQuery, typeDefs: CuratedAndPopularThisWeekTypeDefs } = createPaginatedResolver({
  name: "CuratedAndPopularThisWeek",
  graphQLType: "Post",
  args: { af: "Boolean" },
  callback: async (
    {repos, currentUser, isAF}: ResolverContext,
    limit: number,
    args: { af?: boolean },
  ): Promise<DbPost[]> => {
    const af = args?.af ?? isAF;
    return repos.posts.getCuratedAndPopularPosts({
      currentUser,
      limit,
      af,
    });
  },
});

const {Query: CurationCandidatePostsQuery, typeDefs: CurationCandidatePostsTypeDefs } = createPaginatedResolver({
  name: "CurationCandidatePosts",
  graphQLType: "Post",
  callback: async (
    {repos}: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => repos.posts.getCurationCandidatePosts(limit),
});

const {Query: RecentlyActiveDialoguesQuery, typeDefs: RecentlyActiveDialoguesTypeDefs } = createPaginatedResolver({
  name: "RecentlyActiveDialogues",
  graphQLType: "Post",
  callback: async (
    {repos}: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => repos.posts.getRecentlyActiveDialogues(limit),
  cacheMaxAgeMs: 1000 * 60 * 10, // 10 min
});

const {Query: MyDialoguesQuery, typeDefs: MyDialoguesTypeDefs } = createPaginatedResolver({
  name: "MyDialogues",
  graphQLType: "Post",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => {
      const {repos, currentUser} = context
      if (!currentUser) return []
      return repos.posts.getMyActiveDialogues(currentUser._id, limit);
    },
  // Caching is not user specific, do not use caching here else you will share users' drafts
  cacheMaxAgeMs: 0, 
});

const {Query: CrossedKarmaThresholdQuery, typeDefs: CrossedKarmaThresholdTypeDefs } = createPaginatedResolver({
  name: "CrossedKarmaThreshold",
  graphQLType: "Post",
  callback: async (
    context: ResolverContext,
    limit: number // This limit is not actually respected
  ): Promise<DbPost[]> => {
      const {repos, currentUser} = context

      if (!currentUser) return []
      if (!userIsAdmin(currentUser)) {
        throw new Error("You must be an admin to use this resolver")
      }

      const threshold = twitterBotKarmaThresholdSetting.get();

      const postIds = await repos.tweets.getUntweetedPostsCrossingKarmaThreshold({ limit, threshold });
      return await Posts.find({ _id: { $in: postIds } }, { sort: { postedAt: -1 } }).fetch();
    },
  cacheMaxAgeMs: 0
});


const {Query: RecombeeLatestPostsQuery, typeDefs: RecombeeLatestPostsTypeDefs } = createPaginatedResolver({
  name: "RecombeeLatestPosts",
  graphQLType: "RecombeeRecommendedPost",
  args: { settings: "JSON" },
  callback: async (
    context: ResolverContext,
    limit: number,
    args: { settings: RecombeeRecommendationArgs }
  ): Promise<RecommendedPost[]> => {
    const recombeeUser = recombeeRequestHelpers.getRecombeeUser(context);

    if (!recombeeUser) {
      throw new Error(`You must be logged in or have a clientId to use Recombee recommendations right now`);
    }

    return await recombeeApi.getRecommendationsForUser(recombeeUser, limit, args.settings, context);
  }
});

const {Query: RecombeeHybridPostsQuery, typeDefs: RecombeeHybridPostsTypeDefs } = createPaginatedResolver({
  name: "RecombeeHybridPosts",
  graphQLType: "RecombeeRecommendedPost",
  args: { settings: "JSON" },
  callback: async (
    context: ResolverContext,
    limit: number,
    args: { settings: HybridRecombeeConfiguration }
  ): Promise<RecommendedPost[]> => {
    const recombeeUser = recombeeRequestHelpers.getRecombeeUser(context);

    if (!recombeeUser) {
      throw new Error(`You must be logged in or have a clientId to use Recombee recommendations right now`);
    }

    return await recombeeApi.getHybridRecommendationsForUser(recombeeUser, limit, args.settings, context);
  }
});

const {Query: PostsWithActiveDiscussionQuery, typeDefs: PostsWithActiveDiscussionTypeDefs } = createPaginatedResolver({
  name: "PostsWithActiveDiscussion",
  graphQLType: "Post",
  callback: async (context, limit): Promise<DbPost[]> => {
    const { currentUser, repos } = context;
    if (!currentUser) {
      throw new Error('You must be logged in to see actively discussed posts.');
    }

    return await repos.posts.getActivelyDiscussedPosts(limit);
  }
});

const {Query: PostsBySubscribedAuthorsQuery, typeDefs: PostsBySubscribedAuthorsTypeDefs } = createPaginatedResolver({
  name: "PostsBySubscribedAuthors",
  graphQLType: "Post",
  callback: async (context, limit): Promise<DbPost[]> => {
    const { currentUser, repos } = context;
    if (!currentUser) {
      throw new Error('You must be logged in to see posts with activity from your subscrptions.');
    }

    return await repos.posts.getPostsFromPostSubscriptions(currentUser._id, limit);
  }
});

const {Query: PostsWithApprovedJargonQuery, typeDefs: PostsWithApprovedJargonTypeDefs } = createPaginatedResolver({
  name: "PostsWithApprovedJargon",
  graphQLType: "PostWithApprovedJargon",
  callback: async (context, limit): Promise<PostWithApprovedJargon[]> => {
    const { repos, currentUser, JargonTerms } = context;
    if (!userIsAdmin(currentUser)) {
      throw new Error("You must be an admin to see posts with approved jargon");
    }

    const postsWithUnfilteredJargon = await repos.posts.getPostsWithApprovedJargon(limit);

    return await Promise.all(postsWithUnfilteredJargon.map(async ({ jargonTerms, ...post }) => ({
      post,
      jargonTerms: await accessFilterMultiple(currentUser, 'JargonTerms', jargonTerms, context)
    })));
  }
});

interface ProfilePostDiamondRow {
  _id: string;
  slug: string;
  date: Date;
  karma: number;
  isReviewWinner: boolean;
  isCurated: boolean;
}

interface ProfileCommentDiamondRow {
  id: string;
  date: Date;
  karma: number;
  postId: string;
}

async function getProfileDiamondPosts(userId: string, limit: number): Promise<{ results: ProfilePostDiamondRow[], totalCount: number }> {
  const db = getSqlClientOrThrow();
  const whereClause = `
    ${getViewablePostsSelector("p")}
    AND (
      p."userId" = $(userId)
      OR p."coauthorUserIds" @> ARRAY[$(userId)]::TEXT[]
    )
    AND p."rejected" IS NOT TRUE
  `;
  const [results, countRow] = await Promise.all([
    db.any<ProfilePostDiamondRow>(`
      -- postResolvers.getProfileDiamondPosts
      SELECT
        p."_id" AS "_id",
        p."slug" AS "slug",
        p."postedAt" AS "date",
        p."baseScore" AS "karma",
        EXISTS(
          SELECT 1
          FROM "ReviewWinners" rw
          WHERE rw."postId" = p."_id"
        ) AS "isReviewWinner",
        p."curatedDate" IS NOT NULL AS "isCurated"
      FROM "Posts" p
      WHERE ${whereClause}
      ORDER BY p."postedAt" DESC
      LIMIT $(limit)
    `, { userId, limit }),
    db.one<{ count: string }>(`
      -- postResolvers.getProfileDiamondPostsCount
      SELECT COUNT(*) AS "count"
      FROM "Posts" p
      WHERE ${whereClause}
    `, { userId }),
  ]);
  return { results, totalCount: parseInt(countRow.count) };
}

async function getProfileDiamondComments(userId: string, limit: number): Promise<{ results: ProfileCommentDiamondRow[], totalCount: number }> {
  const selector = {
    userId,
    postId: { $ne: null },
    postedAt: { $ne: null },
    deletedPublic: false,
    rejected: { $ne: true },
    draft: { $ne: true },
    debateResponse: { $ne: true },
    authorIsUnreviewed: { $ne: true },
  };

  const [comments, totalCount] = await Promise.all([
    Comments.find(
      selector,
      {
        sort: { isPinnedOnProfile: -1, postedAt: -1 },
        limit,
      },
      {
        _id: 1,
        postedAt: 1,
        baseScore: 1,
        postId: 1,
      }
    ).fetch(),
    Comments.find(selector).count(),
  ]);

  const results = comments.map((comment) => {
    if (!comment._id || !comment.postId || !comment.postedAt) return;
    return {
      id: comment._id,
      date: comment.postedAt,
      karma: comment.baseScore ?? 0,
      postId: comment.postId,
    };
  }).filter((comment): comment is ProfileCommentDiamondRow => !!comment);

  return { results, totalCount };
}

export const postGqlQueries = {
  async UserReadHistory(
    root: void,
    args: {
      limit: number | null,
      filter: FilterPostsForReview | null,
      sort: {
        karma?: boolean,
      } | null,
    }, context: ResolverContext) {
    const {currentUser, repos} = context
    if (!currentUser) {
      throw new Error('Must be logged in to view read history')
    }

    const posts = await repos.posts.getReadHistoryForUser(currentUser._id, args.limit ?? 10, args.filter, args.sort)
    const filteredPosts = accessFilterMultiple(currentUser, 'Posts', posts, context)
    return {
      posts: filteredPosts,
    }
  },
  async PostsUserCommentedOn(
    root: void,
    {limit, filter, sort}: { 
      limit: number | null, 
      filter: FilterPostsForReview | null, 
      sort: { karma?: boolean } | null 
    },
    context: ResolverContext,
  ) {
    const {currentUser, repos} = context
    if (!currentUser) {
      throw new Error('Must be logged in to view posts user commented on')
    }

    const posts = await repos.posts.getPostsUserCommentedOn(currentUser._id, limit ?? 20, filter, sort)
    return {
      posts: await accessFilterMultiple(currentUser, 'Posts', posts, context)
    }
  },

  async ProfileDiamondPosts(
    root: void,
    {
      userId,
      limit,
    }: {
      userId: string,
      limit: number,
    },
  ) {
    return await getProfileDiamondPosts(userId, limit);
  },
  async ProfileDiamondComments(
    root: void,
    {
      userId,
      limit,
    }: {
      userId: string,
      limit: number,
    },
  ) {
    return await getProfileDiamondComments(userId, limit);
  },
  async HomepageCommunityEvents(root: void, { limit }: { limit: number }, context: ResolverContext): Promise<HomepageCommunityEventMarkersResult> {
    const { repos } = context
    const events = await repos.posts.getHomepageCommunityEvents(limit)
    return { events }
  },
  async HomepageCommunityEventPosts(root: void, { eventType }: { eventType: string }, context: ResolverContext) {
    const { Posts, currentUser } = context
    const defaultPostSelector = getDefaultViewSelector(PostsViews, context)

    const timeRange = 5 * 30 * 24 * 60 * 60 * 1000 // 5 months
    const posts = await Posts.find({
      ...defaultPostSelector, 
      startTime: { $gt: new Date(), $lt: new Date(Date.now() + timeRange) }, 
      types: { $in: [eventType] }, 
      "googleLocation.geometry.location.lat": { $exists: true },
      "googleLocation.geometry.location.lng": { $exists: true },
    }).fetch()
    const filteredPosts = await accessFilterMultiple(currentUser, 'Posts', posts, context)
    return { posts: filteredPosts }  
  },
  async HocuspocusAuth(root: void, { postId, linkSharingKey }: { postId: string, linkSharingKey: string | null }, context: ResolverContext) {
    const { currentUser, loaders, clientId } = context
    
    const post = await loaders.Posts.load(postId);
    
    const accessLevel = await getCollaborativeEditorAccessWithKey({
      formType: 'edit',
      post,
      user: currentUser,
      context,
      useAdminPowers: true,
      linkSharingKey,
    });
    
    if (accessLevel === 'none') {
      throw new Error('Unauthorized: You do not have access to collaborate on this post');
    }
    
    const token = jwt.sign(
      {
        userId: currentUser?._id ?? clientId,
        displayName: currentUser?.displayName ?? 'Anonymous',
        postId,
        accessLevel,
      },
      process.env.HOCUSPOCUS_JWT_SECRET!,
      { expiresIn: '1h' }
    );

    return { token };
  },
  ...CuratedAndPopularThisWeekQuery,
  ...RecentlyActiveDialoguesQuery,
  ...MyDialoguesQuery,
  ...CrossedKarmaThresholdQuery,
  ...RecombeeLatestPostsQuery,
  ...RecombeeHybridPostsQuery,
  ...PostsWithActiveDiscussionQuery,
  ...PostsBySubscribedAuthorsQuery,
  ...PostsWithApprovedJargonQuery,
  ...CurationCandidatePostsQuery,
  async LastCuratedDate(_root: void, _args: {}, context: ResolverContext) {
    return { lastCuratedDate: await context.repos.posts.getLastCuratedDate() };
  },
}

export const postGqlMutations = {
  async ImportGoogleDoc(root: void, { fileUrl, postId }: { fileUrl: string, postId?: string | null }, context: ResolverContext) {
    if (!fileUrl) {
      throw new Error("fileUrl must be given")
    }
    const fileId = extractGoogleDocId(fileUrl)

    if (!fileId) {
      throw new Error(`Could not extract id from google doc url: ${fileUrl}`)
    }

    const { currentUser } = context;
    if (!currentUser) {
      throw new Error('Must be logged in to import google doc')
    }

    if (postId) {
      const post = await Posts.findOne({_id: postId})

      if (!post) {
        throw new Error(`No post with id: ${postId}`)
      }

      if (!canUserEditPostMetadata(currentUser, post)) {
        throw new Error(`User doesn't have permission to edit post with id: ${postId}`)
      }
    }

    let googleDocZipBuffer: Buffer | undefined;

    try {
      const zipResponse = await fetchGoogleDocExport(fileId, 'zip');
      const zipArrayBuffer = await zipResponse.arrayBuffer();
      googleDocZipBuffer = Buffer.from(zipArrayBuffer);
    } catch (error) {
      if (isGoogleDocImportError(error)) {
        throw error;
      }

      if (error instanceof Error) {
        throw new Error(`Failed to import Google Doc: ${error.message}`);
      }

      throw new Error('Failed to import Google Doc');
    }

    if (!googleDocZipBuffer) {
      throw new Error('Failed to import Google Doc zip export');
    }

    const finalPostId = postId ?? randomId()

    // Converting to ckeditor markup does some thing like removing styles to standardise
    // the result, so we always want to do this first before converting to whatever format the user
    // is using
    const importedHtml = await convertImportedGoogleDoc({
      zipBuffer: googleDocZipBuffer,
      postId: finalPostId,
    })
    const commitMessage = `[Google Doc import]`
    const fallbackRichTextEditorType = getUserDefaultRichTextEditor(currentUser);

    if (postId) {
      const previousRev = await getLatestRev(postId, "contents", context)
      const previousEditorType = previousRev?.originalContents?.type;
      const richTextEditorType = (previousEditorType === "lexical" || previousEditorType === "ckEditorMarkup")
        ? previousEditorType
        : fallbackRichTextEditorType;
      const yjs = richTextEditorType === "lexical"
        ? await htmlToYjsStateFromHtml(importedHtml)
        : null;
      const originalContents = { type: richTextEditorType, data: importedHtml, yjsState: yjs?.yjsState ?? null };
      // Revision type controls whether we increase the major or minor version
      // number; if we increase the major version number it flags it to
      // end-users and shows a version-history dropdown. This was built
      // specifically for Sequences posts which had an editing pass long after
      // the fact and doesn't make sense for Docs import, which usually happens
      // before the post is undrafted for the first time.
      const revisionType = "minor"

      const newRevision: Partial<DbRevision> = {
        ...(await buildRevision({
          originalContents,
          currentUser,
          context
        })),
        documentId: postId,
        draft: true,
        fieldName: "contents",
        collectionName: "Posts",
        version: getNextVersion(previousRev, revisionType, true),
        updateType: revisionType,
        commitMessage,
        changeMetrics: htmlToChangeMetrics(previousRev?.html || "", importedHtml),
      };

      await createRevision({ data: newRevision }, context);

      if (richTextEditorType === "lexical" && yjs) {
        await resetHocuspocusDocument(`post-${postId}`, yjs.yjsBinary);
      }

      return await Posts.findOne({_id: postId})
    } else {
      const yjs = fallbackRichTextEditorType === "lexical"
        ? await htmlToYjsStateFromHtml(importedHtml)
        : null;
      const originalContents = { type: fallbackRichTextEditorType, data: importedHtml, yjsState: yjs?.yjsState ?? null };
      let afField = {};
      if (context.isAF) {
        afField = !userCanDo(currentUser, 'posts.alignment.new')
          ? { suggestForAlignmentUserIds: [currentUser._id] }
          : { af: true };
      }

      // Create a draft post if one doesn't exist. This runs `buildRevision` itself via a callback
      const post = await createPost({
        data: {
          _id: finalPostId,
          userId: currentUser._id,
          title: 'Untitled',
          ...({
            // Contents is a resolver only field, but there is handling for it
            // in `createMutator`/`updateMutator`
            contents: {
              originalContents,
              commitMessage,
            },
          }),
          draft: true,
          ...afField,
        }
      }, context);

      return post;
    }
  },
}

export const postGqlTypeDefs = gql`

  extend type Query {
    UsersReadPostsOfTargetUser(userId: String!, targetUserId: String!, limit: Int): [Post!]
    UserReadHistory(
      limit: Int, 
      filter: PostReviewFilter, 
      sort: PostReviewSort
    ): UserReadHistoryResult

    PostsUserCommentedOn(
      limit: Int, 
      filter: PostReviewFilter, 
      sort: PostReviewSort
    ): UserReadHistoryResult

    ProfileDiamondPosts(userId: String!, limit: Int!): ProfileDiamondPostsResult!
    ProfileDiamondComments(userId: String!, limit: Int!): ProfileDiamondCommentsResult!

    LastCuratedDate: LastCuratedDateResult!
    HomepageCommunityEvents(limit: Int!): HomepageCommunityEventMarkersResult!
    HomepageCommunityEventPosts(eventType: String!): HomepageCommunityEventPostsResult!
    HocuspocusAuth(postId: String!, linkSharingKey: String): HocuspocusAuth
  }

  extend type Mutation {
    ImportGoogleDoc(fileUrl: String!, postId: String): Post
  }

  type UserReadHistoryResult {
    posts: [Post!]
  }
  type PostsUserCommentedOnResult {
    posts: [Post!]
  }
  type LastCuratedDateResult {
    lastCuratedDate: Date
  }

  input PostReviewFilter {
    startDate: Date
    endDate: Date
    minKarma: Int
    showEvents: Boolean
  }

  input PostReviewSort {
    karma: Boolean
  }

  type RecombeeRecommendedPost {
    post: Post!
    scenario: String
    recommId: String
    generatedAt: Date
    curated: Boolean
    stickied: Boolean
  }

  type VertexRecommendedPost {
    post: Post!
    attributionId: String
  }

  type ProfileDiamondPostsResult {
    results: [ProfilePostDiamond!]!
    totalCount: Int
  }

  type ProfileDiamondCommentsResult {
    results: [ProfileCommentDiamond!]!
    totalCount: Int
  }

  type ProfilePostDiamond {
    _id: String!
    slug: String!
    date: Date!
    karma: Int!
    isReviewWinner: Boolean!
    isCurated: Boolean!
  }

  type ProfileCommentDiamond {
    id: String!
    date: Date!
    karma: Int!
    postId: String!
  }

  type PostWithApprovedJargon {
    post: Post!
    jargonTerms: [JargonTerm!]!
  }
  
  type HomepageCommunityEventMarker {
    _id: String!
    lat: Float!
    lng: Float!
    types: [String!]
  }
  type HomepageCommunityEventMarkersResult {
    events: [HomepageCommunityEventMarker!]!
  }
  type HomepageCommunityEventPostsResult {
    posts: [Post!]!
  }
  type HocuspocusAuth {
    token: String!
  }
  ${CuratedAndPopularThisWeekTypeDefs}
  ${RecentlyActiveDialoguesTypeDefs}
  ${MyDialoguesTypeDefs}
  ${CrossedKarmaThresholdTypeDefs}
  ${RecombeeLatestPostsTypeDefs}
  ${RecombeeHybridPostsTypeDefs}
  ${PostsWithActiveDiscussionTypeDefs}
  ${PostsBySubscribedAuthorsTypeDefs}
  ${PostsWithApprovedJargonTypeDefs}
  ${CurationCandidatePostsTypeDefs}
`
