/**
 * Generated on 2023-11-28T13:56:17.941Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 3d0730a3cc..8978dcf9c3 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 62a2849938fd258591b594ecd0792071
 * -
 * --- Accepted on 2023-11-27T14:21:20.000Z by 20231127T142120.add_electionCommentFields.ts
 * +-- Overall schema hash: 0da4ab524742b76e8cc73fd7520b0a9f
 *  
 * @@ -332,3 +330,3 @@ CREATE TABLE "ElectionCandidates" (
 *  
 * --- Schema for "ElectionVotes", hash: de98c981b1f3e67b7fc3d78fd6e63e32
 * +-- Schema for "ElectionVotes", hash: 9cd2a30b6b5e16f674d704243eec8a91
 *  CREATE TABLE "ElectionVotes" (
 * @@ -337,2 +335,3 @@ CREATE TABLE "ElectionVotes" (
 *      "userId" varchar(27),
 * +    "compareState" jsonb,
 *      "vote" jsonb,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "0da4ab524742b76e8cc73fd7520b0a9f";

import ElectionVotes from "../../lib/collections/electionVotes/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (ElectionVotes.isPostgres()) {
    await addField(db, ElectionVotes, "compareState", true);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (ElectionVotes.isPostgres()) {
    await dropField(db, ElectionVotes, "compareState", true);
  }
}
