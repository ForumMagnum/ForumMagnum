import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import schema from "@/lib/collections/surveySchedules/schema";
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const SurveySchedules = createCollection({
  collectionName: "SurveySchedules",
  typeName: "SurveySchedule",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('SurveySchedules', {surveyId: 1});
    indexSet.addIndex('SurveySchedules', {clientIds: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers("SurveySchedules"),
  mutations: getDefaultMutations("SurveySchedules"),
  logChanges: true,
});

addUniversalFields({collection: SurveySchedules});

export default SurveySchedules;
