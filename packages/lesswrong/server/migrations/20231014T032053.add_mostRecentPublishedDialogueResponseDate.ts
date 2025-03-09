/**
 * Generated on 2023-10-14T03:20:53.224Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * index 614b2f2bb4..e5adf212d7 100644
 * --- a/Users/jacob/Documents/lw_big/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/jacob/Documents/lw_big/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 881c509060130982ab7f20a92a5c9602
 * -
 * --- Accepted on 2023-10-09T10:16:21.000Z by 20231009T101621.add_wasEverUndrafted_to_posts.ts
 * +-- Overall schema hash: c3e1e47f98b00ea1ff4f2dfe2e646604
 *  
 * @@ -546,3 +544,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: e67887c8c10ef852b3dfaee89c04a20a
 * +-- Schema for "Posts", hash: e2904e780f0bd3a8294f7f504f6e372d
 *  CREATE TABLE "Posts" (
 * @@ -686,2 +684,3 @@ CREATE TABLE "Posts" (
 *      "collabEditorDialogue" bool DEFAULT false,
 * +    "mostRecentPublishedDialogueResponseDate" timestamptz,
 *      "rejected" bool DEFAULT false,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "c3e1e47f98b00ea1ff4f2dfe2e646604";

import { Posts } from "../../server/collections/posts/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {  
  await addField(db, Posts, "mostRecentPublishedDialogueResponseDate");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "mostRecentPublishedDialogueResponseDate");
}
