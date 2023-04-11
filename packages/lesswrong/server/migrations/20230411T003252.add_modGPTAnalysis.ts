/**
 * Generated on 2023-04-11T00:32:52.066Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 3dac491fb4..9739964651 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: cc99890ebfba1e45ded25456d68f852b
 * -
 * --- Accepted on 2023-04-04T17:05:23.000Z by 20230404T170523.add_subtitle.ts
 * +-- Overall schema hash: 01e0671c67b7b095e6aeb446d33d7d88
 *  
 * @@ -108,3 +106,3 @@ CREATE TABLE "CommentModeratorActions" (
 *  
 * --- Schema for "Comments", hash: 31480d0beb75ffb592b7b20e68cbff13
 * +-- Schema for "Comments", hash: 7058cf172c1058c013ef4c19a0654688
 *  CREATE TABLE "Comments" (
 * @@ -158,2 +156,3 @@ CREATE TABLE "Comments" (
 *      "debateResponse" bool,
 * +    "modGPTAnalysis" text,
 * +    "modGPTRecommendation" text,
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
export const acceptsSchemaHash = "01e0671c67b7b095e6aeb446d33d7d88";

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
