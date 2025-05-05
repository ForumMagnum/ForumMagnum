import AutomatedContentEvaluations from "../collections/automatedContentEvaluations/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, AutomatedContentEvaluations, "aiChoice");
  await addField(db, AutomatedContentEvaluations, "aiReasoning");
  await addField(db, AutomatedContentEvaluations, "aiCoT");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, AutomatedContentEvaluations, "aiChoice");
  await dropField(db, AutomatedContentEvaluations, "aiReasoning");
  await dropField(db, AutomatedContentEvaluations, "aiCoT");
}
