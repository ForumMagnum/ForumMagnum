/**
 * Generated on 2023-06-08T20:45:14.706Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index cec07694d1..fe66fc851c 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 8ecc349268b355e0efe1de9fba8c38f9
 * -
 * --- Accepted on 2023-05-24T18:34:35.000Z by 20230524T183435.add_hidePostsRecommendations_field.ts
 * +-- Overall schema hash: 6e28f55ed0de0da2c75b4284178ba6e1
 *  
 * @@ -945,3 +943,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 6f8226d2c58e8bd70923fed15ffa4938
 * +-- Schema for "Users", hash: d64da8350def59cbeb640f264a7b09a4
 *  CREATE TABLE "Users" (
 * @@ -966,2 +964,3 @@ CREATE TABLE "Users" (
 *      "sortDraftsBy" text,
 * +    "reactPaletteStyle" text DEFAULT 'listView',
 *      "noKibitz" bool,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "6e28f55ed0de0da2c75b4284178ba6e1";

import Users from "../../server/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "reactPaletteStyle");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "reactPaletteStyle");
}

