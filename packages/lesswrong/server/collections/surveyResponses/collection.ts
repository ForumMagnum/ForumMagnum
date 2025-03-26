import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const SurveyResponses = createCollection({
  collectionName: "SurveyResponses",
  typeName: "SurveyResponse",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('SurveyResponses', {surveyId: 1});
    indexSet.addIndex('SurveyResponses', {surveyScheduleId: 1});
    indexSet.addIndex('SurveyResponses', {userId: 1});
    indexSet.addIndex('SurveyResponses', {clientId: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers("SurveyResponses"),
  mutations: getDefaultMutations("SurveyResponses"),
  logChanges: false,
});


export default SurveyResponses;
