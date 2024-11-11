import { Posts } from "@/lib/collections/posts";
import { Comments } from "@/lib/collections/comments";
import { addGraphQLQuery, addGraphQLResolvers } from "@/lib/vulcan-lib";
import {
  defineFeedResolver,
  mergeFeedQueries,
  viewBasedSubquery,
} from "../utils/feedUtil";

addGraphQLResolvers({
  Query: {
    GivingSeason2024DonationTotal: (
      _root: void,
      _args: {},
      context: ResolverContext,
    ) => context.repos.databaseMetadata.getGivingSeason2024DonationTotal(),
  },
});

addGraphQLQuery("GivingSeason2024DonationTotal: Float!");

defineFeedResolver<Date>({
  name: "GivingSeasonTagFeed",
  args: "tagId: String!",
  cutoffTypeGraphQL: "Date",
  resultTypesGraphQL: `
    newPost: Post
    newComment: Comment
  `,
  resolver: async ({limit = 3, cutoff, offset, args, context}: {
    limit?: number,
    cutoff?: Date,
    offset?: number,
    args: {tagId: string},
    context: ResolverContext
  }) => {
    const {tagId} = args;
    const relevantPostIds = await context.repos.posts.getViewablePostsIdsWithTag(tagId);
    return mergeFeedQueries<Date>({
      limit,
      cutoff,
      offset,
      subqueries: [
        viewBasedSubquery({
          type: "newPost",
          collection: Posts,
          sortField: "createdAt",
          context,
          selector: {
            _id: {$in: relevantPostIds},
          },
        }),
        viewBasedSubquery({
          type: "newComment",
          collection: Comments,
          sortField: "createdAt",
          context,
          selector: {
            postId: {$in: relevantPostIds},
            baseScore: {$gte: 5},
          },
        }),
      ],
    });
  }
});
