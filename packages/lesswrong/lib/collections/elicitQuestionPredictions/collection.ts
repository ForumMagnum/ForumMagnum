import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { getDefaultResolvers } from '../../collectionUtils'

export const ElicitQuestionPredictions: ElicitQuestionPredictionsCollection = createCollection({
  collectionName: 'ElicitQuestionPredictions',
  typeName: 'ElicitQuestionPrediction',
  schema,
  resolvers: getDefaultResolvers('ElicitQuestionPredictions'),
  logChanges: true,
});

export default ElicitQuestionPredictions;
