import schema from '@/lib/collections/moderationTemplates/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ModerationTemplates: ModerationTemplatesCollection = createCollection({
  collectionName: 'ModerationTemplates',
  typeName: 'ModerationTemplate',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ModerationTemplates', { deleted: 1, order: 1 })
    indexSet.addIndex('ModerationTemplates', { collectionName: 1, deleted: 1, order: 1 })
    return indexSet;
  },
  resolvers: getDefaultResolvers('ModerationTemplates'),
  mutations: getDefaultMutations('ModerationTemplates'),
  logChanges: true,
});

addUniversalFields({collection: ModerationTemplates});

export default ModerationTemplates;
