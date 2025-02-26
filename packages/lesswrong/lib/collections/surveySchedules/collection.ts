import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { ensureIndex } from "@/lib/collectionIndexUtils";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
