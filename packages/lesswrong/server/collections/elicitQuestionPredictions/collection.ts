import schema from '@/lib/collections/elicitQuestionPredictions/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from '@/server/resolvers/defaultResolvers'

export const ElicitQuestionPredictions: ElicitQuestionPredictionsCollection = createCollection({
  collectionName: 'ElicitQuestionPredictions',
  typeName: 'ElicitQuestionPrediction',
  schema,
  resolvers: getDefaultResolvers('ElicitQuestionPredictions'),
  logChanges: true,
});

export default ElicitQuestionPredictions;
