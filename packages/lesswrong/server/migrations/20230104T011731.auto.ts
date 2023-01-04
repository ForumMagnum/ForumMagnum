import { Users } from '../../lib/collections/users/collection';
import { addField } from './meta/utils';

/**
 * Generated on 2023-01-04T01:17:31.530Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 262617ce5a..73ee14186e 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ea71916ffaa87ae0a21302ce831261e6
 * -
 * --- Accepted on 2022-12-30T18:11:10.000Z by 20221230T181110.fix_editable_fields.ts
 * +-- Overall schema hash: c46af5d867666c2447ff14368afc0df2
 *  
 * @@ -858,3 +856,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 84a4b26181f3f998f08730b47351406e
 * +-- Schema for "Users", hash: 8441f45ed6575024b2341f7844087cf5
 *  CREATE TABLE "Users" (
 * @@ -894,2 +892,3 @@ CREATE TABLE "Users" (
 *      "frontpageFilterSettings" jsonb,
 * +    "hideFrontpageFilterSettingsDesktop" bool,
 *      "allPostsTimeframe" text,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "c46af5d867666c2447ff14368afc0df2";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, 'hideFrontpageFilterSettingsDesktop');
  }
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
