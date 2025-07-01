import { createCollection } from "@/lib/vulcan-lib/collections";
import { getVoteGraphql } from '@/server/votingGraphQL';

export const Revisions = createCollection({
  collectionName: 'Revisions',
  typeName: 'Revision',
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export interface ChangeMetrics {
  added: number
  removed: number
}

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('Revisions');

export default Revisions;
