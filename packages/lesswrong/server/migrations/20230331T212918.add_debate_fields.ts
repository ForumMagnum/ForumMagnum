/**
 * Generated on 2023-03-31T21:29:18.834Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index e34ec6f272..8e9c2c9de8 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 222d42945763fb6dcaff3b497911d7b7
 * -
 * --- Accepted on 2023-03-31T00:20:47.000Z by 20230331T002047.add_noComicSans_to_Users.ts
 * +-- Overall schema hash: 33b4ea4a4234276f8784ddff0eb3a974
 *  
 * @@ -108,3 +106,3 @@ CREATE TABLE "CommentModeratorActions" (
 *  
 * --- Schema for "Comments", hash: e869ffa2ef7db9015c6f8f8c6a579baf
 * +-- Schema for "Comments", hash: 31480d0beb75ffb592b7b20e68cbff13
 *  CREATE TABLE "Comments" (
 * @@ -157,2 +155,3 @@ CREATE TABLE "Comments" (
 *      "relevantTagIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
 * +    "debateResponse" bool,
 *      "af" bool DEFAULT false,
 * @@ -588,2 +587,3 @@ CREATE TABLE "Posts" (
 *      "commentCount" double precision DEFAULT 0,
 * +    "debate" bool DEFAULT false,
 *      "subforumTagId" varchar(27),
 * @@ -889,3 +889,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: dca06a3ff139a831e465b8a67f6f9e68
 * +-- Schema for "Users", hash: 80f05b0a0b0f1c525600d8b66b050f1c
 *  CREATE TABLE "Users" (
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "33b4ea4a4234276f8784ddff0eb3a974";

import Comments from "../../server/collections/comments/collection";
import Posts from "../../server/collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, 'debate');
  await addField(db, Comments, 'debateResponse');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, 'debate');
  await dropField(db, Comments, 'debateResponse');
}
