import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const SurveyQuestions: SurveyQuestionsCollection = createCollection({
  collectionName: "SurveyQuestions",
  typeName: "SurveyQuestion",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('SurveyQuestions', {surveyId: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers("SurveyQuestions"),
  logChanges: true,
});


export default SurveyQuestions;
