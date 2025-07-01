import schema from '@/lib/collections/revisions/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections";
import { getVoteGraphql } from '@/server/votingGraphQL';

export const Revisions = createCollection({
  collectionName: 'Revisions',
  typeName: 'Revision',
  schema,
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
