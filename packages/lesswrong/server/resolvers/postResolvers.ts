import { FilterPostsForReview } from '@/components/bookmarks/ReadHistoryTab';
import { drive } from "@googleapis/drive";
import { canUserEditPostMetadata, extractGoogleDocId } from '../../lib/collections/posts/helpers';
import { HybridRecombeeConfiguration, RecombeeRecommendationArgs } from '../../lib/collections/users/recommendationSettings';
import { isAF, twitterBotKarmaThresholdSetting } from '../../lib/instanceSettings';
import { randomId } from '../../lib/random';
import { accessFilterMultiple } from '../../lib/utils/schemaUtils';
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../../lib/vulcan-lib/graphql";
import { userCanDo, userIsAdmin } from '../../lib/vulcan-users/permissions';
import { Posts } from '../../server/collections/posts/collection';
import Revisions from '../../server/collections/revisions/collection';
import { GoogleDocMetadata } from '../collections/revisions/helpers';
import { convertImportedGoogleDoc } from '../editor/googleDocUtils';
import { buildRevision } from '../editor/make_editable_callbacks';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';
import { googleVertexApi } from '../google-vertex/client';
import { postIsCriticism } from '../languageModels/criticismTipsBot';
import { canAccessGoogleDoc, getGoogleDocImportOAuthClient } from '../posts/googleDocImport';
import { RecommendedPost, recombeeApi, recombeeRequestHelpers } from '../recombee/client';
import { createMutator } from "../vulcan-lib/mutators";
import { createPaginatedResolver } from './paginatedResolver';

export type PostIsCriticismRequest = {
  _id?: string,
  title: string,
  contentType: string,
  body: string
}

addGraphQLResolvers({
  Query: {
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

    async PostIsCriticism(root: void, { args }: { args: PostIsCriticismRequest }, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Must be logged in to check post')
      }

      return await postIsCriticism(args, currentUser._id)
    },
    async DigestPosts(root: void, {num}: {num: number}, context: ResolverContext) {
      const { repos } = context
      return await repos.posts.getPostsForOnsiteDigest(num)
    },
    async DigestPlannerData(root: void, {digestId, startDate, endDate}: {digestId: string, startDate: Date, endDate: Date}, context: ResolverContext) {
      const { currentUser, repos } = context
      if (!currentUser || !currentUser.isAdmin) {
        throw new Error('Permission denied')
      }
      const eligiblePosts = await repos.posts.getEligiblePostsForDigest(digestId, startDate, endDate)
      if (!eligiblePosts.length) return []

      // TODO: finish implementing this once we figure out what to do with it
      // const votesRepo = new VotesRepo()
      // const votes = await votesRepo.getDigestPlannerVotesForPosts(eligiblePosts.map(p => p._id))
      // console.log('DigestPlannerData votes', votes)

      return eligiblePosts.map(post => {
        // const postVotes = votes.find(v => v.postId === post._id)
        // const rating = postVotes ?
        //   Math.round(
        //     ((postVotes.smallUpvoteCount + 2 * postVotes.bigUpvoteCount) - (postVotes.smallDownvoteCount / 2 + postVotes.bigDownvoteCount)) / 10
        //   ) : 0

        return {
          post,
          digestPost: {
            _id: post.digestPostId,
            emailDigestStatus: post.emailDigestStatus,
            onsiteDigestStatus: post.onsiteDigestStatus
          },
          rating: 0
        }
      })
    },
    async CanAccessGoogleDoc(root: void, { fileUrl }: { fileUrl: string }, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        return null;
      }

      return canAccessGoogleDoc(fileUrl)
    },
  },
  Mutation: {
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

      const oauth2Client = await getGoogleDocImportOAuthClient();

      const googleDrive = drive({
        version: "v3",
        auth: oauth2Client,
      });

      // Retrieve the file's metadata to get the name
      const fileMetadata = await googleDrive.files.get({
        fileId,
        fields: 'id, name, description, version, createdTime, modifiedTime, size'
      });

      const docMetadata = fileMetadata.data as GoogleDocMetadata;

      const fileContents = await googleDrive.files.export(
        {
          fileId,
          mimeType: "text/html",
        },
        { responseType: "text" }
      );

      const html = fileContents.data as string;

      if (!html || !docMetadata) {
        throw new Error("Unable to import google doc")
      }

      const finalPostId = postId ?? randomId()
      // Converting to ckeditor markup does some thing like removing styles to standardise
      // the result, so we always want to do this first before converting to whatever format the user
      // is using
      const ckEditorMarkup = await convertImportedGoogleDoc({ html, postId: finalPostId })
      const commitMessage = `[Google Doc import] Last modified: ${docMetadata.modifiedTime}, Name: "${docMetadata.name}"`
      const originalContents = {type: "ckEditorMarkup", data: ckEditorMarkup}

      if (postId) {
        const previousRev = await getLatestRev(postId, "contents", context)
        const revisionType = "major"

        const newRevision: Partial<DbRevision> = {
          ...(await buildRevision({
            originalContents,
            currentUser,
            context,
          })),
          documentId: postId,
          draft: true,
          fieldName: "contents",
          collectionName: "Posts",
          version: getNextVersion(previousRev, revisionType, true),
          updateType: revisionType,
          commitMessage,
          changeMetrics: htmlToChangeMetrics(previousRev?.html || "", html),
          googleDocMetadata: docMetadata
        };

        await createMutator({
          collection: Revisions,
          document: newRevision,
          validate: false,
        });

        return await Posts.findOne({_id: postId})
      } else {
        let afField: Partial<ReplaceFieldsOfType<DbPost, EditableFieldContents, EditableFieldInsertion>> = {};
        if (isAF) {
          afField = !userCanDo(currentUser, 'posts.alignment.new')
            ? { suggestForAlignmentUserIds: [currentUser._id] }
            : { af: true };
        }

        // Create a draft post if one doesn't exist. This runs `buildRevision` itself via a callback
        const { data: post } = await createMutator({
          collection: Posts,
          document: {
            _id: finalPostId,
            userId: currentUser._id,
            title: docMetadata.name,
            ...({
              // Contents is a resolver only field, but there is handling for it
              // in `createMutator`/`updateMutator`
              contents: {
                originalContents,
                commitMessage,
                googleDocMetadata: docMetadata
              },
            }),
            draft: true,
            ...afField,
          },
          currentUser,
          validate: false,
        })

        return post;
      }
    },
  }
})

addGraphQLQuery("UsersReadPostsOfTargetUser(userId: String!, targetUserId: String!, limit: Int): [Post!]");

addGraphQLSchema(`
  type UserReadHistoryResult {
    posts: [Post!]
  }
`)
addGraphQLSchema(`
  type PostsUserCommentedOnResult {
    posts: [Post!]
  }
`);
addGraphQLSchema(`
  input PostReviewFilter {
    startDate: Date
    endDate: Date
    minKarma: Int
    showEvents: Boolean
  }

  input PostReviewSort {
    karma: Boolean
  }
`)

addGraphQLQuery(`
  UserReadHistory(
    limit: Int, 
    filter: PostReviewFilter, 
    sort: PostReviewSort
  ): UserReadHistoryResult
`)

addGraphQLQuery(`
  PostsUserCommentedOn(
    limit: Int, 
    filter: PostReviewFilter, 
    sort: PostReviewSort
  ): UserReadHistoryResult
`)

addGraphQLQuery('PostIsCriticism(args: JSON): Boolean')

addGraphQLSchema(`
  type DigestPlannerPost {
    post: Post
    digestPost: DigestPost
    rating: Int
  }
`)
addGraphQLQuery('DigestPlannerData(digestId: String, startDate: Date, endDate: Date): [DigestPlannerPost]')
addGraphQLQuery('DigestPosts(num: Int): [Post]')

addGraphQLQuery("CanAccessGoogleDoc(fileUrl: String!): Boolean");
addGraphQLMutation("ImportGoogleDoc(fileUrl: String!, postId: String): Post");

createPaginatedResolver({
  name: "DigestHighlights",
  graphQLType: "Post",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => context.repos.posts.getDigestHighlights({limit}),
});

createPaginatedResolver({
  name: "DigestPostsThisWeek",
  graphQLType: "Post",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => context.repos.posts.getTopWeeklyDigestPosts(limit),
  cacheMaxAgeMs: 1000 * 60 * 60, // 1 hour
});

createPaginatedResolver({
  name: "CuratedAndPopularThisWeek",
  graphQLType: "Post",
  callback: async (
    {repos, currentUser}: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => repos.posts.getCuratedAndPopularPosts({
    currentUser,
    limit,
  }),
});

createPaginatedResolver({
  name: "RecentlyActiveDialogues",
  graphQLType: "Post",
  callback: async (
    {repos}: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => repos.posts.getRecentlyActiveDialogues(limit),
  cacheMaxAgeMs: 1000 * 60 * 10, // 10 min
});

createPaginatedResolver({
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

addGraphQLSchema(`
  type RecombeeRecommendedPost {
    post: Post!
    scenario: String
    recommId: String
    generatedAt: Date
    curated: Boolean
    stickied: Boolean
  }
`);

createPaginatedResolver({
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

createPaginatedResolver({
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

createPaginatedResolver({
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

createPaginatedResolver({
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

addGraphQLSchema(`
  type VertexRecommendedPost {
    post: Post!
    attributionId: String
  }
`);

interface VertexRecommendedPost {
  post: Partial<DbPost>;
  attributionId?: string | null;
}

createPaginatedResolver({
  name: "GoogleVertexPosts",
  graphQLType: "VertexRecommendedPost",
  args: { settings: "JSON" },
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<VertexRecommendedPost[]> => {
    const { currentUser } = context;

    if (!currentUser) {
      throw new Error(`You must logged in to use Google Vertex recommendations right now`);
    }

    return await googleVertexApi.getRecommendations(limit, context);
  }
});

createPaginatedResolver({
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

addGraphQLSchema(`
  type PostWithApprovedJargon {
    post: Post!
    jargonTerms: [JargonTerm!]
  }
`);

interface PostWithApprovedJargon {
  post: Partial<DbPost>;
  jargonTerms: Partial<DbJargonTerm>[];
}

createPaginatedResolver({
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
