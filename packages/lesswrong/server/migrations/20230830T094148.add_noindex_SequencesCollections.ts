/**
 * Generated on 2023-08-30T09:41:48.756Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 3697a0106a..492340e4be 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7d3553d2dcd4a5e47968398dfee076f2
 * -
 * --- Accepted on 2023-08-29T17:06:31.000Z by 20230829T170631.add_hideFromPopularComments_column.ts
 * +-- Overall schema hash: 376cc5bd0bea32065165b70c026dfe15
 *  
 * @@ -808,3 +806,3 @@ CREATE TABLE "Revisions" (
 *  
 * --- Schema for "Sequences", hash: d43b94c6f11e0f139fa70b19443be4bf
 * +-- Schema for "Sequences", hash: 31058b70790531c3e65da4b60d5f749e
 *  CREATE TABLE "Sequences" (
 * @@ -822,2 +820,3 @@ CREATE TABLE "Sequences" (
 *      "hideFromAuthorPage" bool DEFAULT false,
 * +    "noindex" bool DEFAULT false,
 *      "af" bool DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "695076fb79e84a853f06b96943835ff2";

import Collections from "../../server/collections/collections/collection";
import Sequences from "../../server/collections/sequences/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Sequences, "noindex");
  await addField(db, Collections, "noindex");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Sequences, "noindex");
  await dropField(db, Collections, "noindex");
}
