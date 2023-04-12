import Posts from "../../lib/collections/posts/collection";
import { addField, dropField } from "./meta/utils";
import Comments from "../../lib/collections/comments/collection";

/**
 * Generated on 2023-04-12T00:50:55.949Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * index 3b73e0d65e..de09d261d5 100644
 * --- a/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/rbloom/git/lesswrongSuite/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 1728cb3d532414ce56d22566ab53c3be
 * -
 * --- Accepted on 2023-04-11T17:26:12.000Z by 20230411T172612.add_hideCommunitySection_to_users.ts
 * +-- Overall schema hash: 88c571d9dc61235c09b0e6e335a1c232
 *  
 * @@ -108,3 +106,3 @@ CREATE TABLE "CommentModeratorActions" (
 *  
 * --- Schema for "Comments", hash: 1c77433ee8754e841a073c882ee2f7ef
 * +-- Schema for "Comments", hash: 47f6b6206c616886b968bafeb94bc1c4
 *  CREATE TABLE "Comments" (
 * @@ -159,2 +157,3 @@ CREATE TABLE "Comments" (
 *      "rejected" bool DEFAULT false,
 * +    "rejectedReason" text,
 *      "rejectedByUserId" varchar(27),
 * @@ -461,3 +460,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: 3af0a7c4d804abbea3f2a8396a737aeb
 * +-- Schema for "Posts", hash: f4ca610b780ee8fc503c04e05fd7a646
 *  CREATE TABLE "Posts" (
 * @@ -593,2 +592,3 @@ CREATE TABLE "Posts" (
 *      "rejected" bool DEFAULT false,
 * +    "rejectedReason" text,
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
export const acceptsSchemaHash = "88c571d9dc61235c09b0e6e335a1c232";

export const up = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    await addField(db, Posts, 'rejectedReason');
  }
  
  if (Comments.isPostgres()) {
    await addField(db, Comments, 'rejectedReason');
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Posts.isPostgres()) {
    await dropField(db, Posts, 'rejectedReason');
  }
  
  if (Comments.isPostgres()) {
    await dropField(db, Comments, 'rejectedReason');
  }
}

