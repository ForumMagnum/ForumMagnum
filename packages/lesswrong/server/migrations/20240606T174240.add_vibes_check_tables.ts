import { createTable, dropTable, updateCustomIndexes, updateIndexes } from "./meta/utils";
import Surveys from "@/lib/collections/surveys/collection";
import SurveyQuestions from "@/lib/collections/surveyQuestions/collection";
import SurveyResponses from "@/lib/collections/surveyResponses/collection";
import SurveySchedules from "@/lib/collections/surveySchedules/collection";

export const acceptsSchemaHash = "c2b190fe9205d460df1aed04c3a31eb4";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, Surveys);
  await createTable(db, SurveyQuestions);
  await createTable(db, SurveyResponses);
  await createTable(db, SurveySchedules);
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
}
