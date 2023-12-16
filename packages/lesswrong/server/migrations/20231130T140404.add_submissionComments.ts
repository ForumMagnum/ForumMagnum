/**
 * Generated on 2023-11-30T14:04:04.033Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 74f2512cc4..43c2c39d71 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ea10555b6fef67efb7ab0cbbdfdb8772
 * -
 * --- Accepted on 2023-11-30T01:26:54.000Z by 20231130T012654.changeDefaultNewCheckNotificationFrequencyRealtime.ts
 * +-- Overall schema hash: edca7fde4fce09bf9031f2f3f9b18fda
 *  
 * @@ -332,3 +330,3 @@ CREATE TABLE "ElectionCandidates" (
 *  
 * --- Schema for "ElectionVotes", hash: 9cd2a30b6b5e16f674d704243eec8a91
 * +-- Schema for "ElectionVotes", hash: d29025d2b4416e8868ddb33d06d8bc65
 *  CREATE TABLE "ElectionVotes" (
 * @@ -340,2 +338,3 @@ CREATE TABLE "ElectionVotes" (
 *      "submittedAt" timestamptz,
 * +    "submissionComments" jsonb,
 *      "userExplanation" text,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "edca7fde4fce09bf9031f2f3f9b18fda";

import ElectionVotes from "../../lib/collections/electionVotes/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, ElectionVotes, "submissionComments")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ElectionVotes, "submissionComments")
}
