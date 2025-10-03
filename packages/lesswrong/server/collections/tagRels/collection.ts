import schema from '@/lib/collections/tagRels/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { canVoteOnTagAsync } from '@/lib/voting/tagRelVoteRules';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const TagRels = createCollection({
  collectionName: 'TagRels',
  typeName: 'TagRel',
  schema,
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

export default TagRels;
