import { createCollection } from "../../vulcan-lib";
import { addUniversalFields, getDefaultResolvers } from "../../collectionUtils"
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import schema from "./schema";

export const SurveySchedules = createCollection({
  collectionName: "SurveySchedules" as CollectionNameString,
  typeName: "SurveySchedule",
  schema,
  resolvers: getDefaultResolvers("SurveySchedules"),
  mutations: getDefaultMutations("SurveySchedules"),
  logChanges: true,
});

addUniversalFields({collection: SurveySchedules});

export default SurveySchedules;
