import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";

export const ElicitQuestions: ElicitQuestionsCollection = createCollection({
  collectionName: 'ElicitQuestions',
  typeName: 'ElicitQuestion',
  resolvers: getDefaultResolvers('ElicitQuestions'),
  logChanges: true,
});


export default ElicitQuestions;
