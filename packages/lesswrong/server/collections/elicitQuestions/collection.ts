import schema from '@/lib/collections/elicitQuestions/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections";

export const ElicitQuestions = createCollection({
  collectionName: 'ElicitQuestions',
  typeName: 'ElicitQuestion',
  schema,
});


export default ElicitQuestions;
