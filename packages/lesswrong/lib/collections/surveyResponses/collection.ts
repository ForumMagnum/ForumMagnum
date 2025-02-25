import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const SurveyResponses = createCollection({
  collectionName: "SurveyResponses",
  typeName: "SurveyResponse",
  schema,
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

addUniversalFields({collection: SurveyResponses});

export default SurveyResponses;
