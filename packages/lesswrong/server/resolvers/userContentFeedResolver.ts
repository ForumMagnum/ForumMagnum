import gql from 'graphql-tag';
import { mergeFeedQueries, viewBasedSubquery } from '../utils/feedUtil';
import { Posts } from '../collections/posts/collection';
import { Comments } from '../collections/comments/collection';
import { viewFieldNullOrMissing } from '@/lib/utils/viewConstants';

export const userContentFeedGraphQLTypeDefs = gql`
  type UserContentFeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [UserContentFeedEntry!]
  }
  enum UserContentFeedEntryType {
    profileComment
    shortformComment
    userPost
  }
  type UserContentFeedEntry {
    type: UserContentFeedEntryType!
    profileComment: Comment
    shortformComment: Comment
    userPost: Post
  }
  extend type Query {
    UserContentFeed(
      userId: String!
      limit: Int
      cutoff: Date
      offset: Int
      sortBy: String
      filter: String
    ): UserContentFeedQueryResults!
  }
`;

export const userContentFeedGraphQLQueries = {
  UserContentFeed: async (_root: void, args: { userId: string; limit?: number; cutoff?: Date; offset?: number; sortBy?: string; filter?: string }, context: ResolverContext) => {
    const { userId, limit = 20, cutoff, offset, filter = "all" } = args;

    const skipPosts = filter === 'comments';
    const skipProfileComments = filter === 'posts' || filter === 'quickTakes';
    const skipShortform = filter === 'posts';

    const result = await mergeFeedQueries<Date>({
      limit,
      cutoff,
      offset,
      sortDirection: "desc",
      subqueries: [
        // Posts by the user. Override default view restrictions on shortform,
        // groupId, hiddenRelatedQuestion, and rejected with null so they're
        // removed after merging (null is treated as "allow any" by
        // replaceSpecialFieldSelectors). We use null instead of viewFieldAllowAny
        // because viewFieldAllowAny is an object that gets deep-merged incorrectly
        // with other object-valued selectors like rejected: {$ne: true}.
        !skipPosts ? viewBasedSubquery({
          type: "userPost",
          collection: Posts,
          sortField: "postedAt",
          context,
          includeDefaultSelector: true,
          selector: {
            userId: null,
            hiddenRelatedQuestion: null,
            shortform: null,
            groupId: null,
            rejected: null,
            $or: [{userId}, {coauthorUserIds: userId}],
          },
        }) : null,

        // Non-shortform comments (and shortform replies) by the user
        !skipProfileComments ? viewBasedSubquery({
          type: "profileComment",
          collection: Comments,
          sortField: "postedAt",
          context,
          includeDefaultSelector: true,
          selector: {
            userId,
            deletedPublic: false,
            // Exclude top-level shortform comments (they come from the shortform subquery)
            $or: [
              { shortform: { $ne: true } },
              { parentCommentId: { $ne: null } },
            ],
          },
        }) : null,

        // Top-level shortform comments by the user
        !skipShortform ? viewBasedSubquery({
          type: "shortformComment",
          collection: Comments,
          sortField: "postedAt",
          context,
          includeDefaultSelector: true,
          selector: {
            userId,
            shortform: true,
            deleted: false,
            parentCommentId: viewFieldNullOrMissing,
          },
        }) : null,
      ],
    });

    return {
      __typename: "UserContentFeedQueryResults",
      ...result,
    };
  },
};
