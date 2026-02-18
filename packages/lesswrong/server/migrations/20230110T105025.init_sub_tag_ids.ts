/**
 * Generated on 2023-01-10T10:50:25.379Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 262617ce5a..da42e815c1 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: ea71916ffaa87ae0a21302ce831261e6
 * -
 * --- Accepted on 2022-12-30T18:11:10.000Z by 20221230T181110.fix_editable_fields.ts
 * +-- Overall schema hash: 82e629fdd1fb2659bd379e8503ec8b6d
 *  
 * @@ -785,3 +783,3 @@ CREATE TABLE "TagRels" (
 *  
 * --- Schema for "Tags", hash: 5eaf702c518267a7a5f02b17a72f1cdf
 * +-- Schema for "Tags", hash: 5ff558388c8386ddea26be933a0ec743
 *  CREATE TABLE "Tags" (
 * @@ -821,2 +819,3 @@ CREATE TABLE "Tags" (
 *      "parentTagId" varchar(27),
 * +    "subTagIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
 *      "autoTagModel" text DEFAULT '',
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "82e629fdd1fb2659bd379e8503ec8b6d";

import Tags from "../../server/collections/tags/collection";
import { addField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  // Add the new field
  await addField(db, Tags, "subTagIds");

  // Materialize subTagIds for existing parent/subtag relationships
  const parentTags = await db.any(`SELECT "parentTagId", array_agg("_id") as ids FROM "Tags" WHERE "parentTagId" IS NOT NULL GROUP BY "parentTagId";`);
  for (const {parentTagId, ids} of parentTags) {
    await db.any(`UPDATE "Tags" SET "subTagIds" = $1 WHERE "_id" = $2`, [ids, parentTagId]);
  }
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
