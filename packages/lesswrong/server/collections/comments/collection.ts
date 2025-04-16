import { createCollection } from '@/lib/vulcan-lib/collections';
import { commentVotingOptions } from '@/lib/collections/comments/voting';
import { getVoteGraphql } from '@/server/votingGraphQL';

export const Comments = createCollection({
  collectionName: 'Comments',
  typeName: 'Comment',
  voteable: commentVotingOptions,
});

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('Comments');
export default Comments;
