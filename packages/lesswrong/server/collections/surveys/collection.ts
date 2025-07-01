import schema from '@/lib/collections/surveys/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections";

export const Surveys = createCollection({
  collectionName: "Surveys",
  typeName: "Survey",
  schema,
});


export default Surveys;
