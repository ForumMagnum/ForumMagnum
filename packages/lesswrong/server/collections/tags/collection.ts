import schema from '@/lib/collections/tags/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getVoteGraphql } from '@/server/votingGraphQL';

export const Tags = createCollection({
  collectionName: 'Tags',
  typeName: 'Tag',
  schema,
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('Tags');

export default Tags;
