/**
 * NB: Shenanagins were had after generation
 * Generated on 2023-01-20T17:29:21.905Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jpaddison/cea/Forum/ForumMagnum/schema/accepted_schema.sql b/Users/jpaddison/cea/Forum/ForumMagnum/schema/schema_to_accept.sql
 * index 438f6cd32b..07a4426c8f 100644
 * --- a/Users/jpaddison/cea/Forum/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jpaddison/cea/Forum/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: afb5555a6e3a18714877036b68c63786
 * -
 * --- Accepted on 2023-01-18T13:58:40.000Z by 20230118T135840.createdAt_default_value.ts
 * +-- Overall schema hash: 41d785c82046299974ee787e8cd20200
 *
 * @@ -718,3 +716,3 @@ CREATE TABLE "Sequences" (
 *
 * --- Schema for "Spotlights", hash: 7063ae542c4289a0df6d73e7ab360ee6
 * +-- Schema for "Spotlights", hash: f0d6e702f9c8af30ea203fe94badbbe5
 *  CREATE TABLE "Spotlights" (
 * @@ -730,2 +728,3 @@ CREATE TABLE "Spotlights" (
 *      "spotlightImageId" text,
 * +    "showAuthor" bool NOT NULL DEFAULT false,
 *      "schemaVersion" double precision DEFAULT 1,
 *
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [x] Write a migration to represent these changes
 * - [x] Rename this file to something more readable if you wish
 * - [x] Uncomment `acceptsSchemaHash` below
 * - [x] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "f167b9a94ae9eebe159267d6ca82d3a4";

import Spotlights from "../../lib/collections/spotlights/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Spotlights, "showAuthor")
  await addField(db, Spotlights, "spotlightDarkImageId")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Spotlights, "showAuthor")
  await dropField(db, Spotlights, "spotlightDarkImageId")
}
