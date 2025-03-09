/**
 * Generated on 2023-10-03T19:54:35.301Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * index 012a90f52c..04991e38b6 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: c7d6d21198c4725672bcea289b5c32ff
 * -
 * --- Accepted on 2023-09-15T22:44:33.000Z by 20230915T224433.create_typing_indicator_table.ts
 * +-- Overall schema hash: 819db4e73eb75d36dad4ede02eb17c1e
 *  
 * @@ -546,3 +544,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: 57fc03583592775f768f897a39c83a6f
 * +-- Schema for "Posts", hash: c6cb7802fe366bb996b40376c38f51db
 *  CREATE TABLE "Posts" (
 * @@ -670,3 +668,3 @@ CREATE TABLE "Posts" (
 *      "sharingSettings" jsonb,
 * -    "shareWithUsers" varchar(27)[],
 * +    "shareWithUsers" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
 *      "linkSharingKey" text,
 * @@ -684,2 +682,3 @@ CREATE TABLE "Posts" (
 *      "debate" bool DEFAULT false,
 * +    "collabEditorDialogue" bool DEFAULT false,
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
export const acceptsSchemaHash = "2e10471e3641d01fe309198fb9ecff32";

import { Posts } from "../../server/collections/posts/collection"
import { updateDefaultValue, addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "collabEditorDialogue");
  await updateDefaultValue(db, Posts, "shareWithUsers");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "collabEditorDialogue");
  await updateDefaultValue(db, Posts, "shareWithUsers");
}
