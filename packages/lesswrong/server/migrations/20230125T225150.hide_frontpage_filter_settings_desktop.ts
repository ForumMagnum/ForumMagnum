/**
 * Generated on 2023-01-25T22:51:50.553Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 7d2ec35157..c14703bbc9 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 707023204349d37156630a9823919f65
 * -
 * --- Accepted on 2023-01-24T12:03:50.000Z by 20230124T120350.add_subforumPreferredLayout.ts
 * +-- Overall schema hash: 7cbf5077bbfde8c80291425dcd16c9ab
 *  
 * @@ -861,3 +859,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: ba42221cd8e6c8924c8531df2692d80e
 * +-- Schema for "Users", hash: c3c2cbb63b5bee2d02c6a25ada7e8d0d
 *  CREATE TABLE "Users" (
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "7cbf5077bbfde8c80291425dcd16c9ab";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, 'hideFrontpageFilterSettingsDesktop');
  }  
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, 'hideFrontpageFilterSettingsDesktop');
  }  
}
