import { createCollection } from "../../vulcan-lib";
import { addUniversalFields, getDefaultResolvers } from "../../collectionUtils"
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import { ensureIndex } from "@/lib/collectionIndexUtils";
import schema from "./schema";

export const SurveySchedules = createCollection({
  collectionName: "SurveySchedules",
  typeName: "SurveySchedule",
  schema,
  resolvers: getDefaultResolvers("SurveySchedules"),
  mutations: getDefaultMutations("SurveySchedules"),
  logChanges: true,
});

addUniversalFields({collection: SurveySchedules});

ensureIndex(SurveySchedules, {surveyId: 1});
ensureIndex(SurveySchedules, {clientIds: 1});

export default SurveySchedules;
