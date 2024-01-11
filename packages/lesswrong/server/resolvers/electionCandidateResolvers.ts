import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../../lib/vulcan-lib/graphql";
import type { ElectionAmountRaised } from "../repos/ElectionCandidatesRepo";

const electionCandidateResolvers = {
  Query: {
    /**
     * Get the total raised (and total target) for the election fund, and the total raised (and total target) for all
     * candidates in the election (_including_ the election fund)
     */
    async ElectionAmountRaised(
      root: void,
      { electionName }: { electionName: string },
      context: ResolverContext
    ): Promise<ElectionAmountRaised> {
      return await context.repos.electionCandidates.getAmountRaised(electionName);
    },
  },
};

addGraphQLResolvers(electionCandidateResolvers);
addGraphQLSchema(`
  type ElectionAmountRaised {
    raisedForElectionFund: Float,
    electionFundTarget: Float,
    totalRaised: Float,
    totalTarget: Float,
  }
`);
addGraphQLQuery('ElectionAmountRaised(electionName: String): ElectionAmountRaised');
