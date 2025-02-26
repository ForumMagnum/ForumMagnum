import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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
