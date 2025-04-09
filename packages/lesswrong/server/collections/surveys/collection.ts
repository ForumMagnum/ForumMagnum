import { createCollection } from "@/lib/vulcan-lib/collections";

export const Surveys: SurveysCollection = createCollection({
  collectionName: "Surveys",
  typeName: "Survey",
  logChanges: true,
});


export default Surveys;
