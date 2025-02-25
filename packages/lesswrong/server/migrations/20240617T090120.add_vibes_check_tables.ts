import { addField, createTable, dropField, dropTable, updateIndexes } from "./meta/utils";
import Surveys from "@/lib/collections/surveys/collection";
import SurveyQuestions from "@/lib/collections/surveyQuestions/collection";
import SurveyResponses from "@/lib/collections/surveyResponses/collection";
import SurveySchedules from "@/lib/collections/surveySchedules/collection";
import Users from "@/lib/collections/users/collection";

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
