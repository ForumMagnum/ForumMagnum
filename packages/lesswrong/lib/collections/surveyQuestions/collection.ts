import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { ensureIndex } from "@/lib/collectionIndexUtils";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const SurveyQuestions: SurveyQuestionsCollection = createCollection({
  collectionName: "SurveyQuestions",
  typeName: "SurveyQuestion",
  schema,
  resolvers: getDefaultResolvers("SurveyQuestions"),
  mutations: getDefaultMutations("SurveyQuestions"),
  logChanges: true,
});

addUniversalFields({collection: SurveyQuestions});

ensureIndex(SurveyQuestions, {surveyId: 1});

export default SurveyQuestions;
