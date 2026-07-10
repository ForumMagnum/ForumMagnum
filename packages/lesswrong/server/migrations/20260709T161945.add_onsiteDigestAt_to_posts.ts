import { addField, dropField } from "./meta/utils";
import Posts from "../collections/posts/collection";
import DigestPosts from "../collections/digestPosts/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, DigestPosts, "onsiteDigestAt");
  await db.none(`
    UPDATE "DigestPosts"
    SET "onsiteDigestAt" = "createdAt"
    WHERE "onsiteDigestStatus" = 'yes'
  `);
  await addField(db, Posts, "onsiteDigestAt");
  await db.none(`
    UPDATE "Posts" p
    SET "onsiteDigestAt" = dp."latest"
    FROM (
      SELECT
        "postId",
        MAX("onsiteDigestAt") AS "latest"
      FROM "DigestPosts"
      WHERE "onsiteDigestStatus" = 'yes'
      GROUP BY "postId"
    ) dp
    WHERE p."_id" = dp."postId";
  `);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "onsiteDigestAt");
  await dropField(db, DigestPosts, "onsiteDigestAt");
}
