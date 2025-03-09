/**
 * Generated on 2023-07-19T20:21:58.027Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * index e9497df6c5..5915f0420d 100644
 * --- a/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/accepted_schema.sql
 * +++ b/Users/jbabcock/repositories/Lesserwrong/LessWrong2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 4b4e757dda0d5609834188196a6c1742
 * -
 * --- Accepted on 2023-07-07T15:28:42.000Z by 20230707T152842.migrate_socialPreview.ts
 * +-- Overall schema hash: 1f4a770fddeffde4615bb22682170332
 *  
 * @@ -533,3 +531,3 @@ CREATE TABLE "PostRelations" (
 *  
 * --- Schema for "Posts", hash: 2b65af6cd1fd340fd8a4955cfc038f7c
 * +-- Schema for "Posts", hash: dd038517e1407f815e01db8a29b4a854
 *  CREATE TABLE "Posts" (
 * @@ -665,2 +663,3 @@ CREATE TABLE "Posts" (
 *      "commentCount" double precision DEFAULT 0,
 * +    "topLevelCommentCount" double precision DEFAULT 0,
 *      "criticismTipsDismissed" bool,
 */
export const acceptsSchemaHash = "1f4a770fddeffde4615bb22682170332";


import Posts from "../../server/collections/posts/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "topLevelCommentCount");

  await db.any(`
    UPDATE "Posts"
    SET "topLevelCommentCount" = subquery."topLevelCommentCount"
    FROM (
        SELECT COUNT(*) AS "topLevelCommentCount", "postId"
        FROM "Comments"
        WHERE deleted is not true
        AND "parentCommentId" is null
        AND "postId" is not null
        GROUP BY "postId"
    ) AS subquery
    WHERE "Posts"._id = subquery."postId";
  `);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "topLevelCommentCount");
}
