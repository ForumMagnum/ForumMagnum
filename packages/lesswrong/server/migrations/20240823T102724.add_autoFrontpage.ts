/**
 * Generated on 2024-08-23T10:27:24.899Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 5dff046abe..104dfd482e 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d2ff8b556fc6f740b2bb57ddf5347f64
 * -
 * --- Accepted on 2024-07-29T18:30:41.000Z by 20240729T183041.normalize_post_contents.ts
 * +-- Overall schema hash: b65bb984b87ea0580011b7ecd91c8c51
 *  
 * @@ -1392,3 +1390,3 @@ CREATE INDEX IF NOT EXISTS "idx_PostViews_windowStart" ON "PostViews" USING btre
 *  
 * --- Table "Posts", hash 844cb570f631ddd17ba43c82ff31b266
 * +-- Table "Posts", hash c92cd9d68fe70269d40abb79437d9194
 *  CREATE TABLE "Posts" (
 * @@ -1464,2 +1462,3 @@ CREATE TABLE "Posts" (
 *    "frontpageDate" TIMESTAMPTZ,
 * +  "autoFrontpage" TEXT,
 *    "collectionTitle" TEXT,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "eb768d8bdc708f08c58c7db559625f10";

import { Posts } from "@/server/collections/posts/collection.ts"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "autoFrontpage")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "autoFrontpage")
}
