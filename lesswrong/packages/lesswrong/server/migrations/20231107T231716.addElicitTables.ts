/**
 * Generated on 2023-11-07T23:17:16.833Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [x] Rename this file to something more readable
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [x] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "060a65a6bb00ba7b0a4da5397165f444";

import ElicitQuestionPredictions from "../../lib/collections/elicitQuestionPredictions/collection"
import ElicitQuestions from "../../lib/collections/elicitQuestions/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ElicitQuestions)
  await createTable(db, ElicitQuestionPredictions)
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ElicitQuestions)
  await dropTable(db, ElicitQuestionPredictions)
}
