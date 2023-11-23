/**
 * Generated on 2023-11-23T12:53:45.930Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index bfdf816b92..7399c75413 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 6d8270f44805a1ee0b363924964776e7
 * -
 * --- Accepted on 2023-11-21T12:12:51.000Z by 20231121T121251.add_givingSeason2023DonatedFlair.ts
 * +-- Overall schema hash: 7a18af92067d934f38bfc297cdb1d0d5
 *  
 * @@ -332,2 +330,14 @@ CREATE TABLE "ElectionCandidates" (
 *  
 * +-- Schema for "ElectionVotes", hash: a577e3c0f0095ea2135d5a431ff2ac2c
 * +CREATE TABLE "ElectionVotes" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "electionName" text NOT NULL,
 * +    "userId" varchar(27),
 * +    "vote" jsonb,
 * +    "submittedAt" timestamptz,
 * +    "schemaVersion" double precision DEFAULT 1,
 * +    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
 * +    "legacyData" jsonb
 * +);
 * +
 *  -- Schema for "ElicitQuestionPredictions", hash: d88e9edfd51ca83ad514a77d69a6779b
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "7a18af92067d934f38bfc297cdb1d0d5";

import ElectionVotes from "../../lib/collections/electionVotes/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (ElectionVotes.isPostgres()) {
    await createTable(db, ElectionVotes);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (ElectionVotes.isPostgres()) {
    await dropTable(db, ElectionVotes);
  }
}
