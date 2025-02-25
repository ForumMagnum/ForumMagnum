import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultResolvers } from '../../vulcan-core/default_resolvers'

export const ElicitQuestionPredictions: ElicitQuestionPredictionsCollection = createCollection({
  collectionName: 'ElicitQuestionPredictions',
  typeName: 'ElicitQuestionPrediction',
  schema,
  resolvers: getDefaultResolvers('ElicitQuestionPredictions'),
  logChanges: true,
});

export default ElicitQuestionPredictions;
