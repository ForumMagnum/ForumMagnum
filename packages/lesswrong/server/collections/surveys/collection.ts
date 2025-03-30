import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";

export const Surveys: SurveysCollection = createCollection({
  collectionName: "Surveys",
  typeName: "Survey",
    resolvers: getDefaultResolvers("Surveys"),
  logChanges: true,
});


export default Surveys;
