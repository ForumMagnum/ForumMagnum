/**
 * Generated on 2023-04-11T15:56:55.928Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index c6e379aecd..7c35984cc6 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 380d30e2ea28cacb71bbc6d29e540a6e
 * -
 * --- Accepted on 2023-04-07T21:47:51.000Z by 20230407T214751.add_rejection_fields.ts
 * +-- Overall schema hash: c5ccc671021bb4cd474dee04fe90578d
 *  
 * @@ -108,3 +106,3 @@ CREATE TABLE "CommentModeratorActions" (
 *  
 * --- Schema for "Comments", hash: 1c77433ee8754e841a073c882ee2f7ef
 * +-- Schema for "Comments", hash: aff61766f86b6129215dc4cd710aa12a
 *  CREATE TABLE "Comments" (
 * @@ -159,2 +157,4 @@ CREATE TABLE "Comments" (
 *      "rejected" bool DEFAULT false,
 * +    "modGPTAnalysis" text,
 * +    "modGPTRecommendation" text,
 *      "rejectedByUserId" varchar(27),
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "c5ccc671021bb4cd474dee04fe90578d";

import Comments from "../../lib/collections/comments/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (!Comments.isPostgres()) return
  
  await addField(db, Comments, "modGPTAnalysis")
  await addField(db, Comments, "modGPTRecommendation")
}

export const down = async ({db}: MigrationContext) => {
  if (!Comments.isPostgres()) return
  
  await dropField(db, Comments, "modGPTAnalysis")
  await dropField(db, Comments, "modGPTRecommendation")
}
