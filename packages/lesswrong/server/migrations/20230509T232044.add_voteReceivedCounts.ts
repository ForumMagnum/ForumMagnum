/**
 * Generated on 2023-05-09T23:20:44.403Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 0a90e954d5..e8257a0d49 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: be2a53332cb5a42e9fafd13c2e7fde88
 * -
 * --- Accepted on 2023-05-03T13:04:47.000Z by 20230503T130447.add_expandedFrontpageSections_column.ts
 * +-- Overall schema hash: 2ee026734ffd3d5441f9249f716ee2d3
 *  
 * @@ -915,3 +913,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 0bf1273a99c64bc40372f77a38d6ef9d
 * +-- Schema for "Users", hash: e49b49b98b4c7140a66c7a31c8df5ee0
 *  CREATE TABLE "Users" (
 * @@ -1043,2 +1041,7 @@ CREATE TABLE "Users" (
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
export const acceptsSchemaHash = "2ee026734ffd3d5441f9249f716ee2d3";

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
