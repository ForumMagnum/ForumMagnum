import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const SurveySchedules = createCollection({
  collectionName: "SurveySchedules",
  typeName: "SurveySchedule",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('SurveySchedules', {surveyId: 1});
    indexSet.addIndex('SurveySchedules', {clientIds: 1});
    return indexSet;
  },
});


export default SurveySchedules;
