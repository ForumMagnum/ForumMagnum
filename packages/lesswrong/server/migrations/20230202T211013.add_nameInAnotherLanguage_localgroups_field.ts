/**
 * Generated on 2023-02-02T21:10:13.684Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 343f1c362e..4bf6f1052f 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 7ea7cade23d0b233b794be743cd6ebaf
 * -
 * --- Accepted on 2023-02-01T15:58:39.000Z by 20230201T155839.add_importAsDraft_field.ts
 * +-- Overall schema hash: df6daf9edd46c15e6eb9a3862852ae85
 *  
 * @@ -311,3 +309,3 @@ CREATE TABLE "LegacyData" (
 *  
 * --- Schema for "Localgroups", hash: 0cad75cd4e4327d68d37f6a649cbd92c
 * +-- Schema for "Localgroups", hash: ceb5bb8e5888f0ed3be16247c77cc701
 *  CREATE TABLE "Localgroups" (
 * @@ -315,2 +313,3 @@ CREATE TABLE "Localgroups" (
 *      "name" text,
 * +    "nameInAnotherLanguage" text,
 *      "organizerIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable if you wish
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "df6daf9edd46c15e6eb9a3862852ae85";

import Localgroups from "../../server/collections/localgroups/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Localgroups, "nameInAnotherLanguage");
  await addField(db, Localgroups, "salesforceId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Localgroups, "nameInAnotherLanguage");
  await dropField(db, Localgroups, "salesforceId");
}
