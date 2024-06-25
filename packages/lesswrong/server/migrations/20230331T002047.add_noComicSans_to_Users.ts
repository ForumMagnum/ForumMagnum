/**
 * Generated on 2023-03-31T00:20:47.472Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 3cf95ce1cd..b1c666c1b1 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 9cc5aad21f36f801d9ce6b9e9e3ce213
 * -
 * --- Accepted on 2023-03-14T15:22:03.000Z by 20230314T152203.add_backfilled.ts
 * +-- Overall schema hash: 222d42945763fb6dcaff3b497911d7b7
 *  
 * @@ -889,3 +887,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 81c37a8199dc46ac8d6053b9455dada5
 * +-- Schema for "Users", hash: dca06a3ff139a831e465b8a67f6f9e68
 *  CREATE TABLE "Users" (
 * @@ -921,2 +919,3 @@ CREATE TABLE "Users" (
 *      "showCommunityInRecentDiscussion" bool DEFAULT false,
 * +    "noComicSans" bool DEFAULT false,
 *      "petrovOptOut" bool DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "222d42945763fb6dcaff3b497911d7b7";

import Users from "../../lib/collections/users/collection"
import { BoolType } from "../../server/sql/Type";
import { addRemovedField, dropRemovedField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "noComicSans", new BoolType())
}

export const down = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "noComicSans")
}
