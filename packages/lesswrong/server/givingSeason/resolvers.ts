import { Posts } from "@/lib/collections/posts";
import { Comments } from "@/lib/collections/comments";
import { addGraphQLQuery, addGraphQLResolvers } from "@/lib/vulcan-lib";
import {
  defineFeedResolver,
  mergeFeedQueries,
  viewBasedSubquery,
} from "../utils/feedUtil";
import ElectionVotes from "@/lib/collections/electionVotes/collection";
import { ACTIVE_ELECTION } from "@/lib/givingSeason";
import { instantRunoffAllPossibleResults, IRVote } from "@/lib/givingSeason/instantRunoff";
import ElectionCandidates from "@/lib/collections/electionCandidates/collection";


const DUMMY_VOTES = [
  // Vote 1
  {
    '6yhJEFA6RidnrEwgk': 1, // TLYCS
    'hpJattsZrqyNpdnZa': 2, // Animal Welfare Fund
    'NwhdDs8rSkafxFda2': 3, // GiveDirectly
  },
  // Vote 2
  {
    'aWQ9EHkcqFJ5tQ3HQ': 1, // Good Food Institute
  },
  // Vote 3
  {
    'iqRgzWyQYkyJa42oe': 1, // Giving What We Can
    '6yhJEFA6RidnrEwgk': 2, // TLYCS
  },
  // Vote 4
  {
    'hpJattsZrqyNpdnZa': 1, // Animal Welfare Fund
    'aWQ9EHkcqFJ5tQ3HQ': 2, // Good Food Institute
    'NwhdDs8rSkafxFda2': 3, // GiveDirectly
  },
  // Vote 5
  {
    'NwhdDs8rSkafxFda2': 1, // GiveDirectly
  },
  // Vote 6
  {
    '6yhJEFA6RidnrEwgk': 1, // TLYCS
    'iqRgzWyQYkyJa42oe': 2, // Giving What We Can
    'aWQ9EHkcqFJ5tQ3HQ': 3, // Good Food Institute
    'hpJattsZrqyNpdnZa': 4, // Animal Welfare Fund
  },
  // Vote 7
  {
    'hpJattsZrqyNpdnZa': 1, // Animal Welfare Fund
    '6yhJEFA6RidnrEwgk': 2, // TLYCS
  },
  // Vote 8
  {
    'aWQ9EHkcqFJ5tQ3HQ': 1, // Good Food Institute
    'NwhdDs8rSkafxFda2': 2, // GiveDirectly
  },
  // Vote 9
  {
    'iqRgzWyQYkyJa42oe': 1, // Giving What We Can
  },
  // Vote 10
  {
    'NwhdDs8rSkafxFda2': 1, // GiveDirectly
    'hpJattsZrqyNpdnZa': 2, // Animal Welfare Fund
    'aWQ9EHkcqFJ5tQ3HQ': 3, // Good Food Institute
  },
  // Vote 11
  {
    '6yhJEFA6RidnrEwgk': 1, // TLYCS
  },
  // Vote 12
  {
    'hpJattsZrqyNpdnZa': 1, // Animal Welfare Fund
    'iqRgzWyQYkyJa42oe': 2, // Giving What We Can
    'aWQ9EHkcqFJ5tQ3HQ': 3, // Good Food Institute
    'NwhdDs8rSkafxFda2': 4, // GiveDirectly
  },
  // Vote 13
  {
    'aWQ9EHkcqFJ5tQ3HQ': 1, // Good Food Institute
    '6yhJEFA6RidnrEwgk': 2, // TLYCS
  },
  // Vote 14
  {
    'iqRgzWyQYkyJa42oe': 1, // Giving What We Can
    'NwhdDs8rSkafxFda2': 2, // GiveDirectly
  },
  // Vote 15
  {
    'hpJattsZrqyNpdnZa': 1, // Animal Welfare Fund
  },
  // Vote 16
  {
    '6yhJEFA6RidnrEwgk': 1, // TLYCS
    'aWQ9EHkcqFJ5tQ3HQ': 2, // Good Food Institute
    'iqRgzWyQYkyJa42oe': 3, // Giving What We Can
  },
  // Vote 17
  {
    'NwhdDs8rSkafxFda2': 1, // GiveDirectly
    'hpJattsZrqyNpdnZa': 2, // Animal Welfare Fund
  },
  // Vote 18
  {
    'aWQ9EHkcqFJ5tQ3HQ': 1, // Good Food Institute
  },
  // Vote 19
  {
    'iqRgzWyQYkyJa42oe': 1, // Giving What We Can
    '6yhJEFA6RidnrEwgk': 2, // TLYCS
    'NwhdDs8rSkafxFda2': 3, // GiveDirectly
  },
  // Vote 20
  {
    'hpJattsZrqyNpdnZa': 1, // Animal Welfare Fund
    'aWQ9EHkcqFJ5tQ3HQ': 2, // Good Food Institute
  },
];



addGraphQLResolvers({
  Query: {
    GivingSeason2024DonationTotal: (
      _root: void,
      _args: {},
      context: ResolverContext,
    ) => context.repos.databaseMetadata.getGivingSeason2024DonationTotal(),
    GivingSeason2024VoteCounts: async (
      _root: void,
      _args: {},
      context: ResolverContext,
    ) => {
      // TODO use real votes
      // const dbVotes = await ElectionVotes.find({ electionName: ACTIVE_ELECTION }).fetch();
      // const votes: IRVote[] = dbVotes.map((vote) => vote.vote);
      const votes = DUMMY_VOTES;

      return instantRunoffAllPossibleResults(votes as IRVote[]);
    },
  },
});

addGraphQLQuery("GivingSeason2024DonationTotal: Float!");
addGraphQLQuery("GivingSeason2024VoteCounts: JSON!");

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
