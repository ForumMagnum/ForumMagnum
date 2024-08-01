/**
 * Generated on 2024-08-01T07:04:11.104Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * index 93be302313..a0789e792e 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: a2faca5a61a921ed5828a0be4fb26461
 * -
 * --- Accepted on 2024-07-04T13:57:16.000Z by 20240704T135716.add_permanentDeletionRequestedAt.ts
 * +-- Overall schema hash: a930ad918f310c7a443ceb43525dfdd1
 *  
 * @@ -1392,3 +1390,3 @@ CREATE INDEX IF NOT EXISTS "idx_PostViews_windowStart" ON "PostViews" USING btre
 *  
 * --- Table "Posts", hash f69f78a31845fa492d917bc3762dad7a
 * +-- Table "Posts", hash d4d79f955c7b9d530d2d76d899bc71c3
 *  CREATE TABLE "Posts" (
 * @@ -1525,2 +1523,3 @@ CREATE TABLE "Posts" (
 *    "sideCommentVisibility" TEXT,
 * +  "disableSidenotes" BOOL NOT NULL DEFAULT FALSE,
 *    "moderationStyle" TEXT,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "a930ad918f310c7a443ceb43525dfdd1";

import { Posts } from "@/lib/collections/posts";
import { addField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "disableSidenotes");
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
