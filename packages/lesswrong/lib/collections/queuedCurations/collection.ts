import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';
import { makeEditable } from '../../editor/make_editable';

export const QueuedCurations: QueuedCurationsCollection = createCollection({
  collectionName: 'QueuedCurations',
  typeName: 'QueuedCuration',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('QueuedCurations'),
  mutations: getDefaultMutations('QueuedCurations'),
  logChanges: true,
});

addUniversalFields({collection: QueuedCurations});

makeEditable({
  collection: QueuedCurations,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
  }
})

export default QueuedCurations;
