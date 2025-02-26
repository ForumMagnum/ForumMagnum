/**
 * Generated on 2024-08-20T18:32:33.397Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * index 4472b6d717..145d7f7c31 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 5525ab08d75613c64270cbb15da2ae94
 * -
 * --- Accepted on 2024-08-19T09:25:36.000Z by 20240819T092536.add_userSurveyEmailSentAt_to_Users.ts
 * +-- Overall schema hash: dc66ac034a766a7dd21afb2e072073a3
 *  
 * @@ -1392,3 +1390,3 @@ CREATE INDEX IF NOT EXISTS "idx_PostViews_windowStart" ON "PostViews" USING btre
 *  
 * --- Table "Posts", hash 844cb570f631ddd17ba43c82ff31b266
 * +-- Table "Posts", hash 0aca5526a61ad46c3ab55bdc71ffb879
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
export const acceptsSchemaHash = "dc66ac034a766a7dd21afb2e072073a3";

import { Posts } from "@/lib/collections/posts/collection.ts";
import { addField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "disableSidenotes");
}

export const down = async ({db}: MigrationContext) => {
}
