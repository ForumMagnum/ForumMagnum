/**
 * Generated on 2023-04-27T15:06:14.864Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 59c1109f8a..16d680adff 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c4afbf05797c266012f5ba5ae0119c87
 * -
 * --- Accepted on 2023-04-24T20:04:07.000Z by 20230424T200407.add_ignore_rate_limits.ts
 * +-- Overall schema hash: 29bdc1abc9c47e853a02b9a41225de0f
 *  
 * @@ -914,3 +912,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 9386b171feef6628a604069fe9619525
 * +-- Schema for "Users", hash: b84def6bbcd6842e5e62ab7b9c4c1fdc
 *  CREATE TABLE "Users" (
 * @@ -1042,2 +1040,7 @@ CREATE TABLE "Users" (
 *      "bigDownvoteCount" double precision,
 * +    "voteReceivedCount" double precision,
 * +    "smallUpvoteReceivedCount" double precision,
 * +    "smallDownvoteReceivedCount" double precision,
 * +    "bigUpvoteReceivedCount" double precision,
 * +    "bigDownvoteReceivedCount" double precision,
 *      "usersContactedBeforeReview" text[],
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "29bdc1abc9c47e853a02b9a41225de0f";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) return
  
  await addField(db, Users, 'voteReceivedCount')
  await addField(db, Users, 'smallUpvoteReceivedCount')
  await addField(db, Users, 'smallDownvoteReceivedCount')
  await addField(db, Users, 'bigUpvoteReceivedCount')
  await addField(db, Users, 'bigDownvoteReceivedCount')
}

export const down = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) return
  
  await dropField(db, Users, 'voteReceivedCount')
  await dropField(db, Users, 'smallUpvoteReceivedCount')
  await dropField(db, Users, 'smallDownvoteReceivedCount')
  await dropField(db, Users, 'bigUpvoteReceivedCount')
  await dropField(db, Users, 'bigDownvoteReceivedCount')
}
