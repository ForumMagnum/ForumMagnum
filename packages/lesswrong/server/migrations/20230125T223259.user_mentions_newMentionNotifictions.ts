import Users from '../../lib/collections/users/collection'
import { Comments } from '../../lib/collections/comments/collection'
import {addField, dropField} from './meta/utils'

/**
 * Generated on 2023-01-25T22:32:59.886Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "f74d70468a0d76011ef39059dc9584d5";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, 'notificationNewMention')
  await addField(db, Comments, 'pingbacks')
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, 'notificationNewMention')
  await dropField(db, Comments, 'pingbacks')
}
