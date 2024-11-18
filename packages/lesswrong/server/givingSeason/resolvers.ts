import { Posts } from "@/lib/collections/posts";
import { Comments } from "@/lib/collections/comments";
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers } from "@/lib/vulcan-lib";
import {
  defineFeedResolver,
  mergeFeedQueries,
  viewBasedSubquery,
} from "../utils/feedUtil";
import { eaGivingSeason24ElectionName } from "@/components/forumEvents/votingPortal/hooks";
import ElectionVotes from "@/lib/collections/electionVotes/collection";

addGraphQLResolvers({
  Query: {
    GivingSeason2024DonationTotal: (
      _root: void,
      _args: {},
      context: ResolverContext,
    ) => context.repos.databaseMetadata.getGivingSeason2024DonationTotal(),
    GivingSeason2024MyVote: async (
      _root: void,
      _args: {},
      {currentUser}: ResolverContext,
    ) => {
      if (!currentUser) {
        return {};
      }
      const vote = await ElectionVotes.findOne({
        electionName: eaGivingSeason24ElectionName,
        userId: currentUser?._id,
      });
      return vote?.vote ?? {};
    },
  },
  Mutation: {
    GivingSeason2024Vote: async (
      _root: void,
      {vote}: {vote: Record<string, number>},
      {currentUser, repos}: ResolverContext,
    ) => {
      if (!currentUser || currentUser.banned) {
        throw new Error("Unauthorized");
      }
      if (!vote || typeof vote !== "object") {
        throw new Error("Missing vote");
      }
      const keys = Object.keys(vote);
      if (keys.length > 100) {
        throw new Error("Malformed vote object");
      }
      for (const key of keys) {
        if (!Number.isInteger(vote[key]) || vote[key] < 1 || vote[key] > 100) {
          throw new Error("Malformed vote");
        }
      }
      await repos.electionVotes.upsertVote(
        eaGivingSeason24ElectionName,
        currentUser._id,
        vote,
      );
      return true;
    },
  },
});

addGraphQLQuery("GivingSeason2024DonationTotal: Float!");
addGraphQLQuery("GivingSeason2024MyVote: JSON!");
addGraphQLMutation("GivingSeason2024Vote(vote: JSON!): Boolean");

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
