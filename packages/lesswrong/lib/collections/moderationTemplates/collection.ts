import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { makeEditable } from "../../editor/make_editable";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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

makeEditable({
  collection: ModerationTemplates,
  options: {
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    order: 20
  }
})

export default ModerationTemplates;
