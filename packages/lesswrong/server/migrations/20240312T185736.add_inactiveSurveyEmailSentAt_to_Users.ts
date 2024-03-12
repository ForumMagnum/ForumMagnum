/**
 * Generated on 2024-03-12T18:57:36.431Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index feca4cc2cd..5912aecce2 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ec6d12fa05425118431d110f2e216b80
 * -
 * --- Accepted on 2024-03-12T12:36:30.000Z by 20240312T123630.create_ForumEvents_table.ts
 * +-- Overall schema hash: 01bf8045d376a34b6a5c7d0d8bfddcaa
 *  
 * @@ -1303,3 +1301,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 3a8013cc70ef2d83d1fd3ec8c97315ce
 * +-- Schema for "Users", hash: af750446e31d4508024688d2ee42896f
 *  CREATE TABLE "Users" (
 * @@ -1517,2 +1515,3 @@ CREATE TABLE "Users" (
 *      "hideSunshineSidebar" bool NOT NULL DEFAULT false,
 * +    "inactiveSurveyEmailSentAt" timestamptz,
 *      "wrapped2023Viewed" bool NOT NULL DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "01bf8045d376a34b6a5c7d0d8bfddcaa";

import Users from "../../lib/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, 'inactiveSurveyEmailSentAt')
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, 'inactiveSurveyEmailSentAt')
}
