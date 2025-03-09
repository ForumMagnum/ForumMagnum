/**
 * Generated on 2023-05-22T23:31:07.099Z by `yarn makemigrations`
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
export const acceptsSchemaHash = "546cd13c6ee60ca019f7eb5df4502471";

import { ModerationTemplates } from "../../server/collections/moderationTemplates/collection"
import { updateDefaultValue } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, ModerationTemplates, "order")
}

export const down = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, ModerationTemplates, "order")
}

