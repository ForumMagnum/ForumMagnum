import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import schema from "./schema";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const Surveys: SurveysCollection = createCollection({
  collectionName: "Surveys",
  typeName: "Survey",
  schema,
  resolvers: getDefaultResolvers("Surveys"),
  mutations: getDefaultMutations("Surveys"),
  logChanges: true,
});

export default Surveys;
