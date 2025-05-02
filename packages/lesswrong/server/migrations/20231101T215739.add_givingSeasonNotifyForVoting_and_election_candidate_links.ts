/**
 * Generated on 2023-11-01T21:57:39.699Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index f9261cb496..11c3ebba3b 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ee9f40a8166012becef3bf0f5a9726b0
 * -
 * --- Accepted on 2023-10-28T01:20:12.000Z by 20231028T012012.add_notificationAddedAsCoauthor.ts
 * +-- Overall schema hash: 0cc5ac04b5c4340a894f1bef511f22a9
 *  
 * @@ -1063,3 +1061,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: b27730e9f93ef74e21bbea8d6f188b80
 * +-- Schema for "Users", hash: 50f4feeb1374733e404020c3513d1892
 *  CREATE TABLE "Users" (
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "0cc5ac04b5c4340a894f1bef511f22a9";

import ElectionCandidates from "../../server/collections/electionCandidates/collection";
import Users from "../../server/collections/users/collection";
import { BoolType } from "@/server/sql/Type";
import { addField, addRemovedField, dropField, dropRemovedField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "givingSeasonNotifyForVoting", new BoolType());
  await addField(db, ElectionCandidates, "fundraiserLink");
  await addField(db, ElectionCandidates, "gwwcLink");
}

export const down = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "givingSeasonNotifyForVoting");
  await dropField(db, ElectionCandidates, "fundraiserLink");
  await dropField(db, ElectionCandidates, "gwwcLink");
}
