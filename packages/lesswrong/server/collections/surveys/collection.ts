import { createCollection } from "@/lib/vulcan-lib/collections";

export const Surveys: SurveysCollection = createCollection({
  collectionName: "Surveys",
  typeName: "Survey",
});


export default Surveys;
