import { createCollection } from "@/lib/vulcan-lib/collections";

export const ElicitQuestions: ElicitQuestionsCollection = createCollection({
  collectionName: 'ElicitQuestions',
  typeName: 'ElicitQuestion',
  logChanges: true,
});


export default ElicitQuestions;
