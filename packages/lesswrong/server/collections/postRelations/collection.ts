import schema from '@/lib/collections/postRelations/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const PostRelations: PostRelationsCollection = createCollection({
  collectionName: 'PostRelations',
  typeName: 'PostRelation',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('PostRelations', { sourcePostId: 1, order: 1, createdAt: -1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('PostRelations'),
  logChanges: true,
});


export default PostRelations;
