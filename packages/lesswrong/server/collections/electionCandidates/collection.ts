import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { getVoteGraphql } from "@/server/votingGraphQL";
export const ElectionCandidates: ElectionCandidatesCollection = createCollection({
  collectionName: "ElectionCandidates",
  typeName: "ElectionCandidate",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ElectionCandidates', {electionName: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers("ElectionCandidates"),
  logChanges: true,
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('ElectionCandidates');

export default ElectionCandidates;
