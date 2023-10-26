/**
 * Generated on 2023-10-25T01:16:39.433Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [X] Write a migration to represent these changes
 * - [X] Rename this file to something more readable
 * - [X] Uncomment `acceptsSchemaHash` below
 * - [X] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "f9d5e2f48c1c9446111fe368e8e11b52";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";


export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
   await addField(db, Users, "hideDialogueFacilitation");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "hideDialogueFacilitation");
  }
}
