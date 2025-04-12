import { createCollection } from '@/lib/vulcan-lib/collections';

export const ElicitQuestionPredictions: ElicitQuestionPredictionsCollection = createCollection({
  collectionName: 'ElicitQuestionPredictions',
  typeName: 'ElicitQuestionPrediction',
});

export default ElicitQuestionPredictions;
