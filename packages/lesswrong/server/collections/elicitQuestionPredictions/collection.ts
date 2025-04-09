import { createCollection } from '@/lib/vulcan-lib/collections';

export const ElicitQuestionPredictions: ElicitQuestionPredictionsCollection = createCollection({
  collectionName: 'ElicitQuestionPredictions',
  typeName: 'ElicitQuestionPrediction',
  logChanges: true,
});

export default ElicitQuestionPredictions;
