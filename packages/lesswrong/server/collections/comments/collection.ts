import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { commentVotingOptions } from '@/lib/collections/comments/voting';
import { getVoteGraphql } from '@/server/votingGraphQL';

export const Comments = createCollection({
  collectionName: 'Comments',
  typeName: 'Comment',
  resolvers: getDefaultResolvers('Comments'),
  logChanges: true,
  voteable: commentVotingOptions,
});

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('Comments');
export default Comments;
