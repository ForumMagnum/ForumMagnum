import { createCollection } from '@/lib/vulcan-lib/collections';
import { canVoteOnTagAsync } from '@/lib/voting/tagRelVoteRules';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import { getVoteGraphql } from '@/server/votingGraphQL';

export const TagRels = createCollection({
  collectionName: 'TagRels',
  typeName: 'TagRel',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('TagRels', {postId: 1});
    indexSet.addIndex('TagRels', {tagId: 1});
    return indexSet;
  },
  voteable: {
    timeDecayScoresCronjob: true,
    userCanVoteOn: (
      user: DbUser,
      document: DbTagRel,
      voteType: string|null,
      _extendedVote: any,
      context: ResolverContext,
    ) => canVoteOnTagAsync(user, document.tagId, document.postId, context, voteType ?? 'neutral'),
  },
});

export const { graphqlVoteTypeDefs, graphqlVoteMutations } = getVoteGraphql('TagRels');

export default TagRels;
