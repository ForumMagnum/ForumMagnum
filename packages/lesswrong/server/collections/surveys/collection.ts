import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import schema from "@/lib/collections/surveys/schema";
import { addUniversalFields } from "@/lib/collectionUtils";
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";

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
