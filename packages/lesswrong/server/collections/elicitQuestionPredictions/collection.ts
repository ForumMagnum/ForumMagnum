import schema from '@/lib/collections/elicitQuestionPredictions/newSchema';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const ElicitQuestionPredictions = createCollection({
  collectionName: 'ElicitQuestionPredictions',
  typeName: 'ElicitQuestionPrediction',
  schema,
});

export default ElicitQuestionPredictions;
