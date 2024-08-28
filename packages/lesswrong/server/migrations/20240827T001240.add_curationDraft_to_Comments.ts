/**
 * Generated on 2024-08-27T00:12:40.671Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/benpace/LessWrongAll/LessWrongCode/ForumMagnum/schema/accepted_schema.sql b/Users/benpace/LessWrongAll/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * index 4472b6d717..cadbe69e67 100644
 * --- a/Users/benpace/LessWrongAll/LessWrongCode/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/benpace/LessWrongAll/LessWrongCode/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 5525ab08d75613c64270cbb15da2ae94
 * -
 * --- Accepted on 2024-08-19T09:25:36.000Z by 20240819T092536.add_userSurveyEmailSentAt_to_Users.ts
 * +-- Overall schema hash: 4a6d0038d21a3db45d2044d40c12fc3f
 *  
 * @@ -208,3 +206,3 @@ CREATE INDEX IF NOT EXISTS "idx_CommentModeratorActions_commentId_createdAt" ON
 *  
 * --- Table "Comments", hash aa681fc4c5cbde08e7165cdad440ceeb
 * +-- Table "Comments", hash 00ede27b6c37834e3cbbe75bb33c93a2
 *  CREATE TABLE "Comments" (
 * @@ -256,2 +254,3 @@ CREATE TABLE "Comments" (
 *    "isPinnedOnProfile" BOOL NOT NULL DEFAULT FALSE,
 * +  "curationDraft" BOOL NOT NULL DEFAULT FALSE,
 *    "title" VARCHAR(500),
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "4a6d0038d21a3db45d2044d40c12fc3f";

import { Comments } from "@/lib/collections/comments"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Comments, "curationDraft")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, "curationDraft")
}
