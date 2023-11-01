/**
 * Generated on 2023-11-01T20:12:39.190Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index e6e19b40e6..c90cbcd244 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: fe5dbcea19da578c02e9189042283f6e
 * -
 * --- Accepted on 2023-10-31T20:19:47.000Z by 20231031T201947.add_givingSeasonNotifyForVoting.ts
 * +-- Overall schema hash: 91ad2a7394e631ea353845caef6277e6
 *  
 * @@ -274,3 +272,3 @@ CREATE TABLE "Digests" (
 *  
 * --- Schema for "ElectionCandidates", hash: 62abe24d31b820b73ada023955f0f5b8
 * +-- Schema for "ElectionCandidates", hash: a7a2f2e4d62f2d0bafdd610dc996f29d
 *  CREATE TABLE "ElectionCandidates" (
 * @@ -281,2 +279,4 @@ CREATE TABLE "ElectionCandidates" (
 *      "href" text NOT NULL,
 * +    "fundraiserLink" text,
 * +    "gwwcLink" text,
 *      "description" text NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "91ad2a7394e631ea353845caef6277e6";

import ElectionCandidates from "../../lib/collections/electionCandidates/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (ElectionCandidates.isPostgres()) {
    await addField(db, ElectionCandidates, "fundraiserLink");
    await addField(db, ElectionCandidates, "gwwcLink");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (ElectionCandidates.isPostgres()) {
    await dropField(db, ElectionCandidates, "fundraiserLink");
    await dropField(db, ElectionCandidates, "gwwcLink");
  }
}
