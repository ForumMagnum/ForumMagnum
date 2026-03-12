/**
 * Migration to add Pangram AI detection fields to AutomatedContentEvaluations.
 * These fields store results from Pangram API separately from existing Sapling fields.
 */

import AutomatedContentEvaluations from "../../server/collections/automatedContentEvaluations/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, AutomatedContentEvaluations, "pangramScore");
  await addField(db, AutomatedContentEvaluations, "pangramMaxScore");
  await addField(db, AutomatedContentEvaluations, "pangramPrediction");
  await addField(db, AutomatedContentEvaluations, "pangramWindowScores");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, AutomatedContentEvaluations, "pangramWindowScores");
  await dropField(db, AutomatedContentEvaluations, "pangramPrediction");
  await dropField(db, AutomatedContentEvaluations, "pangramMaxScore");
  await dropField(db, AutomatedContentEvaluations, "pangramScore");
}
