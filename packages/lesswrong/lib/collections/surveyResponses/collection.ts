import { createCollection } from "../../vulcan-lib";
import { addUniversalFields, getDefaultResolvers } from "../../collectionUtils"
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import { ensureIndex } from "@/lib/collectionIndexUtils";
import schema from "./schema";

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
