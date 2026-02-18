/**
 * Generated on 2023-04-13T18:46:26.414Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * index 366d0fa827..38f9b34e68 100644
 * --- a/Users/robert/Documents/repos/ForumMagnum/schema/accepted_schema.sql
 * +++ b/Users/robert/Documents/repos/ForumMagnum/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 64c57945e3105d8daf5be8d51a1ee559
 * -
 * --- Accepted on 2023-04-12T18:58:46.000Z by 20230412T185846.add_modGPTAnalysis.ts
 * +-- Overall schema hash: 1058503cdf3522b15f94b3499566433a
 *  
 * @@ -108,3 +106,3 @@ CREATE TABLE "CommentModeratorActions" (
 *  
 * --- Schema for "Comments", hash: aff61766f86b6129215dc4cd710aa12a
 * +-- Schema for "Comments", hash: 1a34920ecad5fd219e1d13d6025f4839
 *  CREATE TABLE "Comments" (
 * @@ -161,2 +159,3 @@ CREATE TABLE "Comments" (
 *      "modGPTRecommendation" text,
 * +    "rejectedReason" text,
 *      "rejectedByUserId" varchar(27),
 * @@ -463,3 +462,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: 3af0a7c4d804abbea3f2a8396a737aeb
 * +-- Schema for "Posts", hash: f4ca610b780ee8fc503c04e05fd7a646
 *  CREATE TABLE "Posts" (
 * @@ -595,2 +594,3 @@ CREATE TABLE "Posts" (
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
export const acceptsSchemaHash = "1058503cdf3522b15f94b3499566433a";

import Comments from "../../server/collections/comments/collection";
import Posts from "../../server/collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, 'rejectedReason');
  await addField(db, Comments, 'rejectedReason');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, 'rejectedReason');
  await dropField(db, Comments, 'rejectedReason');
}
