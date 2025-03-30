import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getVoteGraphql } from '@/server/votingGraphQL';

export const Tags = createCollection({
  collectionName: 'Tags',
  typeName: 'Tag',
  resolvers: getDefaultResolvers('Tags'),
  logChanges: true,
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('Tags');

export default Tags;
