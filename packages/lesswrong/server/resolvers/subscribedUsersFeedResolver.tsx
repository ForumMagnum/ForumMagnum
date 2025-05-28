import { loadByIds } from "../../lib/loaders";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import { unflattenComments, flattenCommentBranch } from "@/lib/utils/unflatten";
import keyBy from "lodash/keyBy";
import sortBy from "lodash/sortBy";
import filter from "lodash/fp/filter";
import type { PostAndCommentsResultRow } from "../repos/PostsRepo";
import gql from "graphql-tag";

function ensureHasId<T extends DbObject>(record: Partial<T>): record is Partial<T> & HasIdType {
  return !!record._id;
}

function getPostComments(postAndCommentsRow: PostAndCommentsResultRow, commentsById: Record<string, Partial<DbComment> & HasIdType>) {
  return filterNonnull(postAndCommentsRow.fullCommentTreeIds?.map(commentId => commentsById[commentId]) ?? []);
}

/**
 * Return the ids for comments which, for each separate branch in a given tree, are the most recent comment by a user you're subscribed to, in that branch.
 * Each branch should have zero or one comment IDs returned.
 */
function getExpandedCommentIds(postAndCommentsRow: PostAndCommentsResultRow, commentsById: Record<string, Partial<DbComment> & HasIdType>) {
  const expansionCandidateIds = new Set(postAndCommentsRow.commentIds);
  const allPostComments = getPostComments(postAndCommentsRow, commentsById);
  const commentsTree = unflattenComments(allPostComments);
  
  const expandCommentIds: string[] = [];

  for (let commentNode of commentsTree) {
    // Get the entire "branch" of comments as a flattened list, sorted by most recent comments first
    const commentBranch = sortBy(flattenCommentBranch(commentNode), 'postedAt').reverse();
    const commentToExpand = commentBranch.find(({ _id }) => expansionCandidateIds.has(_id));
    if (commentToExpand) {
      expandCommentIds.push(commentToExpand._id);
    }
  }

  return expandCommentIds;
}

export const subscribedUsersFeedGraphQLTypeDefs = gql`
  type SubscribedPostAndComments {
    _id: String!
    post: Post!
    comments: [Comment!]
    expandCommentIds: [String!]
    postIsFromSubscribedUser: Boolean!
  }
  type SubscribedFeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [SubscribedFeedEntry!]
  }
  enum SubscribedFeedEntryType {
    postCommented
  }
  type SubscribedFeedEntry {
    type: SubscribedFeedEntryType!
    postCommented: SubscribedPostAndComments
  }
  extend type Query {
    SubscribedFeed(
      limit: Int,
      cutoff: Date,
      offset: Int,
      af: Boolean
    ): SubscribedFeedQueryResults!
  }
`

export const subscribedUsersFeedGraphQLQueries = {
  SubscribedFeed: async (_root: void, args: any, context: ResolverContext) => {
    const {limit, cutoff, offset, ...rest} = args;

    const currentUser = context.currentUser;
    if (!currentUser) throw new Error("Must be logged in");

    const postsAndCommentsAll = await context.repos.posts.getPostsAndCommentsFromSubscriptions(currentUser._id, 30);
    const postsAndComments = postsAndCommentsAll.slice(offset, (offset??0)+limit);
    const isLastPage = postsAndComments.length < limit;
    const lastFeedItem = postsAndComments.at(-1);
    const nextCutoff = isLastPage ? null : (lastFeedItem?.last_commented ?? lastFeedItem?.postedAt ?? null);
    
    const postIds: string[] = filterNonnull(postsAndComments.map(row => row.postId));
    const commentIds: string[] = filterNonnull(postsAndComments.flatMap(row => row.fullCommentTreeIds ?? []));
    
    const [posts, comments] = await Promise.all([
      loadByIds(context, "Posts", postIds)
        .then(posts => accessFilterMultiple(currentUser, 'Posts', posts, context))
        .then(filterNonnull)
        .then(filter(ensureHasId)),
      loadByIds(context, "Comments", commentIds)
        .then(comments => accessFilterMultiple(currentUser, 'Comments', comments, context))
        .then(filterNonnull)
        .then(filter(ensureHasId)),
    ]);

    const postsById = keyBy(posts, p=>p._id);
    const commentsById = keyBy(comments, c=>c._id);
    
    return {
      __typename: "SubscribedFeedQueryResults",
      cutoff: nextCutoff,
      endOffset: (offset??0)+postsAndComments.length,
      results: postsAndComments.map(postAndCommentsRow => {
        const allPostComments = getPostComments(postAndCommentsRow, commentsById);
        const expandCommentIds = getExpandedCommentIds(postAndCommentsRow, commentsById);

        return {
          type: "postCommented",
          postCommented: {
            _id: postAndCommentsRow.postId,
            post: postsById[postAndCommentsRow.postId],
            postIsFromSubscribedUser: !!postAndCommentsRow.subscribedPosts,
            comments: allPostComments,
            expandCommentIds
          }
        };
      })
    };
  }
}
