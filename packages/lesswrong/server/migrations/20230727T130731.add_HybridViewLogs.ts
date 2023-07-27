/**
 * Generated on 2023-07-27T13:07:31.048Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 0cf1e5d2e6..32b7fc6f23 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 1f4a770fddeffde4615bb22682170332
 * -
 * --- Accepted on 2023-07-19T20:21:58.000Z by 20230719T202158.top_level_comment_count.ts
 * +-- Overall schema hash: c0cf977bfbc42aa0bfe01a2079a383ee
 *  
 * @@ -309,2 +307,17 @@ CREATE TABLE "GardenCodes" (
 *  
 * +-- Schema for "HybridViewLogs", hash: 9f0825a6cbf6c2df51444de951fbbe79
 * +CREATE TABLE "HybridViewLogs" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "identifier" text,
 * +    "versionHash" text,
 * +    "action" text,
 * +    "actionStartTime" timestamptz,
 * +    "actionEndTime" timestamptz,
 * +    "latest" bool,
 * +    "status" text,
 * +    "schemaVersion" double precision DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "Images", hash: d5c0e2cc0076979514fea7b1d77ca57b
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "c0cf977bfbc42aa0bfe01a2079a383ee";

import HybridViewLogs from "../../lib/collections/hybridViewLogs/collection"
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (!HybridViewLogs.isPostgres()) return;
  
  await createTable(db, HybridViewLogs);
}

export const down = async ({db}: MigrationContext) => {
  if (!HybridViewLogs.isPostgres()) return;
  
  await dropTable(db, HybridViewLogs);
}
