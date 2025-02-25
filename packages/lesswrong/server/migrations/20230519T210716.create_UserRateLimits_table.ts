/**
 * Generated on 2023-05-19T21:07:16.807Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 67a226c12b..440b38d272 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 922ce375a3ed4de843e0f4f9cc50dd08
 * -
 * --- Accepted on 2023-05-14T10:46:40.000Z by 20230514T104640.add_voteReceivedCounts.ts
 * +-- Overall schema hash: cc8bba3f53cc75cb4b3864c0426830a8
 *  
 * @@ -917,2 +915,16 @@ CREATE TABLE "UserMostValuablePosts" (
 *  
 * +-- Schema for "UserRateLimits", hash: c620c5dd0be792a2f68614111626f3cf
 * +CREATE TABLE "UserRateLimits" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "userId" varchar(27) NOT NULL,
 * +    "type" text NOT NULL,
 * +    "intervalUnit" text NOT NULL,
 * +    "intervalLength" double precision NOT NULL,
 * +    "actionsPerInterval" double precision NOT NULL,
 * +    "endedAt" timestamptz,
 * +    "schemaVersion" double precision DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "UserTagRels", hash: 5a3d10302be2b58e21dc7771941b3927
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "cc8bba3f53cc75cb4b3864c0426830a8";

import { UserRateLimits } from "../../lib/collections/userRateLimits/collection"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await createTable(db, UserRateLimits)
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, UserRateLimits);
}
