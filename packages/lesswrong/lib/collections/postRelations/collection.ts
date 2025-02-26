import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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

addUniversalFields({collection: PostRelations})

export default PostRelations;
