import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getVoteGraphql } from '@/server/votingGraphQL';

export const Revisions: RevisionsCollection = createCollection({
  collectionName: 'Revisions',
  typeName: 'Revision',
  resolvers: getDefaultResolvers('Revisions'),
  logChanges: true,
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
