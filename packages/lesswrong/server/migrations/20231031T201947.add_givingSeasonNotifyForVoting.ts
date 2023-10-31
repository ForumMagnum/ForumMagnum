/**
 * Generated on 2023-10-31T20:19:47.706Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jpaddison/cea/Forum/ForumMagnum/schema/accepted_schema.sql b/Users/jpaddison/cea/Forum/ForumMagnum/schema/schema_to_accept.sql
 * index 609cdbf7e0..b1a0d33f4f 100644
 * --- a/Users/jpaddison/cea/Forum/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jpaddison/cea/Forum/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 5e28a08c9be1ba704a99a94dab5c4fae
 * -
 * --- Accepted on 2023-10-27T15:43:13.000Z by 20231027T154313.add_election_candidates_collection.ts
 * +-- Overall schema hash: fe5dbcea19da578c02e9189042283f6e
 *  
 * @@ -1061,3 +1059,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 28b52051adbbce3dec100b42997d7281
 * +-- Schema for "Users", hash: fc1a327ccb0a3cc96ea420c5a9a7f1fe
 *  CREATE TABLE "Users" (
 * @@ -1157,2 +1155,3 @@ CREATE TABLE "Users" (
 *      "karmaChangeBatchStart" timestamptz,
 * +    "givingSeasonNotifyForVoting" bool DEFAULT false,
 *      "emailSubscribedToCurated" bool,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [x] Rename this file to something more readable
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "fe5dbcea19da578c02e9189042283f6e";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "givingSeasonNotifyForVoting");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "givingSeasonNotifyForVoting");
  }
}
