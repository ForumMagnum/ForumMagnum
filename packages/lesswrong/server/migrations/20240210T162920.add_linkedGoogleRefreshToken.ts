/**
 * Generated on 2024-02-10T16:29:20.914Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 7b8cf3620c..207d27a344 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 44cc1cc66be79573b597f5f1168df8ec
 * -
 * --- Accepted on 2024-01-31T23:05:52.000Z by 20240131T230552.add_ManifoldProbabilitiesCaches_table_and_annual_review_fields_to_Posts.ts
 * +-- Overall schema hash: 12bd10c01508a33996593d50c80524b2
 *  
 * @@ -1192,3 +1190,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 5cb5ae009dbd81546cd260d4d7228f7d
 * +-- Schema for "Users", hash: 6d7e6f81d5a3146fce465995ed76393e
 *  CREATE TABLE "Users" (
 * @@ -1405,2 +1403,3 @@ CREATE TABLE "Users" (
 *      "wrapped2023Viewed" bool NOT NULL DEFAULT false,
 * +    "linkedGoogleRefreshToken" text,
 *      "schemaVersion" double precision NOT NULL DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "12bd10c01508a33996593d50c80524b2";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "linkedGoogleRefreshToken")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "linkedGoogleRefreshToken")
}
