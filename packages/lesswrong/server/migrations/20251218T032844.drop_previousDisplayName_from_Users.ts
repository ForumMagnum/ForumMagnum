/**
 * Drop the previousDisplayName field from Users since we now use FieldChanges
 * to track display name change history and rate limit enforcement.
 */

import Users from "../../server/collections/users/collection"
import { StringType } from "../../server/sql/Type"
import { addRemovedField, dropRemovedField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "previousDisplayName")
}

export const down = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "previousDisplayName", new StringType())
}
