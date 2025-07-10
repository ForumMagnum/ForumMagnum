import schema from '@/lib/collections/electionCandidates/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";
import { getVoteGraphql } from "@/server/votingGraphQL";
export const ElectionCandidates = createCollection({
  collectionName: "ElectionCandidates",
  typeName: "ElectionCandidate",
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ElectionCandidates', {electionName: 1});
    return indexSet;
  },
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('ElectionCandidates');

export default ElectionCandidates;
