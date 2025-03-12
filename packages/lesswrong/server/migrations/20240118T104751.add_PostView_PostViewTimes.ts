/**
 * Generated on 2024-01-15T13:37:11.380Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 9910a9946f..81e6bbd208 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 2c8fcbdc99caee38d7f728acc6428352
 * -
 * --- Accepted on 2023-12-28T16:07:33.000Z by 20231228T160733.add_wrapped2023Viewed_to_users.ts
 * +-- Overall schema hash: 9a8be797e0faa0aec22dd455ad77861a
 *  
 * @@ -658,2 +656,14 @@ CREATE TABLE "PostRelations" (
 *  
 * +-- Schema for "PostViews", hash: 41c7073251d6c02bbece00d6a91047c2
 * +CREATE TABLE "PostViews" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "windowStart" timestamptz NOT NULL,
 * +    "windowEnd" timestamptz NOT NULL,
 * +    "postId" varchar(27),
 * +    "viewCount" double precision NOT NULL,
 * +    "schemaVersion" double precision NOT NULL DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "Posts", hash: 34f525156e944ed443d26e4b60b443e9
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "7dbf024fc86645c003e6ca3f42cf3af5";

import PostViewTimes from "../../server/collections/postViewTimes/collection";
import PostViews from "../../server/collections/postViews/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, PostViews);
  await createTable(db, PostViewTimes);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, PostViews);
  await dropTable(db, PostViewTimes);
}
