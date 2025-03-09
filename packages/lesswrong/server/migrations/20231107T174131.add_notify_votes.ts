/**
 * Generated on 2023-11-03T16:41:03.119Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 995f4f043b..fd925ae768 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 0cc5ac04b5c4340a894f1bef511f22a9
 * -
 * --- Accepted on 2023-11-01T21:57:39.000Z by 20231101T215739.add_givingSeasonNotifyForVoting_and_election_candidate_links.ts
 * +-- Overall schema hash: 171395e601662a4cfbf3c702ef274cfe
 *  
 * @@ -1278,3 +1276,3 @@ CREATE TABLE "Users" (
 *  
 * --- Schema for "Votes", hash: e721bea34b434e05b0acf89fe15f166c
 * +-- Schema for "Votes", hash: 8acc6d7b584e6494278eb3a6c45e974d
 *  CREATE TABLE "Votes" (
 * @@ -1293,2 +1291,3 @@ CREATE TABLE "Votes" (
 *      "documentIsAf" bool DEFAULT false,
 * +    "notify" bool DEFAULT true,
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
export const acceptsSchemaHash = "5ec9053a5ae6f6135087becd69fa485e";

import Votes from "../../server/collections/votes/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Votes, "silenceNotification");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Votes, "silenceNotification");
}
