import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const SurveyQuestions: SurveyQuestionsCollection = createCollection({
  collectionName: "SurveyQuestions",
  typeName: "SurveyQuestion",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('SurveyQuestions', {surveyId: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers("SurveyQuestions"),
  mutations: getDefaultMutations("SurveyQuestions"),
  logChanges: true,
});

addUniversalFields({collection: SurveyQuestions});

export default SurveyQuestions;
