import { mergeFeedQueries, viewBasedSubquery } from "../utils/feedUtil";
import Comments from "../collections/comments/collection";
import Posts from "../collections/posts/collection";
import gql from 'graphql-tag';
import ElectionVotes from "../collections/electionVotes/collection";
import { ACTIVE_DONATION_ELECTION, userIsAllowedToVoteInDonationElection } from "@/lib/givingSeason";
import { instantRunoffAllPossibleResults, IRVote } from "@/lib/givingSeason/instantRunoff";
import { memoizeWithExpiration } from "@/lib/utils/memoizeWithExpiration";

const getVoteCounts = async () => {
  const dbVotes = await ElectionVotes.find({ electionName: ACTIVE_DONATION_ELECTION }).fetch();
  const votes: IRVote[] = dbVotes.map((vote) => vote.vote);
  return instantRunoffAllPossibleResults(votes as IRVote[]);
};

const voteCountsWithCache = memoizeWithExpiration(getVoteCounts, 60 * 1000);

export const givingSeasonGraphQLTypeDefs = gql`
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
    GivingSeason2025VoteCounts: JSON!
    GivingSeasonTagFeed(
      limit: Int,
      cutoff: Date,
      offset: Int,
      tagId: String!,
    ): GivingSeasonTagFeedQueryResults!
    GivingSeason2025MyVote: JSON!
  }
  extend type Mutation {
    GivingSeason2025Vote(vote: JSON!): Boolean!
  }
`;

export const givingSeasonGraphQLQueries = {
  GivingSeason2025DonationTotal: (
    _root: void,
    _args: {},
    context: ResolverContext,
  ) => context.repos.databaseMetadata.getGivingSeason2025DonationTotal(),
  GivingSeason2025VoteCounts: async (
    _root: void,
    _args: {},
    _context: ResolverContext,
  ) => {
    return voteCountsWithCache.get();
  },
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
          sortDirection: "desc",
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
          sortDirection: "desc",
        }),
      ],
    });
  },
  GivingSeason2025MyVote: async (
    _root: void,
    _args: {},
    {currentUser}: ResolverContext,
  ) => {
    if (!currentUser) {
      return {};
    }
    const vote = await ElectionVotes.findOne({
      electionName: ACTIVE_DONATION_ELECTION,
      userId: currentUser?._id,
    });
    return vote?.vote ?? {};
  },
}

export const givingSeasonGraphQLMutations = {
  GivingSeason2025Vote: async (
    _root: void,
    {vote}: {vote: Record<string, number>},
    {currentUser, repos}: ResolverContext,
  ) => {
    const { allowed, reason } = userIsAllowedToVoteInDonationElection(currentUser, new Date());

    if (!allowed || !currentUser) {
      throw new Error(reason || "Unauthorized");
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
      ACTIVE_DONATION_ELECTION,
      currentUser._id,
      vote,
    );
    return true;
  },
}
