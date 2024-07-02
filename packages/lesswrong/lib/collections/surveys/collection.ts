import { createCollection } from "../../vulcan-lib";
import { addUniversalFields, getDefaultResolvers } from "../../collectionUtils"
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import schema from "./schema";

export const Surveys: SurveysCollection = createCollection({
  collectionName: "Surveys",
  typeName: "Survey",
  schema,
  resolvers: getDefaultResolvers("Surveys"),
  mutations: getDefaultMutations("Surveys"),
  logChanges: true,
});

addUniversalFields({collection: Surveys});

export default Surveys;
