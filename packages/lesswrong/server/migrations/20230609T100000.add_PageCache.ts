/**
 * Generated on 2023-06-01T15:31:25.367Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index cec07694d1..bbbb5265ca 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8ecc349268b355e0efe1de9fba8c38f9
 * -
 * --- Accepted on 2023-05-24T18:34:35.000Z by 20230524T183435.add_hidePostsRecommendations_field.ts
 * +-- Overall schema hash: ce7fb195e89571423db77ebabc3e5083
 *  
 * @@ -419,2 +417,16 @@ CREATE TABLE "Notifications" (
 *  
 * +-- Schema for "PageCache", hash: e63a25c981008d7980870066afa7142e
 * +CREATE TABLE "PageCache" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "path" text,
 * +    "abTestGroups" jsonb,
 * +    "bundleHash" text,
 * +    "renderedAt" timestamptz,
 * +    "ttlMs" double precision,
 * +    "renderResult" jsonb,
 * +    "schemaVersion" double precision DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "PetrovDayLaunchs", hash: 5b1dee358cd18fda79006cc24eb465b6
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "8f9b37b6b8213a24c21dba39e77f7bbb";

import PageCache from "../../lib/collections/pagecache/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, PageCache)
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, PageCache)
}
