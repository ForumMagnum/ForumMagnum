/**
 * Generated on 2023-08-16T20:38:07.177Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * index 5249d88575..d75708ee3d 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: d7266200db426f47cd1ba7abcc6a6db7
 * -
 * --- Accepted on 2023-08-07T23:01:23.000Z by 20230807T230123.add_hideHomeRHS_to_Users.ts
 * +-- Overall schema hash: 4aca6d1717b9bb1f98fa154bd99ea8a5
 *  
 * @@ -1003,3 +1001,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 6af340dca1e5f32d30449abd73726b6f
 * +-- Schema for "Users", hash: 269813160b5b2c5562d86035253bf007
 *  CREATE TABLE "Users" (
 * @@ -1121,2 +1119,3 @@ CREATE TABLE "Users" (
 *      "hideFrontpageBook2019Ad" bool,
 * +    "hideFrontpageBook2020Ad" bool,
 *      "sunshineNotes" text DEFAULT '',
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "4aca6d1717b9bb1f98fa154bd99ea8a5";

import Users from "../../server/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "hideFrontpageBook2020Ad");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "hideFrontpageBook2020Ad");
}
