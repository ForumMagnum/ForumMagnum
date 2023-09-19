import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations } from '../../vulcan-core/default_mutations';

export const ElicitPredictions: ElicitPredictionsCollection = createCollection({
  collectionName: 'ElicitPredictions',
  typeName: 'ElicitPrediction',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('ElicitPredictions'),
  mutations: getDefaultMutations('ElicitPredictions'),
  logChanges: true,
});

// addUniversalFields({collection: ElicitPredictions})

export default ElicitPredictions;
