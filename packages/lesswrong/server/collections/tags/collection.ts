import { createCollection } from '@/lib/vulcan-lib/collections';
import { getVoteGraphql } from '@/server/votingGraphQL';

export const Tags = createCollection({
  collectionName: 'Tags',
  typeName: 'Tag',
  logChanges: true,
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('Tags');

export default Tags;
