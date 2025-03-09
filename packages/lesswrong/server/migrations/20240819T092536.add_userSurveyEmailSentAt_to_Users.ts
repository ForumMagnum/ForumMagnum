/**
 * Generated on 2024-08-19T09:25:36.353Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 5dff046abe..9203fea8ff 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d2ff8b556fc6f740b2bb57ddf5347f64
 * -
 * --- Accepted on 2024-07-29T18:30:41.000Z by 20240729T183041.normalize_post_contents.ts
 * +-- Overall schema hash: 5525ab08d75613c64270cbb15da2ae94
 *  
 * @@ -3004,3 +3002,3 @@ CREATE UNIQUE INDEX IF NOT EXISTS "idx_UserTagRels_tagId_userId" ON "UserTagRels
 *  
 * --- Table "Users", hash fc2302228267a47ab8a5bb65859fd0d4
 * +-- Table "Users", hash 5a1821c6b50f8beeeb4a00f69b53a822
 *  CREATE TABLE "Users" (
 * @@ -3223,2 +3221,3 @@ CREATE TABLE "Users" (
 *    "inactiveSurveyEmailSentAt" TIMESTAMPTZ,
 * +  "userSurveyEmailSentAt" TIMESTAMPTZ,
 *    "schemaVersion" DOUBLE PRECISION NOT NULL DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "5525ab08d75613c64270cbb15da2ae94";

import Users from "../../server/collections/users/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, 'userSurveyEmailSentAt')
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, 'userSurveyEmailSentAt')
}
