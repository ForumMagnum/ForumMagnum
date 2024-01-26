/**
 * Generated on 2022-12-23T17:02:55.316Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 4446efb354..1d4f72a824 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 9ff9e6371051f8d49cac5770b07dc0d8
 * -
 * --- Accepted on 2022-12-13T18:11:44.000Z by 20221213T181144.fix_float_precision.ts
 * +-- Overall schema hash: 5ea47edb2b8d68d1bcb3967036fdb5b3
 *  
 * @@ -818,3 +816,3 @@ CREATE TABLE "Tags" (
 *  
 * --- Schema for "UserTagRels", hash: 46387d8cf6e53fbefaf8c5f6ddacb9fa
 * +-- Schema for "UserTagRels", hash: 0d561800b9a8262660a82c0e4125d99a
 *  CREATE TABLE "UserTagRels" (
 * @@ -825,3 +823,3 @@ CREATE TABLE "UserTagRels" (
 *      "subforumShowUnreadInSidebar" bool NOT NULL DEFAULT true,
 * -    "subforumEmailNotifications" bool NOT NULL DEFAULT true,
 * +    "subforumEmailNotifications" bool NOT NULL DEFAULT false,
 *      "schemaVersion" double precision DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "afc7cd96d9085ca54d2a50765d02338f";

import UserTagRels from "../../lib/collections/userTagRels/collection";
import { updateDefaultValue } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, UserTagRels, "subforumEmailNotifications");
}

export const down = async ({db}: MigrationContext) => {
  await updateDefaultValue(db, UserTagRels, "subforumEmailNotifications");
}
