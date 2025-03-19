import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import schema from "@/lib/collections/surveys/schema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";

export const Surveys: SurveysCollection = createCollection({
  collectionName: "Surveys",
  typeName: "Survey",
  schema,
  resolvers: getDefaultResolvers("Surveys"),
  mutations: getDefaultMutations("Surveys"),
  logChanges: true,
});


export default Surveys;
