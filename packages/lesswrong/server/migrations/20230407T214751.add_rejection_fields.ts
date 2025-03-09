/**
 * Generated on 2023-04-07T21:47:51.515Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 3dac491fb4..f170ddb9b9 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: cc99890ebfba1e45ded25456d68f852b
 * -
 * --- Accepted on 2023-04-04T17:05:23.000Z by 20230404T170523.add_subtitle.ts
 * +-- Overall schema hash: 380d30e2ea28cacb71bbc6d29e540a6e
 *  
 * @@ -108,3 +106,3 @@ CREATE TABLE "CommentModeratorActions" (
 *  
 * --- Schema for "Comments", hash: 31480d0beb75ffb592b7b20e68cbff13
 * +-- Schema for "Comments", hash: 1c77433ee8754e841a073c882ee2f7ef
 *  CREATE TABLE "Comments" (
 * @@ -158,2 +156,4 @@ CREATE TABLE "Comments" (
 *      "debateResponse" bool,
 * +    "rejected" bool DEFAULT false,
 * +    "rejectedByUserId" varchar(27),
 *      "af" bool DEFAULT false,
 * @@ -459,3 +459,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: 7e15ffdf0cce8f17f7a7e1b5e09a7574
 * +-- Schema for "Posts", hash: 3af0a7c4d804abbea3f2a8396a737aeb
 *  CREATE TABLE "Posts" (
 * @@ -590,2 +590,4 @@ CREATE TABLE "Posts" (
 *      "debate" bool DEFAULT false,
 * +    "rejected" bool DEFAULT false,
 * +    "rejectedByUserId" varchar(27),
 *      "subforumTagId" varchar(27),
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "380d30e2ea28cacb71bbc6d29e540a6e";

import Comments from "../../server/collections/comments/collection";
import Posts from "../../server/collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, 'rejected');
  await addField(db, Posts, 'rejectedByUserId');
  await addField(db, Comments, 'rejected');
  await addField(db, Comments, 'rejectedByUserId');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, 'rejected');
  await dropField(db, Posts, 'rejectedByUserId');
  await dropField(db, Comments, 'rejected');
  await dropField(db, Comments, 'rejectedByUserId');
}
