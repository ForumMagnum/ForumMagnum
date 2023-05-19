/**
 * Generated on 2023-05-18T23:34:29.199Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 67a226c12b..81c50d9530 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 922ce375a3ed4de843e0f4f9cc50dd08
 * -
 * --- Accepted on 2023-05-14T10:46:40.000Z by 20230514T104640.add_voteReceivedCounts.ts
 * +-- Overall schema hash: dbef0c7f4ed8e3bfc7c6fcc52aa1ca52
 *  
 * @@ -917,2 +915,15 @@ CREATE TABLE "UserMostValuablePosts" (
 *  
 * +-- Schema for "UserRateLimits", hash: 9ff733cd44a1d1b8f29f01eaba98dc40
 * +CREATE TABLE "UserRateLimits" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "userId" varchar(27) NOT NULL,
 * +    "type" text NOT NULL,
 * +    "intervalMs" double precision NOT NULL,
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
export const acceptsSchemaHash = "dbef0c7f4ed8e3bfc7c6fcc52aa1ca52";

import { UserRateLimits } from "../../lib/collections/userRateLimits"
import { createTable, dropTable } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (UserRateLimits.isPostgres()) {
    await createTable(db, UserRateLimits)
  }
}

export const down = async ({db}: MigrationContext) => {
  if (UserRateLimits.isPostgres()) {
    await dropTable(db, UserRateLimits);
  }
}
