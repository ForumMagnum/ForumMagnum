import { createCollection } from "../../vulcan-lib";
import { addUniversalFields, getDefaultResolvers } from "../../collectionUtils"
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import schema from "./schema";

export const SurveyQuestions: SurveyQuestionsCollection = createCollection({
  collectionName: "SurveyQuestions",
  typeName: "SurveyQuestion",
  schema,
  resolvers: getDefaultResolvers("SurveyQuestions"),
  mutations: getDefaultMutations("SurveyQuestions"),
  logChanges: true,
});

addUniversalFields({collection: SurveyQuestions});

export default SurveyQuestions;
