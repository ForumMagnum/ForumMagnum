/**
 * Generated on 2023-07-24T11:35:16.836Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * index 0cf1e5d2e6..3d73d236ca 100644
 * --- a/Users/wh/Documents/code/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/wh/Documents/code/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 1f4a770fddeffde4615bb22682170332
 * -
 * --- Accepted on 2023-07-19T20:21:58.000Z by 20230719T202158.top_level_comment_count.ts
 * +-- Overall schema hash: edd4ae60c5320ea4aa4d4e87bf92cafe
 *  
 * @@ -533,3 +531,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: dd038517e1407f815e01db8a29b4a854
 * +-- Schema for "Posts", hash: 5bfebdec4ea08ba7e454089afd808c34
 *  CREATE TABLE "Posts" (
 * @@ -539,2 +537,3 @@ CREATE TABLE "Posts" (
 *      "url" varchar(500),
 * +    "postCategory" text DEFAULT 'post',
 *      "title" varchar(500) NOT NULL,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "edd4ae60c5320ea4aa4d4e87bf92cafe";

import Posts from "../../server/collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "postCategory");
  // set postCategory to 'post' for all existing posts
  // set postCategory to 'linkpost' if post.url is not null or empty
  // set postCategory to 'question' if post.question is true
  await db.any(`
    UPDATE "Posts"
    SET "postCategory" = CASE
      WHEN "url" IS NOT NULL AND "url" != '' THEN 'linkpost'
      WHEN "question" = true THEN 'question'
      ELSE 'post'
    END
  `);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "postCategory");
}
