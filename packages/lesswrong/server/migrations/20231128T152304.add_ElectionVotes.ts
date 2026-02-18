/**
 * Generated on 2023-11-28T15:23:04.866Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index ae273e25f1..d82a4d6ca7 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 2e28d7576d143428c88b6c5a8ece4690
 * -
 * --- Accepted on 2023-11-24T20:09:25.000Z by 20231124T200925.move_on_connect_queries_into_migration.ts
 * +-- Overall schema hash: 7db476f93913b50f646a44166768ced6
 *  
 * @@ -332,2 +330,17 @@ CREATE TABLE "ElectionCandidates" (
 *  
 * +-- Schema for "ElectionVotes", hash: 9cd2a30b6b5e16f674d704243eec8a91
 * +CREATE TABLE "ElectionVotes" (
 * +    _id varchar(27) PRIMARY KEY,
 * +    "electionName" text NOT NULL,
 * +    "userId" varchar(27),
 * +    "compareState" jsonb,
 * +    "vote" jsonb,
 * +    "submittedAt" timestamptz,
 * +    "userExplanation" text,
 * +    "userOtherComments" text,
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
export const acceptsSchemaHash = "7db476f93913b50f646a44166768ced6";

import ElectionVotes from "../../server/collections/electionVotes/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, ElectionVotes);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, ElectionVotes);
}
