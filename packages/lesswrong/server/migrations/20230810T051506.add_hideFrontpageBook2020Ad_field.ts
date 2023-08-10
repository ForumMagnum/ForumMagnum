/**
 * Generated on 2023-08-10T05:15:06.537Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql b/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * index 25d15814a6..618e73ea04 100644
 * --- a/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/accepted_schema.sql
 * +++ b/Users/raymondarnold/Documents/LessWrongSuite/Lesswrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: e7d890dadc54453234507be13698b7b7
 * -
 * --- Accepted on 2023-07-27T12:20:27.000Z by 20230727T122027.add_isPostType_field.ts
 * +-- Overall schema hash: cbb83104f3628956058186f0e2c1b1bf
 *  
 * @@ -1003,3 +1001,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: d64da8350def59cbeb640f264a7b09a4
 * +-- Schema for "Users", hash: 7641869ff4e3e926d16e9165f4894b85
 *  CREATE TABLE "Users" (
 * @@ -1120,2 +1118,3 @@ CREATE TABLE "Users" (
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
export const acceptsSchemaHash = "cbb83104f3628956058186f0e2c1b1bf";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, "hideFrontpageBook2020Ad");
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, "hideFrontpageBook2020Ad");
  }
}
