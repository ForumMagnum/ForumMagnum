import { addField, createTable, dropField, dropTable, updateIndexes } from "./meta/utils";
import Surveys from "@/lib/collections/surveys/collection";
import SurveyQuestions from "@/lib/collections/surveyQuestions/collection";
import SurveyResponses from "@/lib/collections/surveyResponses/collection";
import SurveySchedules from "@/lib/collections/surveySchedules/collection";
import Users from "@/lib/vulcan-users";

export const acceptsSchemaHash = "c0f1a39f92c51fce59af19a06cf65dc5"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, Surveys);
  await createTable(db, SurveyQuestions);
  await createTable(db, SurveyResponses);
  await createTable(db, SurveySchedules);
  await addField(db, Users, "optedOutOfSurveys");
  await updateIndexes(Surveys);
  await updateIndexes(SurveyQuestions);
  await updateIndexes(SurveyResponses);
  await updateIndexes(SurveySchedules);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, Surveys);
  await dropTable(db, SurveyQuestions);
  await dropTable(db, SurveyResponses);
  await dropTable(db, SurveySchedules);
  await dropField(db, Users, "optedOutOfSurveys");
}
