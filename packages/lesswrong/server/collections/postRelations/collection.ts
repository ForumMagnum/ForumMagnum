import schema from '@/lib/collections/postRelations/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const PostRelations = createCollection({
  collectionName: 'PostRelations',
  typeName: 'PostRelation',
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PostRelations', { sourcePostId: 1, order: 1, createdAt: -1 });
    return indexSet;
  },
});


export default PostRelations;
