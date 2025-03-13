import { addField, createTable, dropField, dropTable, updateIndexes } from "./meta/utils";
import Surveys from "@/server/collections/surveys/collection";
import SurveyQuestions from "@/server/collections/surveyQuestions/collection";
import SurveyResponses from "@/server/collections/surveyResponses/collection";
import SurveySchedules from "@/server/collections/surveySchedules/collection";
import Users from "@/server/collections/users/collection";

export const acceptsSchemaHash = "b1f9f6080e26c6425541b770717f7c98"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, Surveys);
  await createTable(db, SurveyQuestions);
  await createTable(db, SurveyResponses);
  await createTable(db, SurveySchedules);

  await updateIndexes(Surveys);
  await updateIndexes(SurveyQuestions);
  await updateIndexes(SurveyResponses);
  await updateIndexes(SurveySchedules);

  await addField(db, Users, "optedOutOfSurveys");
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, Surveys);
  await dropTable(db, SurveyQuestions);
  await dropTable(db, SurveyResponses);
  await dropTable(db, SurveySchedules);

  await dropField(db, Users, "optedOutOfSurveys");
}
