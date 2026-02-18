/**
 * Generated on 2023-05-14T10:46:40.109Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 7c1ccd0829..8b62934d63 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: f38ed1e13515715dfc7ea5a8d6ea01df
 * -
 * --- Accepted on 2023-05-10T14:23:44.000Z by 20230510T142344.create_PostRecommendations_table.ts
 * +-- Overall schema hash: 922ce375a3ed4de843e0f4f9cc50dd08
 *  
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "922ce375a3ed4de843e0f4f9cc50dd08";

import Users from "../../server/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, 'voteReceivedCount')
  await addField(db, Users, 'smallUpvoteReceivedCount')
  await addField(db, Users, 'smallDownvoteReceivedCount')
  await addField(db, Users, 'bigUpvoteReceivedCount')
  await addField(db, Users, 'bigDownvoteReceivedCount')
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, 'voteReceivedCount')
  await dropField(db, Users, 'smallUpvoteReceivedCount')
  await dropField(db, Users, 'smallDownvoteReceivedCount')
  await dropField(db, Users, 'bigUpvoteReceivedCount')
  await dropField(db, Users, 'bigDownvoteReceivedCount')
}
