/**
 * Generated on 2023-04-12T18:58:46.157Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/sarah/EAForum/schema/accepted_schema.sql b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * index 4b69c19307..89191c2cc3 100644
 * --- a/Users/sarah/EAForum/schema/accepted_schema.sql
 * +++ b/Users/sarah/EAForum/schema/schema_to_accept.sql
 * @@ -4,6 +4,3 @@
 *  --
 * -
 * --- Overall schema hash: 1728cb3d532414ce56d22566ab53c3be
 * -
 * --- Accepted on 2023-04-11T17:26:12.000Z by 20230411T172612.add_hideCommunitySection_to_users.ts
 * +-- Overall schema hash: 64c57945e3105d8daf5be8d51a1ee559
 *  
 * @@ -160,2 +157,4 @@ CREATE TABLE "Comments" (
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
export const acceptsSchemaHash = "64c57945e3105d8daf5be8d51a1ee559";

import Comments from "../../server/collections/comments/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Comments, "modGPTAnalysis")
  await addField(db, Comments, "modGPTRecommendation")
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, "modGPTAnalysis")
  await dropField(db, Comments, "modGPTRecommendation")
}
