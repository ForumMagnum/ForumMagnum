import { addField, dropField } from "./meta/utils";
import { Tags } from '../../lib/collections/tags/collection';

/**
 * Generated on 2022-12-26T21:08:53.270Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * index 6bdfa3eb0e..15cac45b83 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: afc7cd96d9085ca54d2a50765d02338f
 * -
 * --- Accepted on 2022-12-24T17:14:07.000Z by 20221224T171407.add_comment_title.ts
 * +-- Overall schema hash: 746fe67809bf748504782256c202744c
 *  
 * @@ -784,3 +782,3 @@ CREATE TABLE "TagRels" (
 *  
 * --- Schema for "Tags", hash: c8efd9b78aa33886899a3cc6ef6425d1
 * +-- Schema for "Tags", hash: b913160871861a340a4047d39c047b52
 *  CREATE TABLE "Tags" (
 * @@ -820,2 +818,4 @@ CREATE TABLE "Tags" (
 *      "parentTagId" varchar(27),
 * +    "autoTagModel" text DEFAULT '',
 * +    "autoTagPrompt" text DEFAULT '',
 *      "schemaVersion" double precision DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "746fe67809bf748504782256c202744c";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Tags, "autoTagModel");
  await addField(db, Tags, "autoTagPrompt");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Tags, "autoTagModel");
  await dropField(db, Tags, "autoTagPrompt");
}
