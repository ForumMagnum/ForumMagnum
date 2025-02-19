/**
 * Generated on 2023-11-07T13:57:08.775Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 4e7c77e257..b2370220b9 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: f5e4a3d5459008e1e5f5e83555a849b1
 * -
 * --- Accepted on 2023-11-04T02:07:34.000Z by 20231104T020734.add_DialogueCheck_table_and_check_fields.ts
 * +-- Overall schema hash: 06f1098682e3223d6dff1df3ccfd94fe
 *  
 * @@ -287,3 +285,3 @@ CREATE TABLE "Digests" (
 *  
 * --- Schema for "ElectionCandidates", hash: a7a2f2e4d62f2d0bafdd610dc996f29d
 * +-- Schema for "ElectionCandidates", hash: b2245366e8d137150db8bf807bf95893
 *  CREATE TABLE "ElectionCandidates" (
 * @@ -300,2 +298,5 @@ CREATE TABLE "ElectionCandidates" (
 *      "tagId" varchar(27),
 * +    "gwwcId" text,
 * +    "amountRaised" double precision,
 * +    "targetAmount" double precision,
 *      "schemaVersion" double precision DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "ee6df59dfe7fc9440ca415ce5cb2d762";

import { addField, dropField } from "./meta/utils";
import ElectionCandidates from "../../lib/collections/electionCandidates/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ElectionCandidates, "gwwcId");
  await addField(db, ElectionCandidates, "amountRaised");
  await addField(db, ElectionCandidates, "targetAmount");
  await addField(db, ElectionCandidates, "isElectionFundraiser");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ElectionCandidates, "gwwcId");
  await dropField(db, ElectionCandidates, "amountRaised");
  await dropField(db, ElectionCandidates, "targetAmount");
  await dropField(db, ElectionCandidates, "isElectionFundraiser");
}
