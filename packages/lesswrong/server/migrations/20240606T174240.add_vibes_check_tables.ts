import { createTable, dropTable } from "./meta/utils";
import Surveys from "@/lib/collections/surveys/collection";
import SurveyQuestions from "@/lib/collections/surveyQuestions/collection";
import SurveyResponses from "@/lib/collections/surveyResponses/collection";
import SurveySchedules from "@/lib/collections/surveySchedules/collection";

export const acceptsSchemaHash = "571b884f9d7f3b93fc02529131ee23d1";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, Surveys);
  await createTable(db, SurveyQuestions);
  await createTable(db, SurveyResponses);
  await createTable(db, SurveySchedules);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, Surveys);
  await dropTable(db, SurveyQuestions);
  await dropTable(db, SurveyResponses);
  await dropTable(db, SurveySchedules);
}
