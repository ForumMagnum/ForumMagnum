import { mergeFeedQueries, viewBasedSubquery } from "../utils/feedUtil";
import Comments from "../collections/comments/collection";
import Posts from "../collections/posts/collection";
import gql from 'graphql-tag';

export const givingSeasonTagFeedGraphQLTypeDefs = gql`
  type GivingSeasonTagFeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [GivingSeasonTagFeedEntryType!]
  }
  type GivingSeasonTagFeedEntryType {
    type: String!
    newPost: Post
    newComment: Comment
  }
  extend type Query {
    GivingSeason2025DonationTotal: Float!
    GivingSeasonTagFeed(
      limit: Int,
      cutoff: Date,
      offset: Int,
      tagId: String!,
    ): GivingSeasonTagFeedQueryResults!
  }
`;

export const givingSeasonTagFeedGraphQLQueries = {
  GivingSeason2025DonationTotal: (
    _root: void,
    _args: {},
    context: ResolverContext,
  ) => context.repos.databaseMetadata.getGivingSeason2025DonationTotal(),
  GivingSeasonTagFeed: async (
    _root: void,
    {limit = 4, cutoff, offset, tagId}: {
      limit?: number,
      cutoff?: Date,
      offset?: number,
      tagId: string,
    },
    context: ResolverContext,
  ) => {
    const postIds = await context.repos.posts.getViewablePostsIdsWithTag(tagId);
    return mergeFeedQueries<Date>({
      limit,
      cutoff,
      offset,
      subqueries: [
        viewBasedSubquery({
          type: "newPost",
          collection: Posts,
          sortField: "postedAt",
          context,
          selector: {
            _id: {$in: postIds},
            baseScore: {$gt: 0},
          },
          includeDefaultSelector: true,
        }),
        viewBasedSubquery({
          type: "newComment",
          collection: Comments,
          sortField: "postedAt",
          context,
          selector: {
            postId: {$in: postIds},
            baseScore: {$gt: 0},
          },
          includeDefaultSelector: true,
        }),
      ],
    });
  },
};
