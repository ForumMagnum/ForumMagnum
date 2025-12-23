import { addField, dropField, updateIndexes } from "./meta/utils"
import Posts from "../collections/posts/collection";
import Comments from "../collections/comments/collection";

export const up = async ({db}: MigrationContext) => {
  await updateIndexes(Comments);
  await addField(db, Posts, "lastCommentReplyAt");
  await db.none(`
    UPDATE "Posts" p
    SET "lastCommentReplyAt" = q."lastReplyAt"
    FROM (
      SELECT
        c."postId",
        MAX(c."postedAt") AS "lastReplyAt"
      FROM "Comments" c
      WHERE c."parentCommentId" IS NOT NULL
      GROUP BY c."postId"
    ) q
    WHERE p."_id" = q."postId";
  `);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "lastCommentReplyAt");
}
