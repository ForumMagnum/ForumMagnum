import AbstractRepo from "./AbstractRepo";
import Comments from "../../lib/collections/comments/collection";

export default class CommentsRepo extends AbstractRepo<DbComment> {
  constructor() {
    super(Comments);
  }

  async getSearchDocuments(
    limit: number,
    offset: number,
  ): Promise<AlgoliaComment[]> {
    return this.getRawDb().any(`
      SELECT
        c."_id",
        c."_id" AS "objectID",
        c."userId",
        COALESCE(c."baseScore", 0) AS "baseScore",
        c."deleted" AS "isDeleted",
        c."deleted",
        c."retracted",
        c."spam",
        c."legacy",
        c."createdAt",
        c."postedAt",
        EXTRACT(EPOCH FROM c."postedAt") * 1000 AS "publicDateMs",
        c."af",
        author."slug" AS "authorSlug",
        author."displayName" AS "authorDisplayName",
        author."username" AS "authorUserName",
        c."postId",
        post."title" AS "postTitle",
        post."slug" AS "postSlug",
        post."isEvent" AS "postIsEvent",
        post."groupId" AS "postGroupId",
        fm_post_tag_ids(post."_id") AS "tags",
        CASE WHEN c."tagId" IS NULL
          THEN fm_post_tag_ids(post."_id")
          ELSE ARRAY(SELECT c."tagId")
        END AS "tags",
        fm_strip_html(c."contents"->>'html') AS "body"
      FROM "Comments" c
      LEFT JOIN "Users" author ON c."userId" = author."_id"
      LEFT JOIN "Posts" post on c."postId" = post."_id"
      WHERE
        c."deleted" IS NOT TRUE AND
        c."rejected" IS NOT TRUE AND
        c."authorIsUnreviewed" IS NOT TRUE
      ORDER BY c."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const result = await this.getRawDb().one(`
      SELECT COUNT(*)
      FROM "Comments" c
      WHERE
        c."deleted" IS NOT TRUE AND
        c."rejected" IS NOT TRUE AND
        c."authorIsUnreviewed" IS NOT TRUE
    `);
    return result.count;
  }
}
