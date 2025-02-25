import { createCollection } from "../../vulcan-lib/collections";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
