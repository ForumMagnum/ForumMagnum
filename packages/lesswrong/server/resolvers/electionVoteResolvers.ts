import { addGraphQLResolvers, addGraphQLQuery } from "../../lib/vulcan-lib/graphql";

addGraphQLResolvers({
  Query: {
    async SubmittedVoteCount(root: void, {electionName}: {electionName: string}, context: ResolverContext) {
      return await context.repos.electionVotes.submittedVoteCount(electionName);
    }
  },
});

addGraphQLQuery('SubmittedVoteCount(electionName: String!): Int!');
