/**
 * Generated on 2023-09-15T22:01:28.284Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "201a2a659f0d6bc67e0b7f9940f4a209";

import TypingIndicator from "../../lib/collections/typingIndicators/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (TypingIndicator.isPostgres()) {
    await createTable(db, TypingIndicator);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (TypingIndicator.isPostgres()) {
    await dropTable(db, TypingIndicator);
  }
}
