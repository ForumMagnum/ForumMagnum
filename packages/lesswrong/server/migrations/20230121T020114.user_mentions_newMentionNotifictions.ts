import Users from '../../lib/collections/users/collection'
import {Comments} from '../../lib/collections/comments'
import {addField, dropField} from './meta/utils'

/**
 * Generated on 2023-01-21T02:01:14.685Z by `yarn makemigrations`
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
export const acceptsSchemaHash = '283dfc730f436f378139bb85edce6dfc'
export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) await addField(db, Users, 'notificationNewMention')
  
  if (Comments.isPostgres()) await addField(db, Comments, 'pingbacks')
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) await dropField(db, Users, 'notificationNewMention')
  
  if (Comments.isPostgres()) await dropField(db, Comments, 'pingbacks')
}
