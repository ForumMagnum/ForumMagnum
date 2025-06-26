import { createCollection } from "@/lib/vulcan-lib/collections";
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
});


export default SurveyResponses;
