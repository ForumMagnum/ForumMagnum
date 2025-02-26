import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { ensureIndex } from "@/lib/collectionIndexUtils";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const SurveyResponses = createCollection({
  collectionName: "SurveyResponses",
  typeName: "SurveyResponse",
  schema,
  resolvers: getDefaultResolvers("SurveyResponses"),
  mutations: getDefaultMutations("SurveyResponses"),
  logChanges: false,
});

addUniversalFields({collection: SurveyResponses});

ensureIndex(SurveyResponses, {surveyId: 1});
ensureIndex(SurveyResponses, {surveyScheduleId: 1});
ensureIndex(SurveyResponses, {userId: 1});
ensureIndex(SurveyResponses, {clientId: 1});

export default SurveyResponses;
