/**
 * Generated on 2023-10-26T01:47:47.578Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "ccc15da1a7699b6fb4cbacde8bd63bef";

import Users from "../../server/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
 await addField(db, Users, "hideDialogueFacilitation");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideDialogueFacilitation");
}
