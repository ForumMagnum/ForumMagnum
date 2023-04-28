/**
 * Generated on 2023-04-28T19:31:23.452Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 59c1109f8a..6f53e6d02c 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c4afbf05797c266012f5ba5ae0119c87
 * -
 * --- Accepted on 2023-04-24T20:04:07.000Z by 20230424T200407.add_ignore_rate_limits.ts
 * +-- Overall schema hash: fab4bafaa2e26f8dbb139df5fc33dd5a
 *  
 * @@ -914,3 +912,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 9386b171feef6628a604069fe9619525
 * +-- Schema for "Users", hash: 2b20d99ec0dc6d42dde8f0fc0a74b370
 *  CREATE TABLE "Users" (
 * @@ -947,3 +945,2 @@ CREATE TABLE "Users" (
 *      "showCommunityInRecentDiscussion" bool DEFAULT false,
 * -    "noComicSans" bool DEFAULT false,
 *      "petrovOptOut" bool DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "fab4bafaa2e26f8dbb139df5fc33dd5a";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) return
  
  await dropField(db, Users, "noComicSans")
}

export const down = async ({db}: MigrationContext) => {
  if (!Users.isPostgres()) return
  
  await addField(db, Users, "noComicSans")
}
