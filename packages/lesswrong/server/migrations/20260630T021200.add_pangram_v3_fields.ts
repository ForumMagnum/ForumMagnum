/**
 * Add fields that distinguish Pangram v2 scores from v3 scores and preserve
 * the top-level v3 fraction outputs.
 */

import AutomatedContentEvaluations from "../../server/collections/automatedContentEvaluations/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, AutomatedContentEvaluations, "pangramApiVersion");
  await addField(db, AutomatedContentEvaluations, "pangramAiInvolvedScore");
  await addField(db, AutomatedContentEvaluations, "pangramFractionAi");
  await addField(db, AutomatedContentEvaluations, "pangramFractionAiAssisted");
  await addField(db, AutomatedContentEvaluations, "pangramFractionHuman");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, AutomatedContentEvaluations, "pangramFractionHuman");
  await dropField(db, AutomatedContentEvaluations, "pangramFractionAiAssisted");
  await dropField(db, AutomatedContentEvaluations, "pangramFractionAi");
  await dropField(db, AutomatedContentEvaluations, "pangramAiInvolvedScore");
  await dropField(db, AutomatedContentEvaluations, "pangramApiVersion");
}
