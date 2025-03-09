/**
 * Generated on 2023-01-28T01:02:15.060Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 44dc4486ea..634ed25ede 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: f74d70468a0d76011ef39059dc9584d5
 * -
 * --- Accepted on 2023-01-25T22:32:59.000Z by 20230125T223259.user_mentions_newMentionNotifictions.ts
 * +-- Overall schema hash: 619ed0268e244678740dac4731f64051
 *  
 * @@ -864,3 +862,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 119779a0cbbfc3d7b7d75c3ffed47970
 * +-- Schema for "Users", hash: 1ed3426ba7931d385e326044273456f6
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
export const acceptsSchemaHash = "619ed0268e244678740dac4731f64051";

import Users from "../../server/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, 'hideFrontpageFilterSettingsDesktop');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, 'hideFrontpageFilterSettingsDesktop');
}
