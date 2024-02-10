/**
 * Generated on 2024-02-09T22:49:51.975Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index caba92a145..33969005d6 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 697d99679120595b0bfbb1e787f11eb9
 * -
 * --- Accepted on 2024-02-08T22:00:32.000Z by 20240208T220032.add_ReviewWinnerArts_and_SplashArtCoordinates.ts
 * +-- Overall schema hash: b3eabdc2257c2f53b54927ed9bdc654a
 *  
 * @@ -949,3 +947,3 @@ CREATE TABLE "ReviewWinnerArts" (
 *  
 * --- Schema for "ReviewWinners", hash: 2607729e53f739e0a42bbfe49998314a
 * +-- Schema for "ReviewWinners", hash: 255b7e802e0b9f8a15742b307267dbf8
 *  CREATE TABLE "ReviewWinners" (
 * @@ -954,2 +952,3 @@ CREATE TABLE "ReviewWinners" (
 *      "reviewYear" double precision NOT NULL,
 * +    "category" text NOT NULL DEFAULT 'misc',
 *      "curatedOrder" double precision NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "b3eabdc2257c2f53b54927ed9bdc654a";

import ReviewWinners from "../../lib/collections/reviewWinners/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, ReviewWinners, 'category');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ReviewWinners, 'category');
}
