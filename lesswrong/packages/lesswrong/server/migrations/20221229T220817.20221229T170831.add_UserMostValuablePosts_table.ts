import UserMostValuablePosts from "../../lib/collections/userMostValuablePosts/collection";
import { createTable, dropTable } from "./meta/utils";

/**
 * Generated on 2022-12-29T22:08:17.869Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 6bdfa3eb0e..3246075c44 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: afc7cd96d9085ca54d2a50765d02338f
 * -
 * --- Accepted on 2022-12-24T17:14:07.000Z by 20221224T171407.add_comment_title.ts
 * +-- Overall schema hash: f4f463411c2e217e442be3f540ae0f74
 *  
 * @@ -829,2 +827,13 @@ CREATE TABLE "Tags" (
 *  
 * +-- Schema for "UserMostValuablePosts", hash: 7ef73010687dba18fda0b20b6f38871e
 * +CREATE TABLE "UserMostValuablePosts" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "userId" varchar(27),
 * +    "postId" varchar(27),
 * +    "deleted" bool DEFAULT false,
 * +    "schemaVersion" double precision DEFAULT 1,
 * +    "createdAt" timestamptz,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "UserTagRels", hash: 0d561800b9a8262660a82c0e4125d99a
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "f9a5c9f182dad6b94bd1361b603906fd";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, UserMostValuablePosts);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, UserMostValuablePosts);
}
