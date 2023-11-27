/**
 * Generated on 2023-11-27T14:21:20.475Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index b85a2ae09b..4f2a96952a 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7a18af92067d934f38bfc297cdb1d0d5
 * -
 * --- Accepted on 2023-11-23T12:53:45.000Z by 20231123T125345.add_ElectionVotes.ts
 * +-- Overall schema hash: 7f00935ec1f3a27f238658ec83e678eb
 *  
 * @@ -332,3 +330,3 @@ CREATE TABLE "ElectionCandidates" (
 *  
 * --- Schema for "ElectionVotes", hash: a577e3c0f0095ea2135d5a431ff2ac2c
 * +-- Schema for "ElectionVotes", hash: 23f95509b91b15dfa432f93bcd38c23e
 *  CREATE TABLE "ElectionVotes" (
 * @@ -341,3 +339,5 @@ CREATE TABLE "ElectionVotes" (
 *      "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
 * -    "legacyData" jsonb
 * +    "legacyData" jsonb,
 * +    "userExplanation_latest" text,
 * +    "userOtherComments_latest" text
 *  );
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "7422caa9907e69d3969c375d49949855";

import ElectionVotes from "../../lib/collections/electionVotes/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (ElectionVotes.isPostgres()) {
    await addField(db, ElectionVotes, "userExplanation", true);
    await addField(db, ElectionVotes, "userOtherComments", true);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (ElectionVotes.isPostgres()) {
    await dropField(db, ElectionVotes, "userExplanation", true);
    await dropField(db, ElectionVotes, "userOtherComments", true);
  }
}
