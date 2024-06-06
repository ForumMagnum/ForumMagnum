import { createCollection } from "../../vulcan-lib";
import { addUniversalFields, getDefaultResolvers } from "../../collectionUtils"
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import schema from "./schema";

export const SurveyResponses = createCollection({
  collectionName: "SurveyResponses" as CollectionNameString,
  typeName: "SurveyResponse",
  schema,
  resolvers: getDefaultResolvers("SurveyResponses"),
  mutations: getDefaultMutations("SurveyResponses"),
  logChanges: false,
});

addUniversalFields({collection: SurveyResponses});

export default SurveyResponses;
